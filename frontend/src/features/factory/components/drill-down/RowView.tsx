import { memo, useState } from 'react';
import { Wrench, UserX, Package, RefreshCw, Coffee, ShieldAlert, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveMachine, LiveRow } from '../../hooks/useLiveFactory';
import { useFactoryStore } from '../../store/factory.store';
import type { HeatmapMode } from '../../store/factory.store';

// ─── Status Colors ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { ring: string; bg: string; dot: string; label: string }> = {
  running:     { ring: 'border-emerald-500',  bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', label: 'Running' },
  idle:        { ring: 'border-amber-400',    bg: 'bg-amber-500/10',   dot: 'bg-amber-400',   label: 'Idle' },
  offline:     { ring: 'border-red-500',      bg: 'bg-red-500/10',     dot: 'bg-red-500',      label: 'Offline' },
  maintenance: { ring: 'border-violet-500',   bg: 'bg-violet-500/10',  dot: 'bg-violet-400',  label: 'Maint.' },
  no_worker:   { ring: 'border-zinc-600/50',  bg: 'bg-zinc-800/60',    dot: 'bg-zinc-500',    label: 'No Worker' },
};

// Reason code → Lucide icon map
const REASON_ICONS: Record<string, React.ElementType> = {
  UserX,
  Wrench,
  Package,
  RefreshCw,
  Coffee,
  ShieldAlert,
};

// Heatmap: reason category → color class
const REASON_HEATMAP: Record<string, string> = {
  NO_OPERATOR: 'border-zinc-400 bg-zinc-500/20',
  MECH_FAULT:  'border-red-400 bg-red-500/20',
  NO_MATERIAL: 'border-orange-400 bg-orange-500/20',
  CHANGEOVER:  'border-blue-400 bg-blue-500/20',
  BREAK:       'border-slate-400 bg-slate-500/20',
  QC_HOLD:     'border-purple-400 bg-purple-500/20',
};

// ─── Machine Circle ───────────────────────────────────────────────────────────

interface CircleProps {
  machine: LiveMachine;
  heatmapMode: HeatmapMode | null;
  isSelected: boolean;
  onSelect: () => void;
  flip?: boolean; // bottom-row circles face upward
}

const MachineCircle = memo(function MachineCircle({
  machine, heatmapMode, isSelected, onSelect, flip = false,
}: CircleProps) {
  const [hovered, setHovered] = useState(false);
  const meta = STATUS_META[machine.status] ?? STATUS_META.no_worker;
  const ReasonIcon = machine.currentEvent?.reasonIcon
    ? (REASON_ICONS[machine.currentEvent.reasonIcon] ?? AlertCircle)
    : null;

  const heatmapClass = heatmapMode === 'reason' && machine.currentEvent?.reasonCode
    ? REASON_HEATMAP[machine.currentEvent.reasonCode] ?? ''
    : heatmapMode === 'status'
      ? `${meta.ring} ${meta.bg}`
      : '';

  const ringClass = heatmapClass || `${meta.ring} ${meta.bg}`;

  return (
    <div
      className={cn('relative flex flex-col items-center', flip ? 'flex-col-reverse' : 'flex-col')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover tooltip */}
      {hovered && (
        <div
          className={cn(
            'absolute z-30 w-40 p-2.5 rounded-xl bg-zinc-900/95 border border-white/10 shadow-xl text-xs',
            flip ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <div className="font-bold text-white mb-1">{machine.machineLabel} — {machine.machineName}</div>
          <div className="text-white/50 mb-1">{machine.machineType}</div>
          {machine.worker
            ? <div className="text-emerald-400">👷 {machine.worker.name}</div>
            : <div className="text-zinc-500 italic">No worker</div>}
          {machine.currentEvent?.reasonLabel && (
            <div className="text-amber-400 mt-1">⚠ {machine.currentEvent.reasonLabel}</div>
          )}
        </div>
      )}

      {/* Worker name (above for top, below for bottom) */}
      <div className={cn('text-[9px] text-white/45 truncate max-w-[64px] text-center mb-1', flip && 'mt-1 mb-0 order-last')}>
        {machine.worker?.name.split(' ')[0] ?? '—'}
      </div>

      {/* The circle itself */}
      <button
        onClick={onSelect}
        className={cn(
          'relative flex items-center justify-center',
          'w-14 h-14 rounded-full border-2 transition-all duration-200',
          ringClass,
          isSelected ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-zinc-950 scale-110' : '',
          hovered && !isSelected ? 'scale-105 shadow-lg' : ''
        )}
      >
        {/* Machine label centered inside */}
        <span className="text-[11px] font-bold text-white/90 select-none leading-none">
          {machine.machineLabel}
        </span>

        {/* Reason-code badge on ring edge */}
        {ReasonIcon && machine.status !== 'running' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center">
            <ReasonIcon className="w-2.5 h-2.5 text-amber-400" />
          </div>
        )}

        {/* Pulsing ring for running */}
        {machine.status === 'running' && (
          <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20" />
        )}
      </button>

      {/* Machine type (below for top, above for bottom) */}
      <div className={cn('text-[8px] text-white/25 truncate max-w-[64px] text-center mt-1', flip && 'mb-1 mt-0 order-first')}>
        {machine.machineType}
      </div>
    </div>
  );
});

// ─── Row View ────────────────────────────────────────────────────────────────

interface RowViewProps {
  row: LiveRow;
}

export function RowView({ row }: RowViewProps) {
  const { heatmapMode, selectedMachineId, selectMachine } = useFactoryStore();

  const topMachines = row.machines
    .filter((m) => m.side === 'top')
    .sort((a, b) => a.positionIndex - b.positionIndex);

  const bottomMachines = row.machines
    .filter((m) => m.side === 'bottom')
    .sort((a, b) => a.positionIndex - b.positionIndex);

  return (
    <div className="p-4 md:p-6">
      {/* Row band container */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-zinc-900/60 overflow-visible">

        {/* ── TOP row of machines ─────────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex flex-wrap gap-4 justify-start">
            {topMachines.map((m) => (
              <MachineCircle
                key={m.id}
                machine={m}
                heatmapMode={heatmapMode}
                isSelected={selectedMachineId === m.id}
                onSelect={() => selectMachine(selectedMachineId === m.id ? null : m.id)}
                flip={false}
              />
            ))}
          </div>
        </div>

        {/* ── Center divider with row label ───────────────────────────────── */}
        <div className="relative flex items-center px-6 py-2">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <div className="mx-4 px-4 py-1 rounded-full bg-zinc-800 border border-white/10 text-white/50 text-xs font-bold tracking-widest select-none">
            {row.name.toUpperCase()}
          </div>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* ── BOTTOM row of machines (facing upward) ──────────────────────── */}
        <div className="px-4 pt-3 pb-5">
          <div className="flex flex-wrap gap-4 justify-start">
            {bottomMachines.map((m) => (
              <MachineCircle
                key={m.id}
                machine={m}
                heatmapMode={heatmapMode}
                isSelected={selectedMachineId === m.id}
                onSelect={() => selectMachine(selectedMachineId === m.id ? null : m.id)}
                flip={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {Object.entries(STATUS_META).map(([status, meta]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', meta.dot)} />
            <span className="text-[10px] text-white/35">{meta.label}</span>
          </div>
        ))}
        <div className="ml-auto text-[10px] text-white/25 font-mono">
          {row.machines.length} machines
        </div>
      </div>
    </div>
  );
}
