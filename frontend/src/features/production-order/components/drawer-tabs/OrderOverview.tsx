import { useNavigate } from "react-router-dom";
import type { ProductionOrder } from "../../types/production-order.types";
import { Hash, Building2, PaintBucket, Maximize, Play, Zap, Trash2 } from "lucide-react";
import { OrderStatusBadge, OrderPriorityBadge, ProgressBar } from "../ProductionOrderUIHelpers";
import { useDeleteProductionOrder } from "../../hooks/useProductionOrdersHooks";
import { useProductionOrderStore } from "../../store/production-order.store";
import { toast } from "sonner";

export function OrderOverview({ order }: { order: ProductionOrder }) {
  const navigate = useNavigate();
  const deleteOrderMutation = useDeleteProductionOrder();
  const canStart = order.status === 'ready_for_production' || order.status === 'planned' || order.status === 'running';
  return (
    <div className="p-6 space-y-6">
      {/* Start Production CTA */}
      {canStart && (
        <button
          onClick={() => navigate(`/iot-demo?orderId=${order.id}`)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/40 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold tracking-tight">Start Production</div>
              <div className="text-xs text-emerald-100/80 font-normal">
                {order.status === 'running' ? 'Production is Active — View Execution Console' : 'Launch Production Execution Console'}
              </div>
            </div>
          </div>
          <Play className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Customer</span>
          </div>
          <p className="text-lg font-bold text-white">{order.customerName}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Hash className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Style Number</span>
          </div>
          <p className="text-lg font-bold text-white">{order.styleNumber}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <PaintBucket className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Color</span>
          </div>
          <p className="text-lg font-bold text-white">{order.color}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Maximize className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sizes</span>
          </div>
          <p className="text-lg font-bold text-white">{order.size}</p>
        </div>
      </div>

      {/* Progress Section */}
      <div>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Production Progress</h3>
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-xl space-y-5">
          <ProgressBar target={order.targetQuantity} completed={order.completedQuantity} defective={order.defectiveQuantity} />
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase">Target</p>
              <p className="text-xl font-bold text-white">{order.targetQuantity?.toLocaleString() ?? '0'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400/70 uppercase">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{order.completedQuantity?.toLocaleString() ?? '0'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-400/70 uppercase">Defective</p>
              <p className="text-xl font-bold text-rose-400">{order.defectiveQuantity?.toLocaleString() ?? '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div>
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Order Meta</h3>
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Department</span>
            <span className="text-sm text-white font-medium">{order.department}</span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Priority</span>
            <OrderPriorityBadge priority={order.priority} />
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Start Date</span>
            <span className="text-sm text-white font-medium">
              {order.startDate ? new Date(order.startDate).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <span className="text-sm text-white/50">Due Date</span>
            <span className="text-sm text-white font-medium">
              {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}
            </span>
          </div>
          {order.remarks && (
            <div className="p-3">
              <span className="text-sm text-white/50 block mb-1">Remarks</span>
              <p className="text-sm text-white/80 bg-black/20 p-2 rounded">{order.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Order CTA */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to permanently DELETE Production Order ${order.orderNumber}? This will release assigned workers and machines.`)) {
              deleteOrderMutation.mutate(order.id, {
                onSuccess: () => {
                  toast.success(`Production Order ${order.orderNumber} permanently deleted.`);
                  useProductionOrderStore.getState().setDrawerOpen(false);
                }
              });
            }
          }}
          disabled={deleteOrderMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-all active:scale-98"
        >
          <Trash2 className="w-4 h-4" />
          {deleteOrderMutation.isPending ? "Deleting Order..." : "Delete Production Order"}
        </button>
      </div>
    </div>
  );
}
