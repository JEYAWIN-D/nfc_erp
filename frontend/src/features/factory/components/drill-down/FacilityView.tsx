import { Building2, ChevronRight, Layers } from 'lucide-react';
import type { LiveFloor } from '../../hooks/useLiveFactory';
import { useFactoryStore } from '../../store/factory.store';
import { cn } from '@/lib/utils';

export function FacilityView({ floors }: { floors: LiveFloor[] }) {
  const { drillToFloor } = useFactoryStore();

  const totalMachines = floors.reduce((s, f) => s + f.machineCount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header summary */}
      <div className="flex items-center gap-4 text-sm text-white/50">
        <span className="text-white/30">Facility</span>
        <span>·</span>
        <span>{floors.length} floors</span>
        <span>·</span>
        <span>{totalMachines} machines total</span>
      </div>

      {/* Floor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {floors.map((floor) => {
          const runningCount = floor.rooms.reduce((s, r) => s + r.runningCount, 0);
          const utilizationPct = floor.machineCount > 0
            ? Math.round((runningCount / floor.machineCount) * 100)
            : 0;

          return (
            <button
              key={floor.id}
              onClick={() => drillToFloor(floor.id)}
              className={cn(
                'group relative flex flex-col gap-4 p-5 rounded-2xl text-left',
                'bg-zinc-900/70 border border-white/[0.08] hover:border-emerald-500/40',
                'hover:bg-zinc-800/70 transition-all duration-200 cursor-pointer',
                'hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]'
              )}
            >
              {/* Icon + name */}
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors mt-1" />
              </div>

              <div>
                <div className="text-white font-semibold text-base">{floor.name}</div>
                <div className="text-white/40 text-xs mt-0.5">Floor {floor.floorNumber}</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/35">Rooms</span>
                  <span className="text-white font-mono font-semibold">{floor.roomCount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/35">Machines</span>
                  <span className="text-white font-mono font-semibold">{floor.machineCount}</span>
                </div>
              </div>

              {/* Utilization bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-white/35">
                  <span>Running</span>
                  <span className="text-emerald-400 font-mono">{utilizationPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
              </div>

              {/* Floor number badge */}
              <div className="absolute top-4 right-12">
                <div className="flex items-center gap-1 text-[10px] text-white/25">
                  <Layers className="w-3 h-3" />
                  <span className="font-mono">F{floor.floorNumber}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
