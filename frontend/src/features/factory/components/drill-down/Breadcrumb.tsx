import { ChevronRight, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrillLevel } from '../store/factory.store';

interface BreadcrumbSegment {
  label: string;
  level: DrillLevel;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  onNavigate: (level: DrillLevel) => void;
}

export function Breadcrumb({ segments, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      <Factory className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={seg.level} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="w-3 h-3 text-white/25 shrink-0" />}
            <button
              onClick={() => !isLast && onNavigate(seg.level)}
              className={cn(
                'transition-colors',
                isLast
                  ? 'text-white font-semibold cursor-default'
                  : 'text-white/50 hover:text-white cursor-pointer'
              )}
            >
              {seg.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
