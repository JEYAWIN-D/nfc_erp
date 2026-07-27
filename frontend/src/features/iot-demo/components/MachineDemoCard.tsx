import React from 'react';
import { Cpu, Zap, User, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MachineDemoCardProps {
  machine: any;
  isRunning: boolean;
  isWorkerPresent: boolean;
  assignedWorker?: any;
  assignedWorkerName?: string;
}

export function MachineDemoCard({
  machine,
  isRunning,
  isWorkerPresent,
  assignedWorker,
  assignedWorkerName: fallbackWorkerName,
}: MachineDemoCardProps) {
  const code = machine.machineCode || `MCH-${machine.id}`;
  const name = machine.machineName || machine.name || 'Workstation';

  const workerName = assignedWorker
    ? `${assignedWorker.firstName || ''} ${assignedWorker.lastName || ''}`.trim() || assignedWorker.employeeCode
    : fallbackWorkerName;

  // Machine States: Idle/Paused (Amber/Gray) -> Assigned (Blue) -> Running (Green)
  const statusLabel = isRunning ? 'Running' : isWorkerPresent ? 'Assigned / Ready' : 'Idle / Paused';

  return (
    <div
      className={cn(
        'group relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden select-none flex flex-col justify-between min-w-0',
        isRunning
          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
          : isWorkerPresent
            ? 'bg-blue-950/40 border-blue-500/40'
            : 'bg-zinc-900/60 border-white/10'
      )}
    >
      {/* Top state bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1.5 transition-colors',
          isRunning ? 'bg-emerald-500' : isWorkerPresent ? 'bg-blue-500' : 'bg-amber-500/60'
        )}
      />

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2.5 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs transition-colors shrink-0 shadow-inner',
                isRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isWorkerPresent
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              )}
            >
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white font-mono tracking-wider shrink-0">
                {code}
              </h4>
              <p className="text-[10px] text-white/50 truncate max-w-[120px]">{name}</p>
            </div>
          </div>

          {/* Compact State Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 shadow-sm',
              isRunning
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : isWorkerPresent
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-950/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40'
            )}
          >
            <Zap className={cn('w-3 h-3', isRunning && 'animate-pulse text-emerald-400')} />
            {isRunning ? 'RUNNING' : isWorkerPresent ? 'READY' : 'IDLE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/50 pt-2 border-t border-white/5">
          <span className="text-[9px] font-mono text-white/50 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5 truncate">
            {machine.department?.name || 'Sewing Line'}
          </span>
          <span className={cn('font-mono text-[10px] font-semibold shrink-0', isRunning ? 'text-emerald-400' : 'text-amber-400')}>
            {isRunning ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>

      {/* Prominent Assigned Worker Section - Clean Stacked Layout */}
      {workerName ? (
        <div className="mt-2.5 p-2 rounded-xl bg-black/50 border border-white/10 flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 shadow-inner',
              isWorkerPresent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            )}
          >
            {workerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-white text-[11px] leading-tight truncate" title={workerName}>
              {workerName}
            </h5>
            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono text-white/50 shrink-0">
                {assignedWorker?.employeeCode || 'Operator'}
              </span>
              <span
                className={cn(
                  'text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap flex items-center gap-0.5 border shadow-sm',
                  isWorkerPresent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                )}
              >
                {isWorkerPresent ? <UserCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" /> : <UserX className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                <span>{isWorkerPresent ? 'Present' : 'Absent'}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 p-2 rounded-xl bg-black/30 border border-white/5 text-[10px] text-white/40 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-white/30" /> Operator Unassigned
          </span>
        </div>
      )}
    </div>
  );
}
