import React from 'react';
import { UserCheck, UserX, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkerDemoCardProps {
  worker: any;
  latestAttendance?: {
    attendanceType: string;
    tapTime?: string | Date;
  } | null;
  isPresent?: boolean;
  operationName?: string;
  machineCode?: string;
  activeBundleNumber?: string;
  avgMinutesPerBundle?: number;
  isCompleted?: boolean;
  onOpenModal: () => void;
  isLoading: boolean;
}

export function WorkerDemoCard({
  worker,
  latestAttendance,
  operationName,
  machineCode,
  activeBundleNumber,
  avgMinutesPerBundle,
  onOpenModal,
  isLoading,
}: WorkerDemoCardProps) {
  const name = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker.employeeCode;

  // Determine state strictly:
  // 'IN' -> GREEN (Present)
  // 'OUT' -> RED (Checked-OUT)
  // undefined/null/other -> BLUE (Assigned - Default State)
  const attendanceType = latestAttendance?.attendanceType;
  const isCheckedIn = attendanceType === 'IN';
  const isCheckedOut = attendanceType === 'OUT';
  const isAssigned = !isCheckedIn && !isCheckedOut;

  const formatTime = (timeVal?: string | Date) => {
    if (!timeVal) return '';
    try {
      const date = new Date(timeVal);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const tapTimeStr = formatTime(latestAttendance?.tapTime);

  return (
    <div
      onClick={() => !isLoading && onOpenModal()}
      className={cn(
        'group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden select-none flex flex-col justify-between min-w-0',
        isCheckedIn && 'bg-emerald-950/80 border-emerald-500 shadow-xl shadow-emerald-950/50 hover:bg-emerald-950',
        isCheckedOut && 'bg-rose-950/80 border-rose-500 shadow-xl shadow-rose-950/50 hover:bg-rose-950',
        isAssigned && 'bg-blue-950/80 border-blue-500/70 shadow-xl shadow-blue-950/50 hover:bg-blue-900/90',
        isLoading && 'opacity-70 pointer-events-none'
      )}
    >
      {/* Top state bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1.5 transition-colors',
          isCheckedIn && 'bg-emerald-500',
          isCheckedOut && 'bg-rose-500',
          isAssigned && 'bg-blue-500'
        )}
      />

      {/* Header Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2.5 pt-1">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-inner',
              isCheckedIn && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
              isCheckedOut && 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
              isAssigned && 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            )}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                'text-xs font-bold transition-colors truncate leading-tight',
                isCheckedIn && 'text-emerald-200',
                isCheckedOut && 'text-rose-200',
                isAssigned && 'text-blue-200'
              )}
              title={name}
            >
              {name}
            </h4>

            <div className="flex items-center justify-between gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-white/60 shrink-0">{worker.employeeCode}</span>

              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 whitespace-nowrap shadow-sm',
                  isCheckedIn && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40',
                  isCheckedOut && 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-950/40',
                  isAssigned && 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                )}
              >
                {isCheckedIn && <UserCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                {isCheckedOut && <UserX className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                {isAssigned && <UserCheck className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                <span>{isCheckedIn ? 'Present' : isCheckedOut ? 'Checked-OUT' : 'Assigned'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tap Time Indicator (Only when tapped explicitly in this order session) */}
        {tapTimeStr && (isCheckedIn || isCheckedOut) && (
          <div className="mb-2 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-white/50 flex items-center gap-1 font-sans">
              <Clock className="w-3 h-3 text-white/40 shrink-0" />
              {isCheckedIn ? 'Check-IN:' : 'Check-OUT:'}
            </span>
            <span
              className={cn(
                'font-mono font-bold ml-auto',
                isCheckedIn ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {tapTimeStr}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-white/50 pt-2 border-t border-white/5 gap-2">
          <span className="truncate flex-1">{operationName || 'Operation'}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {avgMinutesPerBundle ? (
              <span className="font-mono text-[9px] font-bold text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded border border-violet-500/25 whitespace-nowrap">
                Avg: {avgMinutesPerBundle}m
              </span>
            ) : null}
            {activeBundleNumber && (
              <span className="font-mono font-bold text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/30 whitespace-nowrap">
                {activeBundleNumber}
              </span>
            )}
            {machineCode && (
              <span className="font-mono text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">
                {machineCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold text-white/50 group-hover:text-white transition-colors">
        <span>Click to Check-IN / Check-OUT & Select Bundle</span>
        <ArrowRight className="w-3 h-3 text-white/40 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
}
