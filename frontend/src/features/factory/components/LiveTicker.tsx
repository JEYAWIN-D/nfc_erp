import { useEffect, useRef, useState } from 'react';
import { Activity, Wrench, UserX, Package, RefreshCw, Coffee, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TickerEvent } from '../hooks/useLiveFactory';

const ICON_MAP: Record<string, React.ElementType> = { Wrench, UserX, Package, RefreshCw, Coffee, ShieldAlert };

const STATUS_COLORS: Record<string, string> = {
  running: 'text-emerald-400',
  offline: 'text-red-400',
  idle: 'text-amber-400',
  maintenance: 'text-violet-400',
};

function formatAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

interface LiveTickerProps {
  events: TickerEvent[];
}

export function LiveTicker({ events }: LiveTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Auto-scroll left continuously using CSS animation, pause on hover
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.animationPlayState = paused ? 'paused' : 'running';
  }, [paused]);

  if (events.length === 0) return null;

  const items = [...events, ...events]; // duplicate for infinite scroll illusion

  return (
    <div
      className="relative flex items-center overflow-hidden bg-zinc-900/80 border-b border-white/[0.06] h-8 shrink-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* "LIVE" badge */}
      <div className="flex items-center gap-1.5 px-3 shrink-0 border-r border-white/[0.08] h-full">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <Activity className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-400 tracking-widest">LIVE</span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-8 whitespace-nowrap animate-ticker"
          style={{ animation: 'ticker-scroll 40s linear infinite' }}
        >
          {items.map((ev, idx) => {
            const ReasonIcon = ev.reasonCode?.iconName ? ICON_MAP[ev.reasonCode.iconName] : null;
            const statusColor = STATUS_COLORS[ev.status?.toLowerCase()] ?? 'text-white/50';

            return (
              <span key={`${ev.id}-${idx}`} className="inline-flex items-center gap-1.5 text-[11px] text-white/60 shrink-0">
                <span className={cn('font-semibold', statusColor)}>
                  {ev.machine?.machineName ?? `Machine #${ev.machineId}`}
                </span>
                <span className="text-white/30">→</span>
                <span className={statusColor}>{ev.status}</span>
                {ReasonIcon && <ReasonIcon className="w-3 h-3 text-amber-400 inline" />}
                {ev.reasonCode?.label && (
                  <span className="text-white/40">({ev.reasonCode.label})</span>
                )}
                <span className="text-white/20">·</span>
                <span className="text-white/25 font-mono">{formatAgo(ev.changedAt)}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
