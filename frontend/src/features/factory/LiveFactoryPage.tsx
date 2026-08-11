import { useMemo } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import { useLiveFactory } from './hooks/useLiveFactory';
import { useFactoryStore } from './store/factory.store';
import { Breadcrumb } from './components/drill-down/Breadcrumb';
import { FacilityView } from './components/drill-down/FacilityView';
import { FloorView } from './components/drill-down/FloorView';
import { RoomView } from './components/drill-down/RoomView';
import { RowView } from './components/drill-down/RowView';
import { LiveTicker } from './components/LiveTicker';
import { HeatmapToggle } from './components/HeatmapToggle';
import { WsHeartbeat } from './components/WsHeartbeat';
import { MachineDetailsPanel } from './components/MachineDetailsPanel';
import type { DrillLevel } from './store/factory.store';

export default function LiveFactoryPage() {
  const { floors, tickerEvents, loading, wsConnected, refresh } = useLiveFactory();

  const {
    drillLevel,
    selectedFloorId,
    selectedRoomId,
    selectedRowId,
    drillUp,
    searchQuery,
    setSearchQuery,
    selectMachine,
  } = useFactoryStore();

  // Resolve the selected entities
  const selectedFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloorId) ?? null,
    [floors, selectedFloorId]
  );
  const selectedRoom = useMemo(
    () => selectedFloor?.rooms.find((r) => r.id === selectedRoomId) ?? null,
    [selectedFloor, selectedRoomId]
  );
  const selectedRow = useMemo(
    () => selectedRoom?.rows.find((r) => r.id === selectedRowId) ?? null,
    [selectedRoom, selectedRowId]
  );

  // Auto-skip single floor/room
  const effectiveFloors = floors;

  // Build breadcrumb segments
  const breadcrumbs = useMemo(() => {
    const segs: { label: string; level: DrillLevel }[] = [
      { label: 'Live Factory', level: 'facility' },
    ];
    if (selectedFloor && drillLevel !== 'facility') segs.push({ label: selectedFloor.name, level: 'floor' });
    if (selectedRoom && (drillLevel === 'room' || drillLevel === 'row')) segs.push({ label: selectedRoom.name, level: 'room' });
    if (selectedRow && drillLevel === 'row') segs.push({ label: selectedRow.name, level: 'row' });
    return segs;
  }, [drillLevel, selectedFloor, selectedRoom, selectedRow]);

  // Search handler — jumps to row containing the machine
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    for (const floor of floors) {
      for (const room of floor.rooms) {
        for (const row of room.rows) {
          const match = row.machines.find(
            (m) =>
              m.machineLabel.toLowerCase() === searchQuery.toLowerCase() ||
              m.machineCode.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (match) {
            useFactoryStore.getState().drillToFloor(floor.id);
            useFactoryStore.getState().drillToRoom(room.id);
            useFactoryStore.getState().drillToRow(row.id);
            selectMachine(match.id);
            return;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950 text-white overflow-hidden">

      {/* ── Top control bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-2.5 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-sm shrink-0">

        {/* Left: breadcrumb + WS heartbeat */}
        <div className="flex items-center gap-4 min-w-0">
          <WsHeartbeat connected={wsConnected} />
          <div className="w-px h-4 bg-white/10" />
          <Breadcrumb segments={breadcrumbs} onNavigate={drillUp} />
        </div>

        {/* Right: search + heatmap + refresh */}
        <div className="flex items-center gap-3 shrink-0">
          <form onSubmit={handleSearch} className="relative hidden md:flex">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Jump to A14..."
              className="bg-zinc-800/60 border border-white/[0.08] rounded-lg pl-7 pr-7 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 w-36 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          <HeatmapToggle />

          <button
            onClick={refresh}
            className="p-1.5 rounded-lg bg-zinc-800/60 border border-white/[0.07] text-white/40 hover:text-white/80 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Ticker strip ────────────────────────────────────────────────── */}
      <LiveTicker events={tickerEvents} />

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              Loading factory layout…
            </div>
          </div>
        ) : drillLevel === 'facility' ? (
          <FacilityView floors={effectiveFloors} />
        ) : drillLevel === 'floor' && selectedFloor ? (
          <FloorView floor={selectedFloor} />
        ) : drillLevel === 'room' && selectedRoom ? (
          <RoomView room={selectedRoom} />
        ) : drillLevel === 'row' && selectedRow ? (
          <RowView row={selectedRow} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-sm">
            Nothing selected — use the breadcrumb to navigate.
          </div>
        )}
      </div>

      {/* ── Machine side panel ──────────────────────────────────────────── */}
      <MachineDetailsPanel />
    </div>
  );
}
