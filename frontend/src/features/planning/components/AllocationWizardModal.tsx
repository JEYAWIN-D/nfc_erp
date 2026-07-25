import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Cpu, CheckCircle, X, Layers, Box, Wrench, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanningMachine, PlanningWorker } from "../types/planning.types";
import { useFactoryData } from "../../factory/hooks/useFactoryData";

interface AllocationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationName: string;
  availableWorkers: PlanningWorker[];
  availableMachines: PlanningMachine[];
  initialAllocations?: { machineId: number, workerId: number, roomId?: string | number, rowIndex?: number, positionIndex?: number }[];
  allAssignments?: Record<number, { machineId: number, workerId: number, roomId?: string | number, rowIndex?: number, positionIndex?: number }[]>;
  activeOperationId?: number | null;
  requiredSkillId?: number | null;
  compatibleMachines?: string[];
  onSave: (allocations: { machineId: number, workerId: number, roomId: string | number, rowIndex: number, positionIndex: number }[]) => void;
}

export function AllocationWizardModal({
  isOpen,
  onClose,
  operationName,
  availableWorkers,
  availableMachines,
  initialAllocations = [],
  allAssignments = {},
  activeOperationId = null,
  requiredSkillId = null,
  compatibleMachines = [],
  onSave,
}: AllocationWizardModalProps) {
  const [allocations, setAllocations] = useState<{ machineId: number, workerId: number, roomId: string | number, rowIndex: number, positionIndex: number }[]>([]);
  
  // Which seat is currently being assigned
  const [activeSelectingSeat, setActiveSelectingSeat] = useState<{ roomId: string | number, rowIndex: number, positionIndex: number, label: string } | null>(null);
  
  // The machine selected for the active seat
  const [selectedMachineForSeat, setSelectedMachineForSeat] = useState<PlanningMachine | null>(null);
  
  // Factory Layout integration (floor/room grid only — machines come from real DB via availableMachines)
  const { config, loading: loadingLayout, allMachines = [] } = useFactoryData();
  const floors = config?.buildings?.[0]?.floors || [];
  
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // ─── Compute which machine/worker IDs are already used by OTHER operations or seats ───
  const usedMachineIds = React.useMemo(() => {
    const ids = new Set<number>();
    Object.entries(allAssignments).forEach(([opIdStr, allocs]) => {
      if (Number(opIdStr) !== Number(activeOperationId)) {
        allocs.forEach(a => ids.add(Number(a.machineId)));
      }
    });
    allocations.forEach(a => ids.add(Number(a.machineId)));
    return ids;
  }, [allAssignments, activeOperationId, allocations]);

  const usedWorkerIds = React.useMemo(() => {
    const ids = new Set<number>();
    Object.entries(allAssignments).forEach(([opIdStr, allocs]) => {
      if (Number(opIdStr) !== Number(activeOperationId)) {
        allocs.forEach(a => ids.add(Number(a.workerId)));
      }
    });
    allocations.forEach(a => ids.add(Number(a.workerId)));
    return ids;
  }, [allAssignments, activeOperationId, allocations]);

  const [machineSearchQuery, setMachineSearchQuery] = useState("");
  const [selectedMachineCategory, setSelectedMachineCategory] = useState<string>("All");

  // Mark machines used by OTHER operations as busy so they appear greyed out
  const effectiveMachines: PlanningMachine[] = React.useMemo(() => {
    let baseList: PlanningMachine[] = [];
    if (availableMachines && availableMachines.length > 0) {
      baseList = availableMachines;
    } else if (allMachines && allMachines.length > 0) {
      baseList = allMachines.map((m: any, idx: number) => ({
        id: typeof m.id === 'number' ? m.id : (idx + 1),
        machineCode: m.machineNumber || m.machineCode || `MCH-${String(idx + 1).padStart(3, '0')}`,
        machineName: m.machineName || m.name || m.machineNumber || `Machine ${idx + 1}`,
        departmentId: m.departmentId || m.department?.id || 1,
        machineType: { id: m.machineType?.id || 1, name: typeof m.machineType === 'object' ? (m.machineType?.name || "Juki Single Needle") : (m.type || m.machineType || "Juki Single Needle") },
        department: { id: m.department?.id || 1, name: typeof m.department === 'object' ? (m.department?.name || "Sewing") : (m.department || "Sewing") },
        assignments: m.status === 'running' ? [{ id: 1 }] : []
      }));
    }

    return baseList.map(m => {
      if (usedMachineIds.has(Number(m.id))) {
        return { ...m, assignments: [{ id: -1, _usedByOtherOp: true } as any] };
      }
      return m;
    });
  }, [availableMachines, allMachines, usedMachineIds]);

  const machineCategories = ["All", ...Array.from(new Set(effectiveMachines.map(m => m.machineType?.name).filter(Boolean)))];

  const filteredMachines = effectiveMachines.filter(m => {
    const searchLower = machineSearchQuery.toLowerCase();
    const name = m.machineName || '';
    const code = m.machineCode || '';
    const matchesSearch = name.toLowerCase().includes(searchLower) || 
                          code.toLowerCase().includes(searchLower);
    const matchesCategory = selectedMachineCategory === "All" || m.machineType?.name === selectedMachineCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAndSortedMachines = React.useMemo(() => {
    return filteredMachines.map(m => {
      const isCompatible = !compatibleMachines || compatibleMachines.length === 0 || compatibleMachines.includes(m.machineName);
      return { ...m, isCompatible };
    }).sort((a, b) => {
      // Available + compatible first, then incompatible, then busy
      const aBusy = (a.assignments?.length || 0) > 0;
      const bBusy = (b.assignments?.length || 0) > 0;
      if (!aBusy && bBusy) return -1;
      if (aBusy && !bBusy) return 1;
      if (a.isCompatible && !b.isCompatible) return -1;
      if (!a.isCompatible && b.isCompatible) return 1;
      return 0;
    });
  }, [filteredMachines, compatibleMachines]);

  const [workerSearchQuery, setWorkerSearchQuery] = useState("");

  // Filter & sort workers: available workers first, allocated/busy workers disabled at bottom
  const filteredAndSortedWorkers = React.useMemo(() => {
    let result = availableWorkers;

    if (workerSearchQuery) {
      const q = workerSearchQuery.toLowerCase();
      result = result.filter(w => 
        (w.firstName || '').toLowerCase().includes(q) || 
        (w.lastName || '').toLowerCase().includes(q) || 
        (w.employeeCode || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const aUsed = usedWorkerIds.has(Number(a.id)) || allocations.some(x => Number(x.workerId) === Number(a.id));
      const bUsed = usedWorkerIds.has(Number(b.id)) || allocations.some(x => Number(x.workerId) === Number(b.id));
      if (!aUsed && bUsed) return -1;
      if (aUsed && !bUsed) return 1;
      return 0;
    });
  }, [availableWorkers, workerSearchQuery, usedWorkerIds, allocations]);

  // Initialize with the first floor/room
  useEffect(() => {
    if (selectedFloorId || floors.length === 0) return;
    const floorWithRooms = floors.find(f => f.rooms.length > 0);
    if (floorWithRooms) {
      setSelectedFloorId(floorWithRooms.id);
      setSelectedRoomId(floorWithRooms.rooms[0].id);
    }
  }, [floors, selectedFloorId]);

  // Auto-heal stale IDs
  useEffect(() => {
    if (floors.length === 0) return;
    if (selectedFloorId) {
      const floor = floors.find(f => f.id === selectedFloorId);
      if (!floor) {
        setSelectedFloorId(floors[0].id);
        setSelectedRoomId(floors[0].rooms?.[0]?.id || null);
      } else if (selectedRoomId) {
        const roomExists = floor.rooms.some(r => r.id === selectedRoomId);
        if (!roomExists) {
          setSelectedRoomId(floor.rooms[0]?.id || null);
        }
      }
    }
  }, [floors, selectedFloorId, selectedRoomId]);

  useEffect(() => {
    if (isOpen) {
      // Map initial allocations if they have positional data
      const mapped = initialAllocations.filter(a => a.roomId !== undefined && a.roomId !== null).map(a => ({
         machineId: a.machineId,
         workerId: a.workerId,
         roomId: a.roomId!,
         rowIndex: a.rowIndex!,
         positionIndex: a.positionIndex!
      }));
      setAllocations(mapped);
      setActiveSelectingSeat(null);
      setSelectedMachineForSeat(null);
    }
  }, [isOpen, initialAllocations]);

  const handleSeatClick = (roomId: string | number, rowIndex: number, positionIndex: number, label: string) => {
    const isAlreadyAssigned = allocations.some(a => String(a.roomId) === String(roomId) && a.rowIndex === rowIndex && a.positionIndex === positionIndex);
    if (isAlreadyAssigned) {
      // Unassign
      setAllocations(prev => prev.filter(a => !(String(a.roomId) === String(roomId) && a.rowIndex === rowIndex && a.positionIndex === positionIndex)));
    } else {
      // Open selection popover for this seat
      setActiveSelectingSeat({ roomId, rowIndex, positionIndex, label });
      setSelectedMachineForSeat(null);
    }
  };

  const handleMachineSelect = (machine: PlanningMachine) => {
    setSelectedMachineForSeat(machine);
  };

  const handleWorkerSelect = (workerId: number) => {
    if (!activeSelectingSeat || !selectedMachineForSeat) return;
    
    setAllocations(prev => [
      ...prev,
      { 
        machineId: selectedMachineForSeat.id, 
        workerId, 
        roomId: activeSelectingSeat.roomId, 
        rowIndex: activeSelectingSeat.rowIndex, 
        positionIndex: activeSelectingSeat.positionIndex 
      }
    ]);
    setActiveSelectingSeat(null); 
    setSelectedMachineForSeat(null);
  };

  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-950/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Resource Allocation
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-sm">
                {operationName}
              </span>
            </h2>
            <div className="mt-2 text-sm text-white/50">
              Click on an empty seat to assign a machine and a worker to it.
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" /> Factory Floor Layout
              </h3>
              <div className="text-sm text-blue-400 font-medium bg-blue-500/10 px-3 py-1 rounded-full">
                {allocations.length} Seats Assigned
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 px-3 border-r border-white/10">
                <Layers className="w-4 h-4 text-white/40" />
                <select 
                  className="bg-transparent text-sm text-white outline-none cursor-pointer"
                  value={selectedFloorId || ''}
                  onChange={(e) => {
                    setSelectedFloorId(e.target.value);
                    const newFloor = floors.find(f => f.id === e.target.value);
                    if (newFloor && newFloor.rooms.length > 0) {
                      setSelectedRoomId(newFloor.rooms[0].id);
                    } else {
                      setSelectedRoomId(null);
                    }
                  }}
                >
                  {floors.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-900">{f.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2 px-3">
                <Box className="w-4 h-4 text-white/40" />
                <select 
                  className="bg-transparent text-sm text-white outline-none cursor-pointer"
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  disabled={!selectedFloor || selectedFloor.rooms.length === 0}
                >
                  {selectedFloor?.rooms.length === 0 && (
                     <option value="" disabled className="bg-zinc-900">No rooms available</option>
                  )}
                  {selectedFloor?.rooms.map(r => (
                    <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-max shadow-inner">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400" />
                <span className="text-sm font-medium text-white/80">Available Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400" />
                <span className="text-sm font-medium text-white/80">Assigned</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 rounded-xl border border-white/5 p-8 overflow-y-auto overflow-x-auto custom-scrollbar">
            
            <div className="w-full pb-10 space-y-16">
              {loadingLayout ? (
                <div className="flex items-center justify-center h-40 text-blue-400 animate-pulse">Loading Factory Layout...</div>
              ) : !selectedRoomId ? (
                <div className="text-center py-20 text-white/40 border border-dashed border-white/10 rounded-2xl">
                  Please select a valid Room.
                </div>
              ) : !selectedRoom ? (
                <div className="text-center py-20 text-white/40 border border-dashed border-white/10 rounded-2xl">
                  Room layout not found. Please re-select a valid room.
                </div>
              ) : selectedRoom.rowsCount === 0 ? (
                <div className="text-center py-20 text-white/40 border border-dashed border-white/10 rounded-2xl">
                  No production lines found in this room. Configure lines in the Factory Layout.
                </div>
              ) : (
                Array.from({ length: selectedRoom.rowsCount || 4 }).map((_, rowIdx) => {
                  const prefix = ['A', 'B', 'C', 'D'][rowIdx] || `R${rowIdx+1}`;
                  const lineName = `Line ${prefix}`;
                  const MACHINES_PER_ROW = selectedRoom.machinesPerRow || 35;
                  
                  return (
                    <div key={rowIdx} className="w-full">
                      <div className="relative bg-zinc-900/60 px-32 py-16 rounded-3xl border border-white/10 shadow-2xl min-w-max">
                        {/* Center Conveyor */}
                        <div className="absolute left-32 right-32 top-1/2 h-10 bg-zinc-950 -translate-y-1/2 rounded-full border border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full opacity-30 animate-conveyor absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #ffffff 10px, #ffffff 12px)' }}></div>
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>
                          <div className="relative z-10 bg-zinc-900/90 backdrop-blur-md px-6 py-1 rounded-full border border-white/20 text-white font-bold tracking-widest shadow-xl flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {lineName}
                          </div>
                        </div>
                        
                        {/* Slots */}
                        <div className="relative z-10 w-full min-w-max flex flex-col gap-14">
                          {/* Top Row (Even Indices) */}
                          <div className="flex gap-2">
                            {Array.from({ length: Math.ceil(MACHINES_PER_ROW / 2) }).map((_, slotIdx) => {
                              const absoluteIndex = slotIdx * 2;
                              const actualRoomId = selectedRoom.id.replace('room-', '');
                              const allocation = allocations.find(a => String(a.roomId) === actualRoomId && a.rowIndex === rowIdx && a.positionIndex === absoluteIndex);
                              
                              const physicalMachine = allMachines.find(m => String(m.roomId) === actualRoomId && m.rowIndex === rowIdx && m.positionIndex === absoluteIndex);
                              const isPhysicallyBusy = !!(physicalMachine && physicalMachine.assignment);

                              let isGloballyAssigned = false;
                              if (!allocation && activeOperationId) {
                                Object.entries(allAssignments).forEach(([opId, allocs]) => {
                                  if (Number(opId) !== activeOperationId) {
                                    if (allocs.some(a => 
                                      (a.roomId !== undefined && String(a.roomId) === actualRoomId && a.rowIndex === rowIdx && a.positionIndex === absoluteIndex) ||
                                      (physicalMachine && a.machineId === Number(physicalMachine.id))
                                    )) {
                                      isGloballyAssigned = true;
                                    }
                                  }
                                });
                              }
                              
                              const isUnavailable = isGloballyAssigned || isPhysicallyBusy;

                              const assignedMachine = allocation ? availableMachines.find(m => Number(m.id) === allocation.machineId) : undefined;
                              const assignedWorker = allocation ? availableWorkers.find(w => Number(w.id) === allocation.workerId) : undefined;

                              return (
                                <MachineNode 
                                  key={absoluteIndex} 
                                  label={`${prefix}${absoluteIndex + 1}`} 
                                  isSelected={!!allocation}
                                  isGloballyAssigned={isUnavailable}
                                  assignedMachine={assignedMachine}
                                  assignedWorker={assignedWorker}
                                  physicalMachine={physicalMachine}
                                  isPhysicallyBusy={isPhysicallyBusy}
                                  onClick={() => {
                                    if (isUnavailable) return;
                                    handleSeatClick(actualRoomId, rowIdx, absoluteIndex, `${prefix}${absoluteIndex + 1}`);
                                  }}
                                />
                              );
                            })}
                          </div>
                          {/* Bottom Row (Odd Indices) */}
                          <div className="flex gap-2 pl-8">
                            {Array.from({ length: Math.floor(MACHINES_PER_ROW / 2) }).map((_, slotIdx) => {
                              const absoluteIndex = slotIdx * 2 + 1;
                              const actualRoomId = selectedRoom.id.replace('room-', '');
                              const allocation = allocations.find(a => String(a.roomId) === actualRoomId && a.rowIndex === rowIdx && a.positionIndex === absoluteIndex);
                              
                              const physicalMachine = allMachines.find(m => String(m.roomId) === actualRoomId && m.rowIndex === rowIdx && m.positionIndex === absoluteIndex);
                              const isPhysicallyBusy = !!(physicalMachine && physicalMachine.assignment);

                              let isGloballyAssigned = false;
                              if (!allocation && activeOperationId) {
                                Object.entries(allAssignments).forEach(([opId, allocs]) => {
                                  if (Number(opId) !== activeOperationId) {
                                    if (allocs.some(a => 
                                      (a.roomId !== undefined && String(a.roomId) === actualRoomId && a.rowIndex === rowIdx && a.positionIndex === absoluteIndex) ||
                                      (physicalMachine && a.machineId === Number(physicalMachine.id))
                                    )) {
                                      isGloballyAssigned = true;
                                    }
                                  }
                                });
                              }
                              
                              const isUnavailable = isGloballyAssigned || isPhysicallyBusy;

                              const assignedMachine = allocation ? availableMachines.find(m => Number(m.id) === allocation.machineId) : undefined;
                              const assignedWorker = allocation ? availableWorkers.find(w => Number(w.id) === allocation.workerId) : undefined;

                              return (
                                <MachineNode 
                                  key={absoluteIndex} 
                                  label={`${prefix}${absoluteIndex + 1}`} 
                                  isSelected={!!allocation}
                                  isGloballyAssigned={isUnavailable}
                                  assignedMachine={assignedMachine}
                                  assignedWorker={assignedWorker}
                                  physicalMachine={physicalMachine}
                                  isPhysicallyBusy={isPhysicallyBusy}
                                  onClick={() => {
                                    if (isUnavailable) return;
                                    handleSeatClick(actualRoomId, rowIdx, absoluteIndex, `${prefix}${absoluteIndex + 1}`);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-zinc-950/50 flex justify-between items-center shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onSave(allocations)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            Confirm Assignments ({allocations.length})
          </button>
        </div>
      </motion.div>

      {/* Unified Selection Popover/Modal */}
      <AnimatePresence>
        {activeSelectingSeat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              setActiveSelectingSeat(null);
              setSelectedMachineForSeat(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-white/10 bg-zinc-950 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="bg-blue-500/20 text-blue-400 w-10 h-10 rounded-xl flex items-center justify-center font-black">
                      {activeSelectingSeat.label}
                    </div>
                    Assign to Seat {activeSelectingSeat.label}
                  </h3>
                  <div className="text-sm text-white/50 mt-1">
                    {!selectedMachineForSeat ? "Step 1: Select a machine for this seat" : "Step 2: Select a worker to operate the machine"}
                  </div>
                </div>
                <button onClick={() => {
                  setActiveSelectingSeat(null);
                  setSelectedMachineForSeat(null);
                }} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/20">
                {!selectedMachineForSeat ? (
                  /* Machine Selection */
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          placeholder="Search machines by name or code..."
                          value={machineSearchQuery}
                          onChange={(e) => setMachineSearchQuery(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                        <select
                          value={selectedMachineCategory}
                          onChange={(e) => setSelectedMachineCategory(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/30 focus:bg-white/5 transition-colors"
                        >
                          {machineCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {filteredAndSortedMachines.map(m => {
                      const isAllocatedLocally = allocations.some(a => a.machineId === m.id);
                      const isUsedByOtherOp = m.assignments?.some((a: any) => a._usedByOtherOp);
                      const isBusyGlobally = m.assignments && m.assignments.length > 0 && !isUsedByOtherOp;
                      const isAllocated = isAllocatedLocally || isBusyGlobally || isUsedByOtherOp;
                      
                      return (
                        <button
                          key={m.id}
                          disabled={isAllocated}
                          onClick={() => handleMachineSelect(m)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                            isUsedByOtherOp
                              ? "border-orange-500/20 bg-orange-500/5 opacity-50 cursor-not-allowed"
                              : isBusyGlobally
                                ? "border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
                                : isAllocatedLocally 
                                  ? "border-white/5 bg-zinc-950/50 opacity-50 cursor-not-allowed"
                                  : m.isCompatible === false
                                    ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50"
                                    : "border-white/10 bg-zinc-900 hover:bg-white/5 hover:border-white/30 hover:-translate-y-0.5 shadow-lg"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                            <Wrench className="w-6 h-6 text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-white truncate">{m.machineName}</div>
                            <div className="text-xs text-blue-400 font-mono mt-0.5 font-semibold">{m.machineCode}</div>
                            {m.machineType?.name && (
                              <div className="mt-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                  {m.machineType.name}
                                </span>
                              </div>
                            )}
                          </div>
                          {isAllocatedLocally && !isBusyGlobally && !isUsedByOtherOp && (
                            <div className="text-xs font-black text-amber-500/80 uppercase tracking-widest">In Use Here</div>
                          )}
                          {isUsedByOtherOp && (
                            <div className="text-[10px] font-black text-orange-400/90 uppercase tracking-widest text-right leading-tight">Used by<br/>Other Op</div>
                          )}
                          {isBusyGlobally && !isUsedByOtherOp && (
                            <div className="text-xs font-black text-red-500/80 uppercase tracking-widest">Busy</div>
                          )}
                          {!isAllocated && m.isCompatible === false && (
                            <div className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-md max-w-[80px] text-center leading-tight">Wrong Type</div>
                          )}
                        </button>
                      );
                    })}
                      {filteredAndSortedMachines.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-white/40 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                          No machines found matching your criteria.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Worker Selection */
                  <div className="flex flex-col h-full">
                    <div className="mb-6 flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                       <CheckCircle className="w-5 h-5" />
                       <div>
                         <div className="text-xs font-semibold uppercase tracking-wider text-blue-500/70">Selected Machine</div>
                         <div className="font-bold text-white">{selectedMachineForSeat.machineName} <span className="text-blue-400 opacity-70 ml-2">({selectedMachineForSeat.machineCode})</span></div>
                       </div>
                       <button 
                         onClick={() => setSelectedMachineForSeat(null)}
                         className="ml-auto text-xs font-bold text-blue-400 hover:text-white px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 transition-colors"
                       >
                         Change
                       </button>
                    </div>

                    <div className="mb-4 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search workers by name or code..."
                        value={workerSearchQuery}
                        onChange={(e) => setWorkerSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredAndSortedWorkers.map(w => {
                        const isAllocatedLocally = allocations.some(a => Number(a.workerId) === Number(w.id));
                        const isUsedInOtherOp = usedWorkerIds.has(Number(w.id)) && !isAllocatedLocally;
                        const isBusyInDB = (w.assignments && w.assignments.length > 0);
                        const isBusy = isAllocatedLocally || isUsedInOtherOp || isBusyInDB;

                        return (
                          <button
                            key={w.id}
                            disabled={isBusy}
                            onClick={() => handleWorkerSelect(Number(w.id))}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                              isUsedInOtherOp
                                ? "border-amber-500/30 bg-amber-500/5 opacity-50 cursor-not-allowed"
                                : isBusyInDB
                                  ? "border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed"
                                  : isAllocatedLocally 
                                    ? "border-blue-500/30 bg-blue-500/5 opacity-50 cursor-not-allowed"
                                    : "border-white/10 bg-zinc-900 hover:bg-white/5 hover:border-white/30 hover:-translate-y-0.5 shadow-lg"
                            )}
                          >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                              <Users className="w-6 h-6 text-white/40" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base text-white truncate">{w.firstName} {w.lastName}</div>
                              <div className="text-xs text-white/50 font-mono mt-1 font-semibold">
                                {w.employeeCode} <span className="opacity-40 ml-1">|</span> <span className="ml-1 text-emerald-400/80">{w.grade?.name || 'Grade A - Expert'}</span>
                              </div>
                            </div>
                            {isAllocatedLocally && (
                              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">Assigned Here</div>
                            )}
                            {isUsedInOtherOp && (
                              <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Already Allocated</div>
                            )}
                            {isBusyInDB && !isAllocatedLocally && !isUsedInOtherOp && (
                              <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">Busy</div>
                            )}
                          </button>
                        );
                      })}
                      {filteredAndSortedWorkers.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-white/40 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                          No workers available for this operation.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MachineNode({ 
  label, isSelected, isGloballyAssigned, assignedMachine, assignedWorker, physicalMachine, isPhysicallyBusy, isTopRow, onClick 
}: { 
  label: string, isSelected: boolean, isGloballyAssigned?: boolean, assignedMachine?: PlanningMachine, assignedWorker?: PlanningWorker, physicalMachine?: any, isPhysicallyBusy?: boolean, isTopRow?: boolean, onClick: () => void 
}) {
  const statusColor = isGloballyAssigned
    ? 'border-red-500/50 bg-red-500/10 opacity-80 cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.1)]'
    : isSelected 
      ? 'border-red-600 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
      : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/5 shadow-inner cursor-pointer';

  const dotColor = isGloballyAssigned ? 'bg-red-500' : isSelected ? 'bg-red-400' : 'bg-emerald-500';

  return (
    <motion.div 
      whileHover={isGloballyAssigned ? {} : { y: -4, scale: 1.05 }}
      whileTap={isGloballyAssigned ? {} : { y: 0, scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "w-[4.5rem] h-[4.5rem] rounded-xl border-x border-t border-b-4 flex flex-col items-center justify-center shrink-0 relative group shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-colors",
        statusColor
      )}
      title={isGloballyAssigned ? `Seat ${label}\nAllocated to another operation` : isSelected ? `${assignedMachine?.machineName} - ${assignedWorker?.firstName}\nClick to unassign` : `Seat ${label}\nClick to assign`}
    >
      <div className={cn("absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 transition-all duration-300 z-20", dotColor)} />

      <span className={cn("text-xl font-black tracking-tighter relative z-10", isSelected ? "text-red-400 mb-0.5" : "text-white/20")}>
        {label}
      </span>
      
      {isSelected && assignedMachine && (
        <span className="text-[9px] font-bold text-white/60 tracking-wider relative z-10">
          {assignedMachine.machineCode}
        </span>
      )}
      
      {isGloballyAssigned && physicalMachine && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 z-20">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -bottom-1 w-8 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10" />
      )}

      {/* Explicitly show assigned worker name when selected */}
      <AnimatePresence>
        {isSelected && assignedWorker && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 flex flex-col items-center border border-white/10",
              isTopRow ? "top-full mt-2" : "bottom-full mb-2"
            )}
          >
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 border-white/10",
              isTopRow ? "-top-1 border-l border-t" : "-bottom-1 border-r border-b"
            )} />
            <span className="relative z-10 truncate max-w-[80px]">{assignedWorker.firstName}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
