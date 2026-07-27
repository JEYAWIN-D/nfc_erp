import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, CheckCircle2, Loader2, User, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BundleDemoCardProps {
  bundle: any;
  isLocked: boolean;
  onAdvance: (workerId?: number) => void;
  isLoading: boolean;
  presentWorkers?: any[];
}

export function BundleDemoCard({
  bundle,
  isLocked,
  onAdvance,
  isLoading,
  presentWorkers = [],
}: BundleDemoCardProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | undefined>(undefined);
  const status = bundle.status || 'CREATED';
  const completedQty = bundle.completedQuantity || 0;
  const totalQty = bundle.quantity || 10;
  const percent = Math.min(100, Math.round((completedQty / totalQty) * 100));

  const currentWorker = bundle.currentWorker;
  const assignedWorkerName = currentWorker
    ? `${currentWorker.firstName || ''} ${currentWorker.lastName || ''}`.trim() || currentWorker.employeeCode
    : null;

  const statusConfig: Record<string, { label: string; badge: string; nextLabel: string }> = {
    CREATED: {
      label: isLocked ? 'Locked' : 'Ready',
      badge: isLocked ? 'bg-zinc-800/80 text-zinc-500 border-white/5' : 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      nextLabel: isLocked ? 'Locked (Complete Previous Bundle First)' : 'Click to Pick Bundle & Start →',
    },
    IN_PROGRESS: {
      label: assignedWorkerName ? `In Use` : 'In Progress',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      nextLabel: 'Click to Complete Bundle → 100%',
    },
    COMPLETED: {
      label: 'Completed',
      badge: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      nextLabel: 'Click to Close & Transfer to QC',
    },
    QC_COMPLETED: {
      label: 'Closed',
      badge: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      nextLabel: 'Completed & Closed',
    },
  };

  const currentConfig = statusConfig[status] || statusConfig.CREATED;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'QC_COMPLETED' || status === 'CLOSED') {
      toast.info(`Bundle ${bundle.bundleNumber} is completed and closed.`);
      return;
    }
    if (!isLoading && !isLocked) {
      if (status === 'CREATED' && presentWorkers.length === 0 && !assignedWorkerName) {
        toast.warning("No workers are currently Checked IN. Please check in a worker first to allocate bundles.");
        return;
      }
      onAdvance(selectedWorkerId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden select-none',
        isLocked
          ? 'bg-zinc-950/40 border-white/5 opacity-50 cursor-not-allowed'
          : status === 'IN_PROGRESS'
          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/30 cursor-pointer'
          : status === 'COMPLETED' || status === 'QC_COMPLETED'
          ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60 cursor-pointer'
          : 'bg-zinc-900/60 border-white/8 hover:border-blue-500/40 cursor-pointer hover:bg-zinc-900/90',
        isLoading && 'opacity-70 pointer-events-none'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 border border-white/10 text-violet-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white group-hover:text-violet-300 transition-colors">
              {bundle.bundleNumber}
            </h4>
            <p className="text-[10px] text-white/40 truncate max-w-[110px]">
              {bundle.quantity} Pcs Batch
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0',
            currentConfig.badge
          )}
        >
          {isLocked ? <Lock className="w-2.5 h-2.5" /> : null}
          {currentConfig.label}
        </span>
      </div>

      {/* In Use By Worker Indicator */}
      {assignedWorkerName ? (
        <div className="my-2 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-[10px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            In Use By:
          </span>
          <span className="font-semibold font-mono text-emerald-200 truncate max-w-[120px]">
            {assignedWorkerName}
          </span>
        </div>
      ) : status === 'CREATED' && !isLocked && presentWorkers.length > 0 ? (
        <div
          className="my-2 flex items-center gap-1 text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-white/40 text-[9px] font-medium shrink-0">Worker:</span>
          <select
            value={selectedWorkerId || ''}
            onChange={(e) => setSelectedWorkerId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white font-medium focus:outline-none"
          >
            <option value="">Auto-Assign Active Worker</option>
            {presentWorkers.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.firstName} {w.lastName} ({w.employeeCode})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Progress Bar */}
      <div className="my-2">
        <div className="flex items-center justify-between text-[9px] text-white/40 mb-1">
          <span>Production Progress</span>
          <span className="font-bold text-white/70">
            {completedQty} / {totalQty} ({percent}%)
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              status === 'COMPLETED' || status === 'QC_COMPLETED'
                ? 'bg-gradient-to-r from-purple-500 to-violet-400'
                : 'bg-gradient-to-r from-blue-500 to-emerald-400'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-white/40">
        <span className="truncate group-hover:text-white/80 transition-colors font-medium">
          {currentConfig.nextLabel}
        </span>
        {isLoading ? (
          <Loader2 className="w-3 h-3 text-violet-400 animate-spin shrink-0" />
        ) : isLocked ? (
          <Lock className="w-3 h-3 text-white/20 shrink-0" />
        ) : (
          <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        )}
      </div>
    </div>
  );
}
