import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Cpu,
  Wrench,
  X,
  Loader2,
  ScanLine,
  Layers,
  CheckCircle2,
  XCircle,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkerAttendanceModalProps {
  worker: any;
  latestAttendance?: {
    attendanceType: string;
    tapTime?: string | Date;
  } | null;
  operationName?: string;
  machineCode?: string;
  activeBundles?: any[];
  availableBundles?: any[];
  avgMinutesPerBundle?: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleAttendance: (workerId: number, selectedBundleId?: number) => void;
  onClaimBundle?: (bundleId: number, workerId: number) => void;
  isLoading: boolean;
}

export function WorkerAttendanceModal({
  worker,
  latestAttendance,
  operationName,
  machineCode,
  activeBundles = [],
  availableBundles = [],
  avgMinutesPerBundle = 14.5,
  isOpen,
  onClose,
  onToggleAttendance,
  onClaimBundle,
  isLoading,
}: WorkerAttendanceModalProps) {
  const [selectedBundleId, setSelectedBundleId] = useState<number | undefined>(undefined);

  if (!isOpen || !worker) return null;

  const name = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker.employeeCode;
  const attendanceType = latestAttendance?.attendanceType || 'NONE';
  const isCheckedIn = attendanceType === 'IN';

  const formatTime = (timeVal?: string | Date) => {
    if (!timeVal) return 'Not recorded today';
    try {
      const date = new Date(timeVal);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return 'Not recorded today';
    }
  };

  const tapTimeStr = formatTime(latestAttendance?.tapTime);

  const handleAction = () => {
    onToggleAttendance(worker.id, selectedBundleId);
    if (!isCheckedIn && selectedBundleId && onClaimBundle) {
      onClaimBundle(selectedBundleId, worker.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                NFC Worker Attendance Terminal
              </h3>
              <p className="text-[11px] text-white/50">Worker Presence & Bundle Allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Worker Info Body */}
        <div className="p-6 space-y-5">
          {/* Main Card */}
          <div
            className={cn(
              'p-5 rounded-2xl border transition-all flex items-start gap-4',
              isCheckedIn
                ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0 shadow-md',
                isCheckedIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              )}
            >
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-white truncate">{name}</h4>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider shrink-0',
                    isCheckedIn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/40'
                  )}
                >
                  {isCheckedIn ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400" /> Present / Checked IN
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 text-rose-400" /> Checked OUT / Absent
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/80">
                  {worker.employeeCode}
                </span>
                {worker.department?.name && (
                  <span className="flex items-center gap-1 text-white/50">
                    <Briefcase className="w-3 h-3" />
                    {worker.department.name}
                  </span>
                )}
              </div>

              {/* Attendance & Timing Metrics Grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-white/60 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <span>Last Tap:</span>
                  <span className={cn('font-mono font-bold ml-auto', isCheckedIn ? 'text-emerald-400' : 'text-rose-400')}>
                    {tapTimeStr}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/60 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>Avg Speed:</span>
                  <span className="font-mono font-bold text-violet-300 ml-auto">
                    {avgMinutesPerBundle || 14.5}m / batch
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operation & Machine Assignment Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3 h-3 text-emerald-400" /> Assigned Operation
              </span>
              <p className="font-semibold text-white truncate">{operationName || 'Sewing & Assembly'}</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-400" /> Assigned Machine
              </span>
              <p className="font-semibold text-blue-300 font-mono truncate">{machineCode || 'MAC-001'}</p>
            </div>
          </div>

          {/* Active Bundles in Progress */}
          {activeBundles.length > 0 && (
            <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-2">
              <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" /> Active Bundle In Use ({activeBundles.length})
              </span>
              <div className="space-y-1.5">
                {activeBundles.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-violet-500/20"
                  >
                    <span className="font-bold font-mono text-white">{b.bundleNumber}</span>
                    <span className="text-violet-300 font-semibold">{b.completedQuantity} / {b.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Bundle Selector when Checking IN or Present */}
          {availableBundles.length > 0 && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 space-y-2">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Select Bundle to Work On:
              </label>
              <select
                value={selectedBundleId || ''}
                onChange={(e) => setSelectedBundleId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">(Optional) No Bundle / Select Later</option>
                {availableBundles.map((b: any) => {
                  const otherWorkerName = b.currentWorker
                    ? `${b.currentWorker.firstName || ''} ${b.currentWorker.lastName || ''}`.trim() || b.currentWorker.employeeCode
                    : null;
                  const inUseLabel = otherWorkerName
                    ? ` (In Use by ${otherWorkerName} — Select to Take Over)`
                    : ` (${b.status === 'CREATED' ? 'Ready' : b.status})`;

                  return (
                    <option key={b.id} value={b.id}>
                      {b.bundleNumber} — {b.quantity} Pcs Batch{inUseLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Attendance Toggle Actions */}
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isLoading}
                onClick={() => {
                  if (!isCheckedIn) {
                    if (!selectedBundleId && availableBundles.length > 0 && activeBundles.length === 0) {
                      toast.warning("Please select a bundle to work on before Checking IN.");
                      return;
                    }
                    onToggleAttendance(worker.id, selectedBundleId);
                    if (selectedBundleId && onClaimBundle) {
                      onClaimBundle(selectedBundleId, worker.id);
                    }
                  } else if (selectedBundleId && onClaimBundle) {
                    onClaimBundle(selectedBundleId, worker.id);
                  }
                }}
                className={cn(
                  'py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer border shadow-lg',
                  isCheckedIn
                    ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40 shadow-emerald-950/50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500/50 shadow-emerald-950/40'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isCheckedIn ? (selectedBundleId ? 'CLAIM SELECTED BUNDLE' : 'PRESENT (CHECKED IN)') : 'CHECK-IN WORKER'}
                  </>
                )}
              </button>

              <button
                disabled={isLoading}
                onClick={() => {
                  if (isCheckedIn) {
                    onToggleAttendance(worker.id);
                  }
                }}
                className={cn(
                  'py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer border shadow-lg',
                  !isCheckedIn
                    ? 'bg-rose-600/30 border-rose-400 text-rose-200 ring-2 ring-rose-400/40 shadow-rose-950/50'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-500/50 shadow-rose-950/40'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    {!isCheckedIn ? 'ABSENT (CHECKED OUT)' : 'CHECK-OUT WORKER'}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
