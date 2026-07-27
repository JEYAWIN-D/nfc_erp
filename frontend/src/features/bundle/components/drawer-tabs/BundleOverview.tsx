import type { Bundle } from "../../types/bundle.types";
import { Link2, LayoutGrid, Users, Settings, ClipboardCheck } from "lucide-react";
import { BundleStatusBadge, BundlePriorityBadge, BundleProgressBar } from "../BundleUIHelpers";

export function BundleOverview({ bundle }: { bundle: Bundle }) {
  return (
    <div className="p-6 space-y-8">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Link2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Production Order</span>
          </div>
          <p className="text-base font-bold font-mono text-blue-400 hover:underline cursor-pointer">
            {bundle.orderNumber || bundle.productionOrder}
          </p>
          {(bundle.customerName || bundle.styleNumber) && (
            <p className="text-xs text-white/60 font-medium mt-0.5 truncate">
              {bundle.customerName}{bundle.customerName && bundle.styleNumber ? ' • ' : ''}{bundle.styleNumber}
            </p>
          )}
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Operation</span>
          </div>
          <p className="text-lg font-bold text-white">{bundle.operation}</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Current Worker</span>
          </div>
          <p className="text-base font-medium text-white">{bundle.currentWorker || "Unassigned"}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Machine</span>
          </div>
          <p className="text-base font-medium text-white">{bundle.currentMachine || "Unassigned"}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Bundle Progress</h3>
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-xl space-y-5">
          <BundleProgressBar target={bundle.targetPieces} completed={bundle.completedPieces} defective={bundle.defectivePieces} />
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase">Pieces</p>
              <p className="text-xl font-bold text-white">{bundle.targetPieces}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400/70 uppercase">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{bundle.completedPieces}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-400/70 uppercase">Defective</p>
              <p className="text-xl font-bold text-rose-400">{bundle.defectivePieces}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Meta Information</h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Department</span>
            <span className="text-sm text-white font-medium">{bundle.department}</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Priority</span>
            <BundlePriorityBadge priority={bundle.priority} />
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Status</span>
            <BundleStatusBadge status={bundle.status} />
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> QC Result</span>
            <span className={`text-sm font-bold ${bundle.qcResult === 'Pass' ? 'text-emerald-400' : bundle.qcResult === 'Fail' ? 'text-rose-400' : 'text-amber-400'}`}>
              {bundle.qcResult}
            </span>
          </div>
          
          {bundle.remarks && (
            <div className="p-3">
              <span className="text-sm text-white/50 block mb-1">Remarks</span>
              <p className="text-sm text-white/80 bg-black/20 p-2 rounded">{bundle.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
