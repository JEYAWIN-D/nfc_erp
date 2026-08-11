import { ChevronRight } from 'lucide-react';
import type { LiveRoom } from '../../hooks/useLiveFactory';
import { useFactoryStore } from '../../store/factory.store';
import { cn } from '@/lib/utils';

const ROW_COLORS = [
  { label: 'A', ring: 'border-emerald-500/40 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300' },
  { label: 'B', ring: 'border-blue-500/40 bg-blue-500/5',       badge: 'bg-blue-500/20 text-blue-300' },
  { label: 'C', ring: 'border-violet-500/40 bg-violet-500/5',   badge: 'bg-violet-500/20 text-violet-300' },
  { label: 'D', ring: 'border-amber-500/40 bg-amber-500/5',     badge: 'bg-amber-500/20 text-amber-300' },
];

export function RoomView({ room }: { room: LiveRoom }) {
  const { drillToRow } = useFactoryStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-white/40 text-sm">{room.rows.length} rows in {room.name}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {room.rows.map((row, idx) => {
          const colors = ROW_COLORS[idx % ROW_COLORS.length];
          const runningCount = row.machines.filter(m => m.status === 'running').length;
          const idleCount = row.machines.filter(m => m.status === 'idle' || m.status === 'no_worker').length;
          const offlineCount = row.machines.filter(m => m.status === 'offline').length;

          return (
            <button
              key={row.id}
              onClick={() => drillToRow(row.id)}
              className={cn(
                'group flex flex-col gap-4 p-5 rounded-2xl text-left',
                'bg-zinc-900/70 border transition-all duration-200 cursor-pointer',
                colors.ring,
                'hover:scale-[1.02] hover:shadow-lg'
              )}
            >
              {/* Row label badge */}
              <div className="flex items-center justify-between">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black', colors.badge)}>
                  {row.label}
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </div>

              <div>
                <div className="text-white font-semibold">{row.name}</div>
                <div className="text-white/40 text-xs">{row.machineCount} machines</div>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-mono">
                  {runningCount} running
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-400 font-mono">
                  {idleCount} idle
                </span>
                {offlineCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/15 text-red-400 font-mono">
                    {offlineCount} offline
                  </span>
                )}
              </div>

              {/* Mini utilization bar */}
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${row.machineCount > 0 ? (runningCount / row.machineCount) * 100 : 0}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
