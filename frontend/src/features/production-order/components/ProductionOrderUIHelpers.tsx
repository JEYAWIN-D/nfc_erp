import { cn } from "@/lib/utils";
import type { OrderStatus, OrderPriority } from "../types/production-order.types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: "Draft" },
    planned: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Planned" },
    ready_for_production: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", label: "Ready For Prod" },
    running: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Running" },
    in_progress: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "In Progress" },
    qc: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "QC Pending" },
    paused: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Paused" },
    completed: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", label: "Completed" },
    delayed: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Delayed" },
    closed: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Closed" },
  };
  const c = config[status as keyof typeof config] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: status || "Unknown" };

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

export function OrderPriorityBadge({ priority }: { priority: OrderPriority }) {
  const config = {
    low: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: "Low" },
    medium: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Medium" },
    high: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "High" },
    urgent: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Urgent" },
  };
  const c = config[priority] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", label: priority || "Unknown" };

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

export function ProgressBar({ target, completed, defective }: { target: number, completed: number, defective: number }) {
  const safeTarget = target || 1;
  const compPct = Math.min((completed / safeTarget) * 100, 100);
  const defPct = Math.min((defective / safeTarget) * 100, 100 - compPct);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-mono mb-1 gap-2">
        <span className="font-bold text-white/90 truncate">{completed} / {target}</span>
        <span className="font-bold text-emerald-400 shrink-0">{Math.round(compPct)}%</span>
      </div>
      <div className="h-2 w-full bg-zinc-900/80 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${compPct}%` }} />
        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${defPct}%` }} />
      </div>
    </div>
  );
}
