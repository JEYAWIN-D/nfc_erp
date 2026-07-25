import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFactoryData } from './hooks/useFactoryData';
import { LayoutList, Map as MapIcon, Search, ChevronRight, Layers, Box, Cpu, Server, User, Plus, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMachineStore } from "../machine/store/machine.store";
import { MachineDetailsDrawer } from "../machine/components/MachineDetailsDrawer";
import { AddFloorDialog } from "../factory-layout/components/AddFloorDialog";
import { FloorDetailsDrawer } from "../factory-layout/components/FloorDetailsDrawer";
import { floorService } from "../factory-layout/services/floor.service";
import { toast } from "sonner";
import type { FactoryFloorLevel, FactoryRoom, Machine } from './types/factory.types';

export default function LiveFactoryPage() {
  const { config, allMachines, loading } = useFactoryData();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [userReset, setUserReset] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [layoutFloor, setLayoutFloor] = useState<any>(null);

  const buildings = config?.buildings || [];
  const floors = buildings[0]?.floors || [];

  const selectedFloor = floors.find(f => f.id === selectedFloorId) || floors[0];
  const selectedRoom = selectedFloor?.rooms?.find(r => r.id === selectedRoomId);

  // Auto-select single main floor on initial mount unless user explicitly navigated back to Factory
  useEffect(() => {
    if (floors.length === 1 && !selectedFloorId && !userReset) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId, userReset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-zinc-950">
        <div className="text-emerald-500 animate-pulse font-medium">Loading factory layout...</div>
      </div>
    );
  }

  const query = (search || '').toLowerCase().trim();

  // Filter floors based on search with safe null guards
  const filteredFloors = floors.filter(f => {
    if (!query) return true;
    if ((f.name || '').toLowerCase().includes(query)) return true;
    // Check if any room matches
    if ((f.rooms || []).some(r => (r.name || '').toLowerCase().includes(query))) return true;
    // Check if any machine in the floor matches
    const floorMachineIds = (f.rooms || []).flatMap(r => (r.lines || []).flatMap(l => (l.machines || []).map(m => m.id)));
    const matchingMachines = allMachines.filter(m =>
      floorMachineIds.includes(m.id) &&
      ((m.machineNumber || '').toLowerCase().includes(query) ||
       (m.worker?.name || '').toLowerCase().includes(query) ||
       (m.department || '').toLowerCase().includes(query))
    );
    return matchingMachines.length > 0;
  });

  const totalGlobalFloors = floors.length;
  const totalGlobalMachines = allMachines.length;
  const assignedGlobalMachines = allMachines.filter(m => m.status === 'running').length;
  const idleGlobalMachines = allMachines.filter(m => m.status !== 'running').length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header & Breadcrumbs */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
          <button
            onClick={() => { setUserReset(true); setSelectedFloorId(null); setSelectedRoomId(null); }}
            className={cn("hover:text-white transition-colors cursor-pointer", !selectedFloorId ? "text-emerald-400 font-bold" : "text-white/50")}
          >
            Factory
          </button>

          {selectedFloorId && (
            <>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <button
                onClick={() => setSelectedRoomId(null)}
                className={cn("hover:text-white transition-colors", selectedFloorId && !selectedRoomId ? "text-emerald-400 font-bold" : "text-white/50")}
              >
                {selectedFloor?.name || 'Floor'}
              </button>
            </>
          )}

          {selectedRoomId && (
            <>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <span className="text-emerald-400 font-bold">
                {selectedRoom?.name || 'Room'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search floors, rooms, machines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-white/30 text-white placeholder:text-white/30"
            />
          </div>

          <button
            onClick={() => setIsAddFloorOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Floor
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-6 flex-1 flex flex-col">
        {!selectedFloorId && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-xl">
              <div className="text-3xl font-bold text-white mb-1">{totalGlobalFloors}</div>
              <div className="text-xs text-white/50 uppercase font-semibold">Total Floors</div>
            </div>
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-xl">
              <div className="text-3xl font-bold text-white mb-1">{totalGlobalMachines}</div>
              <div className="text-xs text-white/50 uppercase font-semibold">Total Machines</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{assignedGlobalMachines}</div>
              <div className="text-xs text-emerald-500/70 uppercase font-semibold">Assigned (Running)</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
              <div className="text-3xl font-bold text-amber-400 mb-1">{idleGlobalMachines}</div>
              <div className="text-xs text-amber-500/70 uppercase font-semibold">Idle / Offline / Empty</div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-max shadow-inner flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-sm font-medium text-white/80">Worker Present / Running (Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-sm font-medium text-white/80">Worker Assigned (Blue)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-sm font-medium text-white/80">Worker Checked Out / Absent (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-white/20 bg-white/[0.02]" />
            <span className="text-sm font-medium text-white/80">Unassigned Seat</span>
          </div>
        </div>

        {!selectedFloorId ? (
          <FloorSelection floors={filteredFloors} onSelect={setSelectedFloorId} onManageLayout={(f) => setLayoutFloor(f)} />
        ) : !selectedRoomId ? (
          <RoomSelection rooms={selectedFloor?.rooms || []} onSelect={setSelectedRoomId} />
        ) : selectedRoom ? (
          <RoomLayout room={selectedRoom} search={search} />
        ) : (
          <div className="text-center text-white/40 py-20">Room layout not found.</div>
        )}
      </div>

      {/* Layout Management Dialogs */}
      <AddFloorDialog
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        onSuccess={() => {
          setIsAddFloorOpen(false);
          useMachineStore.getState().triggerRefresh();
        }}
      />

      {layoutFloor && (
        <FloorDetailsDrawer
          floor={layoutFloor}
          onClose={() => setLayoutFloor(null)}
          onUpdate={() => {
            useMachineStore.getState().triggerRefresh();
          }}
        />
      )}

      {/* Machine Details Drawer */}
      <MachineDetailsDrawer />
    </div>
  );
}

// ─── Floor Selection ─────────────────────────────────────────────────────────

function FloorSelection({ floors, onSelect, onManageLayout }: { floors: FactoryFloorLevel[], onSelect: (id: string) => void, onManageLayout: (floor: any) => void }) {
  if (floors.length === 0) return <div className="text-center text-white/40 py-20">No floors found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {floors.map(floor => {
        const totalRooms = floor.rooms.length;
        const allFloorMachines = floor.rooms.flatMap(r => r.lines.flatMap(l => l.machines));
        const totalMachines = allFloorMachines.length;
        const totalCapacity = floor.rooms.reduce((acc, r: any) => acc + ((r.rowsCount || 4) * (r.machinesPerRow || 35)), 0);
        const assignedMachines = allFloorMachines.filter(m => m.status === 'running').length;
        const idleMachines = allFloorMachines.filter(m => m.status !== 'running').length;
        const assignedPercentage = totalCapacity === 0 ? 0 : Math.round((assignedMachines / totalCapacity) * 100);

        const floorNum = Number(floor.id.replace(/\D/g, '')) || floor.floorNumber || 1;

        return (
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            key={floor.id}
            onClick={() => onSelect(floor.id)}
            className="group cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:border-emerald-500/50 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.15)] flex flex-col justify-between overflow-hidden relative"
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{floor.name}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageLayout({ id: floorNum, name: floor.name, floorNumber: floor.floorNumber });
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Configure Rooms & Layout"
                >
                  <Settings className="w-3.5 h-3.5" /> Layout
                </button>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to permanently DELETE floor "${floor.name}"? All rooms and line configurations inside will be removed.`)) {
                      try {
                        await floorService.delete(floorNum);
                        toast.success(`Floor ${floor.name} deleted successfully.`);
                        useMachineStore.getState().triggerRefresh();
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || err.message || "Failed to delete floor.");
                      }
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center justify-center"
                  title="Delete Entire Floor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative z-10 mb-6">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-emerald-400">{assignedPercentage}% Assigned</span>
                <span className="text-white/40">{totalCapacity} Total Seats</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${assignedPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 relative z-10">
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner">
                <div className="text-xl font-bold text-white mb-1">{totalRooms}</div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">Rooms</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner">
                <div className="text-xl font-bold text-white mb-1">{totalMachines}</div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">Machines</div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 shadow-inner">
                <div className="text-xl font-bold text-emerald-400 mb-1">{assignedMachines}</div>
                <div className="text-[10px] text-emerald-500/70 uppercase font-semibold">Assigned</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 shadow-inner">
                <div className="text-xl font-bold text-amber-400 mb-1">{idleMachines}</div>
                <div className="text-[10px] text-amber-500/70 uppercase font-semibold">Idle</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Room Selection ──────────────────────────────────────────────────────────

function RoomSelection({ rooms, onSelect }: { rooms: FactoryRoom[], onSelect: (id: string) => void }) {
  if (rooms.length === 0) return <div className="text-center text-white/40 py-20">No rooms found on this floor.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map(room => {
        const totalRows = room.lines.length;
        const allRoomMachines = room.lines.flatMap(l => l.machines);
        const totalMachines = allRoomMachines.length;
        const totalCapacity = (room as any).rowsCount * ((room as any).machinesPerRow || 35);
        const assignedMachines = allRoomMachines.filter(m => m.status === 'running').length;
        const idleMachines = allRoomMachines.filter(m => m.status !== 'running').length;
        const assignedPercentage = totalCapacity === 0 ? 0 : Math.round((assignedMachines / totalCapacity) * 100);

        return (
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            key={room.id}
            onClick={() => onSelect(room.id)}
            className="group cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:border-blue-500/50 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] flex flex-col justify-between overflow-hidden relative"
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{room.name}</h3>
                <p className="text-sm text-white/40 capitalize">{room.roomType || 'Production'} Room</p>
              </div>
            </div>

            <div className="relative z-10 mb-6">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-blue-400">{assignedPercentage}% Assigned</span>
                <span className="text-white/40">{totalCapacity} Total Seats</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${assignedPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 relative z-10">
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner">
                <div className="text-xl font-bold text-white mb-1">{totalRows}</div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">Rows</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner">
                <div className="text-xl font-bold text-white mb-1">{totalMachines}</div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">Machines</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 shadow-inner">
                <div className="text-xl font-bold text-blue-400 mb-1">{assignedMachines}</div>
                <div className="text-[10px] text-blue-500/70 uppercase font-semibold">Assigned</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 shadow-inner">
                <div className="text-xl font-bold text-amber-400 mb-1">{idleMachines}</div>
                <div className="text-[10px] text-amber-500/70 uppercase font-semibold">Idle</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Room Layout (Machines Grid) ─────────────────────────────────────────────

const ROW_PREFIXES = ['A', 'B', 'C', 'D'];
function RoomLayout({ room, search }: { room: FactoryRoom, search: string }) {

  const numRows = room.rowsCount || 4;
  const machinesPerRow = room.machinesPerRow || 35;

  const rows = Array.from({ length: numRows }, (_, i) => {
    const prefix = ROW_PREFIXES[i] || `R${i + 1}`;
    const lineName = `Line ${prefix}`;
    const roomLine = room.lines.find(l => l.lineNumber === i + 1);
    const rowMachines = roomLine?.machines || [];

    return (
      <div key={i} className="mb-16 last:mb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-sm font-medium text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/10 shadow-sm">
            {rowMachines.length} / {machinesPerRow} Machines Active
          </div>
        </div>

        <div className="relative bg-zinc-900/60 px-32 py-28 rounded-3xl border border-white/10 shadow-2xl overflow-x-auto min-w-max">
          {/* Center Table / Conveyor */}
          <div className="absolute left-32 right-32 top-1/2 h-10 bg-zinc-950 -translate-y-1/2 rounded-full border border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
            {/* Animated Conveyor Belt Pattern */}
            <div className="w-full h-full opacity-30 animate-conveyor absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #ffffff 10px, #ffffff 12px)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>

            {/* Centered Row Name */}
            <div className="relative z-10 bg-zinc-900/90 backdrop-blur-md px-6 py-1 rounded-full border border-white/20 text-white font-bold tracking-widest shadow-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {lineName}
            </div>
          </div>

          {/* Slots */}
          <div className="relative z-10 w-full min-w-max flex flex-col gap-12 pt-2 pb-2">
            <div className="flex gap-4">
              {Array.from({ length: Math.ceil(machinesPerRow / 2) }, (_, slotIdx) => {
                const absoluteIndex = slotIdx * 2;
                const machine = rowMachines.find(m => (m.positionIndex ?? m.position?.index) === absoluteIndex);
                return <MachineNode key={absoluteIndex} label={`${prefix}${absoluteIndex + 1}`} number={absoluteIndex + 1} machine={machine} search={search} isTopRow={true} />;
              })}
            </div>
            <div className="flex gap-4 pl-10">
              {Array.from({ length: Math.floor(machinesPerRow / 2) }, (_, slotIdx) => {
                const absoluteIndex = slotIdx * 2 + 1;
                const machine = rowMachines.find(m => (m.positionIndex ?? m.position?.index) === absoluteIndex);
                return <MachineNode key={absoluteIndex} label={`${prefix}${absoluteIndex + 1}`} number={absoluteIndex + 1} machine={machine} search={search} isTopRow={false} />;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="w-full pb-10">
      {rows}
    </div>
  );
}
function MachineNode({ label, number, machine, search, isTopRow }: { label: string, number: number, machine?: Machine, search: string, isTopRow?: boolean }) {

  const query = (search || '').toLowerCase().trim();
  const isMatch = !!query && !!machine && (
    ((machine.machineNumber || '').toLowerCase().includes(query)) ||
    (machine.worker?.name && machine.worker.name.toLowerCase().includes(query)) ||
    (machine.assignment?.operationName && machine.assignment.operationName.toLowerCase().includes(query)) ||
    (machine.department && machine.department.toLowerCase().includes(query))
  );

  const hasWorker = !!machine?.worker;
  const attendanceState = machine?.attendanceState;

  // 4-state color system:
  // Green  = present / working
  // Amber  = checked_out / paused mid-session
  // Blue   = assigned but never checked in yet
  // Gray   = no worker assigned
  // Red    = offline / maintenance fault
  const isOffline = machine?.status === 'maintenance';
  const isWorking = hasWorker && attendanceState === 'present';
  const isCheckedOut = hasWorker && attendanceState === 'checked_out';
  const isAssignedNotStarted = hasWorker && attendanceState === 'assigned_not_present';

  // Only render machine node if an active assignment or task was created for this seat in Planning
  const isSeatAssignedInPlanning = !!machine && (!!machine.assignment || !!machine.worker);

  if (!isSeatAssignedInPlanning) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-white/30 flex items-center justify-center shrink-0 shadow-inner cursor-pointer transition-all">
              <span className="text-base font-extrabold text-white/40">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 border-white/10 text-white text-xs">
            <p className="font-bold text-emerald-400">Seat {label}</p>
            <p className="text-white/60 text-[10px]">Unassigned Seat — Allocate machine & worker in Production Planning</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  let statusColor = 'border-white/10 bg-white/[0.02]';
  let dotColor = 'bg-white/20';
  let textColor = 'text-white/30';
  let statusText = 'Not in Use';

  if (isOffline) {
    statusColor = 'border-red-600 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    dotColor = 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    textColor = 'text-red-400';
    statusText = 'Machine Fault';
  } else if (isWorking) {
    statusColor = 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse';
    textColor = 'text-emerald-400';
    statusText = 'Working';
  } else if (isCheckedOut) {
    // Red = Checked Out / Absent
    statusColor = 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    dotColor = 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    textColor = 'text-red-400';
    statusText = 'Checked Out / Absent';
  } else if (isAssignedNotStarted) {
    // Blue = assigned, not yet started
    statusColor = 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
    dotColor = 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
    textColor = 'text-blue-400';
    statusText = 'Worker Assigned';
  } else if (!hasWorker) {
    statusColor = 'border-white/10 bg-white/[0.03] shadow-[0_0_10px_rgba(255,255,255,0.02)]';
    dotColor = 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.6)]';
    textColor = 'text-zinc-500';
    statusText = 'Unassigned Seat';
  }

  const formatTime = (t?: string) => {
    if (!t) return null;
    try { return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
    catch { return null; }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ y: 0, scale: 0.95 }}
      onClick={() => {
        if (machine?.machineNumber) {
          useMachineStore.getState().setSelectedMachine(machine.machineNumber);
        }
      }}
      className={cn(
        "w-16 h-16 rounded-xl border-x border-t border-b-4 flex flex-col items-center justify-center shrink-0 relative group cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-colors",
        statusColor,
        isMatch ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950 scale-110 z-10" : "",
        isMatch && isWorking ? "shadow-[0_0_20px_rgba(16,185,129,0.5)]" : ""
      )}
      title={`${label} - ${machine.worker?.name || 'Not Assigned'}`}
    >
      {hasWorker && !isOffline && (
        <div className={cn("absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 transition-all duration-300", dotColor)} />
      )}

      {isOffline && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </div>
      )}

      <span className={cn("text-xl font-black tracking-tighter relative z-10", textColor)}>
        {label}
      </span>

      {/* Enriched Tooltip on hover */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 bg-zinc-900/98 backdrop-blur-md border border-white/10 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-max z-30 shadow-2xl min-w-[220px]",
        isTopRow ? "top-full mt-3" : "bottom-full mb-3"
      )}>
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
          <div className="text-sm font-bold text-white">{label}</div>
          <div className={cn("flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", dotColor.split(' ')[0])} />
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", textColor)}>{statusText}</span>
          </div>
        </div>

        {/* Worker info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <span className="text-xs font-semibold text-white">{machine.worker?.name || 'No Worker Assigned'}</span>
          </div>
          {machine.worker?.employeeId && (
            <div className="text-[10px] text-white/40 pl-5 font-mono">{machine.worker.employeeId}</div>
          )}
        </div>

        {/* Assignment context */}
        {hasWorker && machine.assignment && (
          <div className="space-y-1.5 mb-3 bg-black/20 rounded-lg p-2.5">
            <div className="text-[10px]">
              <span className="text-white/40 block mb-0.5 uppercase tracking-wider">Order / Project</span>
              <span className="text-white font-medium">{machine.assignment.productionOrder || '—'} <span className="text-white/30 mx-1">·</span> {machine.assignment.projectName || '—'}</span>
            </div>
            <div className="text-[10px]">
              <span className="text-white/40 block mb-0.5 uppercase tracking-wider">Operation · Dept</span>
              <span className="text-white font-medium">{machine.assignment.operationName} <span className="text-white/30 mx-1">·</span> {machine.assignment.departmentName || machine.department}</span>
            </div>
          </div>
        )}

        {/* Check-in / Check-out times */}
        {hasWorker && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Check-IN</div>
              <div className={cn("text-[11px] font-mono font-bold", machine.checkInTime ? "text-emerald-400" : "text-white/20")}>
                {formatTime(machine.checkInTime) || '—'}
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Check-OUT</div>
              <div className={cn("text-[11px] font-mono font-bold", machine.checkOutTime ? "text-amber-400" : "text-white/20")}>
                {formatTime(machine.checkOutTime) || '—'}
              </div>
            </div>
          </div>
        )}

        {!hasWorker && (
          <div className="text-xs text-white/30 text-center py-2 italic">No worker assigned to this seat</div>
        )}
      </div>
    </motion.div>
  );
}