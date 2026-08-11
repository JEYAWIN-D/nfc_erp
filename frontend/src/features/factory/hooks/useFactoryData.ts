import { useState, useEffect, useMemo } from 'react';
import { FACTORY_CONFIG } from '../data/factory.mock';
import type {
  FactoryConfig, FactoryStats, Machine, MachineStatus,
  MachineContext,
  FactoryBuilding, FactoryFloorLevel, FactoryRoom, ProductionLine, RoomType
} from '../types/factory.types';
import api from '@/services/axios';
import { mapMachineAPIToUI } from '@/features/machine/services/machine.service';
import { socketService } from '@/services/socket';

export function useFactoryData(): {
  config: FactoryConfig;
  stats: FactoryStats;
  allMachines: Machine[];
  getMachineById: (id: string) => Machine | undefined;
  getMachineContext: (id: string) => MachineContext | undefined;
  loading: boolean;
} {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<FactoryConfig>(FACTORY_CONFIG);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [machinesRes, floorsRes] = await Promise.all([
          api.get('/machines?limit=2000'), // increased limit to support 420+ machines
          api.get('/floors')
        ]);

        if (!mounted) return;

        const rawMachines = machinesRes.data.data?.data || machinesRes.data.data || [];
        const rawFloors = floorsRes.data?.data || floorsRes.data || [];

        const mappedMachines: Machine[] = rawMachines.map((m: any, index: number) => {
          const uiMachine = mapMachineAPIToUI(m);
          
          let worker: any = null;
          let assignment: any = null;
          
          if (m.assignments && m.assignments.length > 0) {
            const activeAssignment = m.assignments[0];
            if (activeAssignment.worker) {
               worker = {
                 id: activeAssignment.worker.id.toString(),
                 name: `${activeAssignment.worker.firstName} ${activeAssignment.worker.lastName}`,
                 photo: undefined,
                 role: 'Worker',
                 department: uiMachine.department || 'General',
                 employeeId: activeAssignment.worker.employeeCode,
                 shiftId: activeAssignment.shiftId?.toString() || '1',
                 grade: 'A',
                 attendanceToday: 'present',
                 checkInTime: new Date().toISOString()
               };
            }
            assignment = {
              id: activeAssignment.id.toString(),
              workerId: activeAssignment.workerId.toString(),
              machineId: activeAssignment.machineId.toString(),
              operationId: activeAssignment.operationId?.toString() || '1',
              operationName: 'Sewing', 
              bundleId: '',
              startedAt: activeAssignment.assignedAt,
              targetPieces: 100,
              completedPieces: 0
            };
          }

          const factoryMachine: Machine = {
            id: String(uiMachine.id),
            machineNumber: uiMachine.machineId || m.machineCode || `M-${m.id}`,
            machineType: String(uiMachine.type),
            status: worker ? 'running' : ((uiMachine.status as any) === 'active' || uiMachine.status === 'running' ? 'no_worker' : 'idle'),
            department: uiMachine.department || 'General',
            worker,
            assignment,
            bundle: null,
            healthScore: uiMachine.healthScore || 100,
            uptimePercent: 99,
            efficiency: uiMachine.efficiency || 0,
            lastMaintenance: new Date().toISOString().split('T')[0],
            nextMaintenanceDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            temperatureC: uiMachine.temperature || 30,
            powerStatus: 'on',
            networkStatus: 'online',
            todayTimeline: [],
            position: { row: m.positionIndex % 2 === 0 ? 'bottom' : 'top', index: m.positionIndex || index },
            roomId: m.roomId,
            rowIndex: m.rowIndex
          };
          
          return factoryMachine;
        });

        const floors: FactoryFloorLevel[] = rawFloors.map((floor: any) => {
          const rooms: FactoryRoom[] = (floor.rooms || []).map((room: any) => {
            const roomMachines = mappedMachines.filter((m: any) => m.roomId === room.id);
            
            // Group machines by rowIndex
            const rowMap = new Map<number, Machine[]>();
            roomMachines.forEach((m: any) => {
              const rIndex = m.rowIndex || 1;
              if (!rowMap.has(rIndex)) {
                rowMap.set(rIndex, []);
              }
              rowMap.get(rIndex)!.push(m);
            });
            
            const lines: ProductionLine[] = Array.from(rowMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([rIndex, machines]) => ({
                id: `line-${room.id}-${rIndex}`,
                lineNumber: rIndex,
                lineName: `Row ${rIndex}`,
                machines
              }));

            return {
              id: `room-${room.id}`,
              name: room.name,
              roomType: room.roomType || 'stitching',
              lines
            };
          });

          return {
            id: `floor-${floor.id}`,
            floorNumber: floor.floorNumber,
            name: floor.name || `Floor ${floor.floorNumber}`,
            rooms
          };
        });

        const building: FactoryBuilding = {
          id: 'bldg-1',
          name: 'Main Production Facility',
          floors: floors.length > 0 ? floors : [{
             id: 'floor-default',
             floorNumber: 1,
             name: 'Default Floor',
             rooms: [{
               id: 'room-default',
               name: 'Default Room',
               roomType: 'stitching',
               lines: [{
                 id: 'line-default',
                 lineNumber: 1,
                 lineName: 'Row 1',
                 machines: mappedMachines
               }]
             }]
          }]
        };

        setConfig({
          id: 'factory-1',
          name: 'NFC Garment Production Facility',
          location: 'Chennai, Tamil Nadu',
          buildings: [building],
          lastUpdated: new Date().toISOString()
        });

      } catch (err) {
        console.error("Failed to load factory data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    
    // Auto refresh every 10 seconds
    const intervalId = setInterval(() => {
      loadData();
    }, 10000);

    const socket = socketService.connect();
    const handleBundleUpdated = (bundle: any) => {
      setConfig(prevConfig => {
        const nextConfig = { ...prevConfig };
        nextConfig.buildings = nextConfig.buildings.map(bldg => ({
          ...bldg,
          floors: bldg.floors.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => ({
              ...room,
              lines: room.lines.map(line => ({
                ...line,
                machines: line.machines.map(m => {
                  if (m.id === String(bundle.currentMachineId)) {
                    // Update this machine's bundle status
                    return {
                      ...m,
                      bundle: {
                        id: String(bundle.id),
                        bundleNumber: bundle.bundleNumber,
                        status: bundle.status
                      }
                    };
                  }
                  return m;
                })
              }))
            }))
          }))
        }));
        return nextConfig;
      });
    };

    socket.on('BUNDLE_UPDATED', handleBundleUpdated);

    return () => { 
      mounted = false; 
      clearInterval(intervalId);
      socket.off('BUNDLE_UPDATED', handleBundleUpdated);
    };
  }, []);

  const allMachines = useMemo<Machine[]>(() =>
    config.buildings.flatMap((b) =>
      b.floors.flatMap((f) =>
        f.rooms.flatMap((r) =>
          r.lines.flatMap((l) => l.machines)
        )
      )
    ),
  [config]);

  const stats = useMemo<FactoryStats>(() => {
    const byStatus: Record<MachineStatus, number> = {
      running: 0, idle: 0, offline: 0, maintenance: 0, no_worker: 0,
    };
    allMachines.forEach((m) => { byStatus[m.status]++; });

    const totalFloors = config.buildings.reduce((a, b) => a + b.floors.length, 0);
    const totalRooms  = config.buildings.reduce((a, b) =>
      a + b.floors.reduce((a2, f) => a2 + f.rooms.length, 0), 0);
    const totalLines  = config.buildings.reduce((a, b) =>
      a + b.floors.reduce((a2, f) =>
        a2 + f.rooms.reduce((a3, r) => a3 + r.lines.length, 0), 0), 0);

    return {
      totalMachines: allMachines.length,
      byStatus,
      activeWorkers: allMachines.filter((m) => m.worker !== null).length,
      totalBuildings: config.buildings.length,
      totalFloors,
      totalRooms,
      totalLines,
      productionToday: 0,
      activeBundles: 0,
      qcPassRate: 0,
      alertsCount: 0,
      absentWorkers: 0,
    };
  }, [allMachines, config]);

  const getMachineById = useMemo(
    () => (id: string) => allMachines.find((m) => m.id === id),
    [allMachines]
  );

  const getMachineContext = useMemo(
    () => (id: string): MachineContext | undefined => {
      for (const building of config.buildings) {
        for (const floor of building.floors) {
          for (const room of floor.rooms) {
            for (const line of room.lines) {
              const machine = line.machines.find((m) => m.id === id);
              if (machine) return { machine, line, room, floor, building };
            }
          }
        }
      }
      return undefined;
    },
    [config]
  );

  return { config, stats, allMachines, getMachineById, getMachineContext, loading };
}
