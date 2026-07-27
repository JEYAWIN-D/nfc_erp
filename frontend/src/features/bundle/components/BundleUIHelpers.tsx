import { cn } from "@/lib/utils";
import type { BundleStatus, BundlePriority } from "../types/bundle.types";

export function BundleStatusBadge({ status }: { status: BundleStatus }) {
  const config: Record<BundleStatus, { bg: string; text: string; border: string; label: string }> = {
    in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "In Progress" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Completed" },
    rejected: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Rejected" },
    delayed: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Delayed" },
    on_hold: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", label: "On Hold" },
    rework: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", label: "Rework" },
  };
  const c = config[status] || config.in_progress;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
        c.bg,
        c.text,
        c.border
      )}
    >
      {c.label}
    </span>
  );
}

export function BundlePriorityBadge({ priority }: { priority: BundlePriority }) {
  const config = {
    low: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: "Low" },
    medium: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Medium" },
    high: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "High" },
    urgent: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Urgent" },
  };
  const c = config[priority];

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
        c.bg,
        c.text,
        c.border
      )}
    >
      {c.label}
    </span>
  );
}

export function BundleProgressBar({ target, completed, defective }: { target: number, completed: number, defective: number }) {
  const compPct = Math.min((completed / target) * 100, 100);
  const defPct = Math.min((defective / target) * 100, 100 - compPct);

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1">
        <span>{completed} / {target} pcs</span>
        <span>{Math.round(compPct)}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${compPct}%` }} />
        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${defPct}%` }} />
      </div>
    </div>
  );
}
