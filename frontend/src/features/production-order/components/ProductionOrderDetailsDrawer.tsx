import { X, FileText, Activity, Layers, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProductionOrderStore } from "../store/production-order.store";
import { useProductionOrders } from "../hooks/useProductionOrderData";
import { cn } from "@/lib/utils";

import { OrderOverview } from "./drawer-tabs/OrderOverview";
import { OrderTimeline } from "./drawer-tabs/OrderTimeline";
import { OrderAllocations } from "./drawer-tabs/OrderAllocations";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "allocations", label: "Allocations", icon: Layers },
  { id: "timeline", label: "Timeline", icon: Activity },
];

export function ProductionOrderDetailsDrawer() {
  const navigate = useNavigate();
  const store = useProductionOrderStore();
  const { orders, isLoading } = useProductionOrders();
  
  const order = orders.find(o => o.id === store.selectedOrderId);

  return (
    <AnimatePresence>
      {store.isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => store.setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            animate={{ x: 0, boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0.5)" }}
            exit={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-zinc-950 border-l border-white/10 flex flex-col shadow-2xl"
          >
            {isLoading || !order ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <p className="text-zinc-500 text-sm">Loading order details...</p>
              </div>
            ) : (
              <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {order.orderNumber}
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  {order.customerName} - {order.styleNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('planning_selected_order', JSON.stringify(String(order.id)));
                    navigate(`/planning/center?orderId=${order.id}`);
                    store.setDrawerOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Plan Order</span>
                </button>
                <button
                  onClick={() => store.setDrawerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-zinc-900/30">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = store.drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => store.setDrawerTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative outline-none",
                      isActive ? "text-blue-400" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab-production"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                        initial={false}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
              <AnimatePresence mode="wait">
                <motion.div
                  key={store.drawerTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {store.drawerTab === "overview" && <OrderOverview order={order} />}
                  {store.drawerTab === "allocations" && <OrderAllocations order={order} />}
                  {store.drawerTab === "timeline" && <OrderTimeline order={order} />}
                </motion.div>
              </AnimatePresence>
            </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
