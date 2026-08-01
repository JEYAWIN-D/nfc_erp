import { useState, useMemo } from "react";
import { useBundleStore } from "../store/bundle.store";
import { useBundles } from "../hooks/useBundles";
import type { Bundle } from "../types/bundle.types";
import { ChevronDown, ChevronUp, Package, Clock, User, Cpu, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { BundleStatusBadge } from "./BundleUIHelpers";
import { BundleIoTSimulatorModal } from "./BundleIoTSimulatorModal";
import { Loader2 } from "lucide-react";

export function BundleProductionView() {
  const { data: bundles = [], isLoading, error } = useBundles();
  const store = useBundleStore();
  
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});
  const [simulatingBundle, setSimulatingBundle] = useState<Bundle | null>(null);

  const togglePO = (po: string) => {
    setExpandedPOs(prev => ({ ...prev, [po]: !prev[po] }));
  };

  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      if (store.poFilter !== "all" && b.productionOrder !== store.poFilter) return false;
      if (store.operationFilter !== "all" && b.operation !== store.operationFilter) return false;
      if (store.departmentFilter !== "all" && b.department !== store.departmentFilter) return false;
      if (store.statusFilter !== "all" && b.status !== store.statusFilter) return false;
      
      if (store.searchQuery) {
        const q = store.searchQuery.toLowerCase();
        return b.bundleNumber.toLowerCase().includes(q) || b.productionOrder.toLowerCase().includes(q) || b.operation.toLowerCase().includes(q);
      }
      return true;
    });
  }, [bundles, store.searchQuery, store.poFilter, store.operationFilter, store.departmentFilter, store.statusFilter]);

  const groupedByPO = useMemo(() => {
    const groups: Record<string, Bundle[]> = {};
    for (const b of filteredBundles) {
      if (!groups[b.productionOrder]) {
        groups[b.productionOrder] = [];
      }
      groups[b.productionOrder].push(b);
    }
    return groups;
  }, [filteredBundles]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-6 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-white/50">Loading productions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-6 min-h-[400px]">
        <p className="text-red-400">Failed to load productions</p>
      </div>
    );
  }

  const formatTime = (time?: string) => {
    if (!time) return "-";
    return new Date(time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-4 bg-zinc-950">
      {Object.entries(groupedByPO).map(([poName, poBundles]) => {
        const isExpanded = !!expandedPOs[poName];
        
        // Compute aggregates
        const totalBundles = poBundles.length;
        const completedBundles = poBundles.filter(b => b.status === "completed").length;
        const inProgressBundles = poBundles.filter(b => b.status === "in_progress").length;
        const progressPercent = totalBundles > 0 ? Math.round((completedBundles / totalBundles) * 100) : 0;

        const firstBundle = poBundles[0];
        const customer = firstBundle?.customerName;
        const style = firstBundle?.styleNumber;

        return (
          <div key={poName} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300">
            {/* Card Header (Clickable) */}
            <div 
              className={cn(
                "p-4 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-between",
                isExpanded ? "border-b border-white/10 bg-white/[0.02]" : ""
              )}
              onClick={() => togglePO(poName)}
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold font-mono text-white tracking-tight">{poName}</h3>
                    <p className="text-xs font-semibold text-blue-400 mt-0.5">
                      {customer || 'Production Order'}
                      {customer && style ? <span className="text-white/50 font-normal"> • {style}</span> : null}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-8 pl-8 border-l border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Bundles Completed</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-400">{completedBundles}</span>
                      <span className="text-sm text-white/30">/</span>
                      <span className="text-sm text-white/60">{totalBundles} Total</span>
                    </div>
                  </div>
                  <div className="w-36">
                    <div className="flex items-center justify-between text-xs font-mono mb-1 gap-2">
                      <span className="text-white/40 text-[11px]">Progress</span>
                      <span className="text-blue-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-white/30 mr-2">
                  {isExpanded ? "Hide Details" : "View Details"}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </div>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="bg-zinc-950/50 p-4">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Bundle #</th>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Operation</th>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Open / Close Time</div></th>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Worker & <Cpu className="w-3.5 h-3.5"/> Machine</div></th>
                        <th className="px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {poBundles.map(bundle => (
                        <tr key={bundle.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-white font-bold">{bundle.bundleNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <BundleStatusBadge status={bundle.status} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white/80 text-sm">{bundle.operation}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex items-center justify-between w-40">
                                <span className="text-emerald-400/80 mr-2">Open:</span>
                                <span className="text-white/60 font-mono">{formatTime(bundle.startedTime)}</span>
                              </div>
                              <div className="flex items-center justify-between w-40">
                                <span className="text-rose-400/80 mr-2">Close:</span>
                                <span className="text-white/60 font-mono">{formatTime(bundle.completedTime)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-xs">
                              {bundle.currentWorker ? (
                                <span className="text-blue-400 font-medium">{bundle.currentWorker}</span>
                              ) : (
                                <span className="text-white/20 italic">No Worker</span>
                              )}
                              {bundle.currentMachine ? (
                                <span className="text-purple-400 font-mono">{bundle.currentMachine}</span>
                              ) : (
                                <span className="text-white/20 italic">No Machine</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); store.setSelectedBundle(bundle.id); }}
                                className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSimulatingBundle(bundle); }}
                                className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                                title="Test IoT Scan"
                              >
                                <Zap className="w-3 h-3" /> Test IoT Scan
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(groupedByPO).length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-white/30 border border-dashed border-white/10 rounded-2xl">
          <Package className="w-12 h-12 mb-4 opacity-50" />
          <p>No production orders found matching your filters.</p>
        </div>
      )}

      {/* Simulator Modal */}
      {simulatingBundle && (
        <BundleIoTSimulatorModal 
          isOpen={true}
          bundle={simulatingBundle} 
          onClose={() => setSimulatingBundle(null)} 
        />
      )}
    </div>
  );
}
