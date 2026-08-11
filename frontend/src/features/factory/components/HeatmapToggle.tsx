import { cn } from '@/lib/utils';
import { Layers, Tag } from 'lucide-react';
import type { HeatmapMode } from '../store/factory.store';
import { useFactoryStore } from '../store/factory.store';

export function HeatmapToggle() {
  const { heatmapMode, setHeatmapMode } = useFactoryStore();

  const options: { mode: HeatmapMode | null; label: string; icon: React.ElementType }[] = [
    { mode: null, label: 'Status', icon: Layers },
    { mode: 'reason', label: 'Reason', icon: Tag },
  ];

  return (
    <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5 border border-white/[0.07]">
      {options.map(({ mode, label, icon: Icon }) => (
        <button
          key={String(mode)}
          onClick={() => setHeatmapMode(mode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-all',
            heatmapMode === mode
              ? 'bg-zinc-700 text-white font-medium shadow-sm'
              : 'text-white/40 hover:text-white/70'
          )}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
