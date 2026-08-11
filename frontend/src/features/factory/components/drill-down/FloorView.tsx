import { ChevronRight, LayoutGrid } from 'lucide-react';
import type { LiveFloor } from '../../hooks/useLiveFactory';
import { useFactoryStore } from '../../store/factory.store';
import { cn } from '@/lib/utils';

const ROOM_TYPE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  stitching:  { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   dot: 'bg-cyan-400' },
  finishing:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  dot: 'bg-amber-400' },
  embroidery: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-400' },
  qc:         { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',dot: 'bg-emerald-400' },
  packing:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   dot: 'bg-blue-400' },
  cutting:    { bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
};

export function FloorView({ floor }: { floor: LiveFloor }) {
  const { drillToRoom } = useFactoryStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-white/40 text-sm">{floor.rooms.length} rooms on this floor</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {floor.rooms.map((room) => {
          const colors = ROOM_TYPE_COLORS[room.roomType] ?? ROOM_TYPE_COLORS.stitching;

          return (
            <button
              key={room.id}
              onClick={() => drillToRoom(room.id)}
              className={cn(
                'group relative flex flex-col gap-4 p-5 rounded-2xl text-left',
                'bg-zinc-900/70 border hover:border-opacity-60 transition-all duration-200 cursor-pointer',
                colors.border,
                'hover:shadow-lg'
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg, 'border', colors.border)}>
                  <LayoutGrid className="w-5 h-5 text-white/60" />
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors mt-1" />
              </div>

              <div>
                <div className="text-white font-semibold">{room.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
                  <span className="text-white/40 text-xs capitalize">{room.roomType}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/35">Rows</span>
                  <span className="text-white font-mono font-semibold">{room.rowCount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/35">Machines</span>
                  <span className="text-white font-mono font-semibold">{room.machineCount}</span>
                </div>
              </div>

              {/* Utilization bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-white/35">
                  <span>Running</span>
                  <span className="text-emerald-400 font-mono">{room.utilizationPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                    style={{ width: `${room.utilizationPct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
