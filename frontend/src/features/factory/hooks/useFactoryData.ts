import { useState, useEffect, useMemo } from 'react';
import { FACTORY_CONFIG } from '../data/factory.mock';
import type {
  FactoryConfig, FactoryStats, Machine, MachineStatus,
  MachineContext,
  FactoryBuilding, FactoryFloorLevel, FactoryRoom, ProductionLine
} from '../types/factory.types';
import api from '@/services/axios';
import { mapMachineAPIToUI } from '@/features/machine/services/machine.service';
import { useMachineStore } from '@/features/machine/store/machine.store';
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
  const refreshTrigger = useMachineStore(state => state.refreshTrigger);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [machinesRes, floorsRes, attendanceRes] = await Promise.all([
          api.get('/machines?limit=2000'),
          api.get('/floors'),
          api.get('/attendance/today').catch(() => ({ data: { data: [] } })),
        ]);

        if (!mounted) return;

        const rawMachines = machinesRes.data.data?.data || machinesRes.data.data || [];
        const rawFloors = floorsRes.data.data || [];
        const rawAttendances = attendanceRes.data?.data || [];

        // Build latest attendance maps per workerId AND per workerId+machineId
        const latestAttendanceByWorkerMachine = new Map<string, any>();
        const latestAttendanceByWorker = new Map<number, any>();

        rawAttendances.forEach((att: any) => {
          if (att.workerId && att.machineId) {
            const wmKey = `${att.workerId}_${att.machineId}`;
            const existingWM = latestAttendanceByWorkerMachine.get(wmKey);
            if (!existingWM || new Date(att.tapTime) > new Date(existingWM.tapTime)) {
              latestAttendanceByWorkerMachine.set(wmKey, att);
            }
          }

          if (att.workerId) {
            const existingW = latestAttendanceByWorker.get(att.workerId);
            if (!existingW || new Date(att.tapTime) > new Date(existingW.tapTime)) {
              latestAttendanceByWorker.set(att.workerId, att);
            }
          }
        });

        const mappedMachines = rawMachines.map((m: any, index: number) => {
          const uiMachine = mapMachineAPIToUI(m);

          let worker: any = null;
          let assignment: any = null;
          let attendanceState: 'present' | 'checked_out' | 'assigned_not_present' = 'assigned_not_present';
          let checkInTimeStr: string | undefined = undefined;
          let checkOutTimeStr: string | undefined = undefined;

          // Resolve assigned worker from Assignment OR ProductionTask
          const activeAssignment = m.assignments && m.assignments.length > 0 ? m.assignments[0] : null;
          const activeTask = m.productionTasks && m.productionTasks.length > 0 ? m.productionTasks[0] : null;

          const assignedWorkerData = activeAssignment?.worker || activeTask?.worker;

          if (assignedWorkerData) {
            // Priority 1: Exact worker + machine attendance record
            const exactAtt = latestAttendanceByWorkerMachine.get(`${assignedWorkerData.id}_${m.id}`);
            const generalAtt = latestAttendanceByWorker.get(assignedWorkerData.id);

            // Use exact worker+machine attendance, or general worker attendance ONLY if its machineId matches this machine
            const latestAtt = exactAtt || (generalAtt && Number(generalAtt.machineId) === Number(m.id) ? generalAtt : null);

            if (latestAtt?.attendanceType === 'IN') {
              attendanceState = 'present';
              checkInTimeStr = latestAtt.tapTime;
            } else if (latestAtt?.attendanceType === 'OUT') {
              attendanceState = 'checked_out';
              checkOutTimeStr = latestAtt.tapTime;
            } else {
              attendanceState = 'assigned_not_present';
            }

            worker = {
              id: assignedWorkerData.id.toString(),
              name: `${assignedWorkerData.firstName || ''} ${assignedWorkerData.lastName || ''}`.trim() || assignedWorkerData.employeeCode,
              role: 'Worker',
              department: uiMachine.department || 'General',
              employeeId: assignedWorkerData.employeeCode,
              shiftId: activeAssignment?.shiftId?.toString() || '1',
              grade: 'A',
              attendanceToday: attendanceState,
              checkInTime: checkInTimeStr,
              checkOutTime: checkOutTimeStr,
            };

            assignment = {
              id: (activeAssignment?.id || activeTask?.id || m.id).toString(),
              workerId: assignedWorkerData.id.toString(),
              machineId: m.id.toString(),
              operationId: activeTask?.operation?.id?.toString() || activeAssignment?.operationId?.toString() || '1',
              operationName: activeTask?.operation?.name || activeTask?.operation?.operationName || activeAssignment?.operation?.name || 'Sewing',
              projectName: activeTask?.productionOrder?.styleName || 'N/A',
              productionOrder: activeTask?.productionOrder?.orderNumber || 'N/A',
              departmentName: activeTask?.department?.name || 'Sewing Line',
              bundleId: activeTask?.bundleId?.toString() || '',
              startedAt: activeAssignment?.assignedAt || activeTask?.createdAt || new Date().toISOString(),
              targetPieces: activeTask?.targetQuantity || 100,
              completedPieces: 0
            };
          }

          // Machine seat status mapping:
          // 'running'     (Green)  = Assigned Worker is Checked IN (present)
          // 'offline'     (Amber)  = Assigned Worker Checked OUT mid-session / paused
          // 'idle'        (Blue)   = Assigned Worker not yet checked in
          // 'no_worker'   (Gray)   = Unassigned / Empty Seat
          // 'maintenance' (Red)    = Machine fault
          let status: MachineStatus = 'no_worker';
          if (worker) {
            if (attendanceState === 'present') {
              status = 'running';
            } else if (attendanceState === 'checked_out') {
              status = 'offline'; // Amber — paused / checked out
            } else {
              status = 'idle'; // Blue — assigned but hasn't tapped in yet
            }
          }

          const factoryMachine: Machine = {
            id: String(uiMachine.id),
            machineNumber: uiMachine.machineId || m.machineCode || `M-${m.id}`,
            machineType: String(uiMachine.type),
            status,
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
            isWorking: (attendanceState === 'present'),
            position: { row: m.rowIndex % 2 === 0 ? 'top' : 'bottom', index: m.positionIndex != null ? m.positionIndex : index },
            roomId: m.roomId ? String(m.roomId) : undefined,
            rowIndex: m.rowIndex != null ? Number(m.rowIndex) : undefined,
            positionIndex: m.positionIndex != null ? Number(m.positionIndex) : undefined,
            // Enriched context for Live Factory tooltip
            attendanceState,
            checkInTime: attendanceState === 'present' ? checkInTimeStr : undefined,
            checkOutTime: attendanceState === 'checked_out' ? checkOutTimeStr : undefined,
          };
          
          return factoryMachine;
        });

        const factoryFloors: FactoryFloorLevel[] = rawFloors.map((floor: any) => {
          const rooms: FactoryRoom[] = floor.rooms.map((room: any) => {
            const roomMachines = rawMachines.filter((m: any) => m.roomId === room.id);
            
            const rowMap = new Map<number, any[]>();
            roomMachines.forEach((m: any) => {
              const rowIndex = m.rowIndex || 0;
              if (!rowMap.has(rowIndex)) rowMap.set(rowIndex, []);
              rowMap.get(rowIndex)!.push(m);
            });

            const lines: ProductionLine[] = Array.from(rowMap.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([rowIndex, rowMachinesList]) => {
                const machineIds = rowMachinesList.map(m => String(m.machineCode));
                const mappedRowMachines = mappedMachines.filter((m: Machine) => machineIds.includes(m.id));
                
                mappedRowMachines.sort((a: Machine, b: Machine) => {
                  const m1 = rawMachines.find((rm: any) => String(rm.machineCode) === a.id);
                  const m2 = rawMachines.find((rm: any) => String(rm.machineCode) === b.id);
                  return (m1?.positionIndex || 0) - (m2?.positionIndex || 0);
                });

                return {
                  id: `room-${room.id}-row-${rowIndex}`,
                  lineNumber: rowIndex + 1,
                  lineName: `Row ${rowIndex + 1}`,
                  machines: mappedRowMachines
                };
              });

            return {
              id: `room-${room.id}`,
              name: room.roomName,
              roomType: 'stitching',
              lines: lines,
              machinesPerRow: room.machinesPerRow,
              rowsCount: room.rowsCount,
            };
          });

          return {
            id: `floor-${floor.id}`,
            floorNumber: floor.floorNumber,
            name: floor.name || `Floor ${floor.floorNumber}`,
            rooms: rooms
          };
        });

        const building: FactoryBuilding = {
          id: 'bldg-1',
          name: 'Main Production Facility',
          floors: factoryFloors,
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
    
    const intervalId = setInterval(() => {
      loadData();
    }, 15000);

    socketService.connect();
    
    const handleSyncUpdate = () => {
      loadData();
    };

    socketService.on('attendance.updated', handleSyncUpdate);
    socketService.on('machine.updated', handleSyncUpdate);
    socketService.on('bundle.updated', handleSyncUpdate);
    socketService.on('assignment.created', handleSyncUpdate);
    socketService.on('assignment.updated', handleSyncUpdate);
    socketService.on('dashboard.refresh', handleSyncUpdate);
    socketService.on('dashboard.livefloor.updated', handleSyncUpdate);

    return () => { 
      mounted = false; 
      clearInterval(intervalId);
      socketService.off('attendance.updated', handleSyncUpdate);
      socketService.off('machine.updated', handleSyncUpdate);
      socketService.off('bundle.updated', handleSyncUpdate);
      socketService.off('assignment.created', handleSyncUpdate);
      socketService.off('assignment.updated', handleSyncUpdate);
      socketService.off('dashboard.refresh', handleSyncUpdate);
      socketService.off('dashboard.livefloor.updated', handleSyncUpdate);
    };
  }, [refreshTrigger]);

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
