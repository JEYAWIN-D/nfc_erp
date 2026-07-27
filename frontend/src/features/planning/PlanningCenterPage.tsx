import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Play, ArrowRight, Package, Layers, CheckCircle, Wand2, Users, Cpu, ShieldAlert, CheckSquare, Clock, ChevronUp, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { useProductionOrders } from "../production-order/hooks/useProductionOrderData";
import { useLivePlanningResources } from "./hooks/useLivePlanningResources";
import { useOperations } from "../operation/hooks/useOperations";
import { useOperationBundles } from "./hooks/useOperationBundles";
import { usePlanningMutations } from "./hooks/usePlanningMutations";
import { usePlanningDashboard, usePlanningHistory } from "./hooks/usePlanning";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "../production-order/components/ProductionOrderUIHelpers";
import type { OrderStatus } from "../production-order/types/production-order.types";
import { AllocationWizardModal } from "./components/AllocationWizardModal";
import { BundleTagsModal } from "./components/BundleTagsModal";

function LiveOperationTracker({ operationId }: { operationId: number }) {
  const { data: openBundles = [] } = useOperationBundles(operationId);

  if (openBundles.length === 0) return null;

  return (
    <div className="mt-2 bg-black/40 border border-emerald-500/20 rounded-lg p-2.5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          Active Bundles ({openBundles.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {openBundles.map((log: any) => (
          <div key={log.id} className="bg-zinc-900 border border-white/5 rounded px-2 py-1 flex items-center gap-2 text-xs">
            <Package className="w-3 h-3 text-emerald-500/70" />
            <span className="font-mono text-emerald-100">{log.bundle?.bundleNumber}</span>
            {log.operator && (
              <span className="text-white/40 border-l border-white/10 pl-2">
                {log.operator.firstName}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlanningCenterPage() {
  const [searchParams] = useSearchParams();
  const { orders, isLoading: loadingOrders } = useProductionOrders();
  const { data: resources, isLoading: loadingResources } = useLivePlanningResources();
  const { data: operations = [], isLoading: loadingOps } = useOperations({ status: 'ACTIVE' });
  const { publishPlan } = usePlanningMutations();
  const { data: metrics, isLoading: loadingMetrics } = usePlanningDashboard();
  const { data: historyData = [], isLoading: loadingHistory } = usePlanningHistory();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId) return urlOrderId;
    try {
      const saved = localStorage.getItem('planning_selected_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId && urlOrderId !== selectedOrderId) {
      setSelectedOrderId(urlOrderId);
      localStorage.setItem('planning_selected_order', JSON.stringify(urlOrderId));
    }
  }, [searchParams]);

  const [drafts, setDrafts] = useState<Record<string, {
    selectedOperations: number[];
    assignments: Record<number, { machineId: number, workerId: number, roomId?: number | string, rowIndex?: number, positionIndex?: number }[]>;
    piecesPerBundle: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('planning_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [piecesPerBundle, setPiecesPerBundle] = useState<number | "">(() => {
    try {
      const savedOrderId = localStorage.getItem('planning_selected_order');
      if (savedOrderId) {
        const orderId = JSON.parse(savedOrderId);
        const savedDrafts = localStorage.getItem('planning_drafts');
        if (savedDrafts) {
          const draftsObj = JSON.parse(savedDrafts);
          if (draftsObj[orderId] && draftsObj[orderId].piecesPerBundle) return draftsObj[orderId].piecesPerBundle;
        }
      }
    } catch {}
    return 12;
  });

  const [selectedOperations, setSelectedOperations] = useState<number[]>(() => {
    try {
      const savedOrderId = localStorage.getItem('planning_selected_order');
      if (savedOrderId) {
        const orderId = JSON.parse(savedOrderId);
        const savedDrafts = localStorage.getItem('planning_drafts');
        if (savedDrafts) {
          const draftsObj = JSON.parse(savedDrafts);
          if (draftsObj[orderId]) return draftsObj[orderId].selectedOperations || [];
        }
      }
    } catch {}
    return [];
  });

  const [assignments, setAssignments] = useState<Record<number, { machineId: number, workerId: number, roomId?: number | string, rowIndex?: number, positionIndex?: number }[]>>(() => {
    try {
      const savedOrderId = localStorage.getItem('planning_selected_order');
      if (savedOrderId) {
        const orderId = JSON.parse(savedOrderId);
        const savedDrafts = localStorage.getItem('planning_drafts');
        if (savedDrafts) {
          const draftsObj = JSON.parse(savedDrafts);
          if (draftsObj[orderId]) return draftsObj[orderId].assignments || {};
        }
      }
    } catch {}
    return {};
  });
  
  const [selectedShiftId, setSelectedShiftId] = useState<number>(1);
  
  // Drawer state
  const [activeOperationId, setActiveOperationId] = useState<number | null>(null);
  // Phase 3: which operation's bundle tracker is expanded
  const [expandedOperationId, setExpandedOperationId] = useState<number | null>(null);

  // Tags Modal state
  const [generatedBundles, setGeneratedBundles] = useState<{ quantity: number }[] | null>(null);
  const [publishedOrderNumber, setPublishedOrderNumber] = useState<string>("");

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    const activeDrafts = { ...drafts };
    if (selectedOrderId) {
      activeDrafts[selectedOrderId] = {
        selectedOperations,
        assignments,
        piecesPerBundle: piecesPerBundle || 12
      };
      localStorage.setItem('planning_selected_order', JSON.stringify(selectedOrderId));
    } else {
      localStorage.removeItem('planning_selected_order');
    }
    localStorage.setItem('planning_drafts', JSON.stringify(activeDrafts));
  }, [selectedOrderId, selectedOperations, assignments, piecesPerBundle, drafts]);

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === "planned" || (o.status as string) === 'PLANNED' || (o.status as string) === 'DRAFT' || (o.status as string) === 'draft');
  }, [orders]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return undefined;
    return pendingOrders.find(o => o.id === selectedOrderId);
  }, [pendingOrders, selectedOrderId]);

  // Auto-validate selectedOrderId against PENDING orders to clear published/stale selections
  useEffect(() => {
    if (!loadingOrders) {
      if (pendingOrders.length > 0) {
        const exists = pendingOrders.some(o => o.id === selectedOrderId);
        if (!exists) {
          const firstId = pendingOrders[0].id;
          setSelectedOrderId(firstId);
          const draft = drafts[firstId];
          setAssignments(draft?.assignments || {});
          setPiecesPerBundle(draft?.piecesPerBundle || 12);
          setSelectedOperations(draft?.selectedOperations || []);
        }
      } else {
        setSelectedOrderId(null);
        localStorage.removeItem('planning_selected_order');
        setAssignments({});
        setSelectedOperations([]);
      }
    }
  }, [pendingOrders, loadingOrders, selectedOrderId]);

  const handleSelectOrder = (id: string) => {
    if (selectedOrderId) {
      setDrafts(prev => ({
        ...prev,
        [selectedOrderId]: {
          selectedOperations,
          assignments: assignments as any,
          piecesPerBundle: Number(piecesPerBundle) || 12
        } as any
      }));
    }

    const nextDraft = drafts[id];
    
    setSelectedOrderId(id);
    setAssignments(nextDraft?.assignments || {});
    setPiecesPerBundle(nextDraft?.piecesPerBundle || 12);
    setSelectedOperations(nextDraft?.selectedOperations || []);
    setActiveOperationId(null);
    setExpandedOperationId(null);
  };

  const handleToggleOperation = (opId: number) => {
    setSelectedOperations(prev => {
      if (prev.includes(opId)) {
        return prev.filter(id => id !== opId);
      } else {
        return [...prev, opId];
      }
    });
  };

  const handleMoveStep = (opId: number, direction: 'up' | 'down') => {
    setSelectedOperations(prev => {
      const idx = prev.indexOf(opId);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };



  const handleAutoPlan = () => {
    if (!selectedOrder || !resources) return;
    
    const newAssignments: Record<number, { machineId: number, workerId: number }[]> = {};
    
    // Sort workers by grade priority (highest first) and try to stick to primary department
    const sortedWorkers = [...resources.workers].sort((a, b) => (b.grade?.priority || 0) - (a.grade?.priority || 0));
    const availableWorkers = sortedWorkers.filter(w => (w.assignments?.length || 0) === 0);
    const availableMachines = resources.machines.filter((m: any) => (m.assignments?.length || 0) === 0);
    let machineIndex = 0;
    const usedWorkerIds = new Set<number>();

    const activeOps = operations
      .filter(op => selectedOperations.includes(Number(op.id)))
      // Respect the user-defined order
      .sort((a, b) => selectedOperations.indexOf(Number(a.id)) - selectedOperations.indexOf(Number(b.id)));

    activeOps.forEach(op => {
      const requiredMinutes = Math.ceil(selectedOrder.targetQuantity * (op as any).smv);
      const requiredWorkers = Math.ceil(requiredMinutes / 480); // Assuming 8 hr shift
      
      const pairs: { machineId: number, workerId: number }[] = [];
      
      // Filter available workers by required skill if applicable
      const reqSkillId = (op as any).requiredSkillId;
      const qualifiedWorkers = reqSkillId 
        ? availableWorkers.filter(w => (w as any).skills?.some((s: any) => s.skillId === reqSkillId))
        : availableWorkers;

      for(let i=0; i<requiredWorkers; i++) {
        // We find the next available qualified worker
        const nextWorker = qualifiedWorkers.find(w => !usedWorkerIds.has(w.id));
        let wId = null;
        if(nextWorker) {
          usedWorkerIds.add(nextWorker.id);
          wId = nextWorker.id;
        }
        
        let mId = null;
        if(machineIndex < availableMachines.length) {
          mId = availableMachines[machineIndex++].id;
        }

        if (wId !== null && mId !== null) {
          pairs.push({ workerId: wId, machineId: mId });
        }
      }
      
      if (op.id) newAssignments[Number(op.id)] = pairs;
    });

    setAssignments(newAssignments);
  };

  const handlePublish = () => {
    if (!selectedOrder) return;

    const bundleSize = typeof piecesPerBundle === 'number' ? piecesPerBundle : 12;
    const bundles: { quantity: number }[] = [];
    let remainingQty = selectedOrder.targetQuantity;

    while (remainingQty > 0) {
      const q = Math.min(bundleSize, remainingQty);
      bundles.push({ quantity: q });
      remainingQty -= q;
    }

    const getValidNumber = (val: any) => (val !== null && val !== undefined && val !== '' && !isNaN(Number(val))) ? Number(val) : undefined;

    const assignmentArray: any[] = [];
    Object.entries(assignments).forEach(([opIdStr, alloc]) => {
      const opId = Number(opIdStr);
      if (alloc && Array.isArray(alloc)) {
        alloc.forEach((pair: any) => {
          assignmentArray.push({
            operationId: opId,
            workerId: pair.workerId,
            machineId: pair.machineId,
            shiftId: selectedShiftId || 1,
            roomId: getValidNumber(pair.roomId),
            rowIndex: getValidNumber(pair.rowIndex),
            positionIndex: getValidNumber(pair.positionIndex)
          });
        });
      }
    });

    const validMachineIds = new Set((resources?.machines || []).map((m: any) => Number(m.id)));
    const validWorkerIds = new Set((resources?.workers || []).map((w: any) => Number(w.id)));

    let cleanAssignments = assignmentArray;
    if (validMachineIds.size > 0 && validWorkerIds.size > 0) {
      cleanAssignments = assignmentArray.filter(a => 
        validMachineIds.has(Number(a.machineId)) && validWorkerIds.has(Number(a.workerId))
      );

      if (assignmentArray.length > 0 && cleanAssignments.length < assignmentArray.length) {
        const removedCount = assignmentArray.length - cleanAssignments.length;
        if (cleanAssignments.length === 0) {
          toast.error("Assignments contain invalid IDs. Please click 'Auto-Plan' or 'Reset' to allocate valid resources.");
          return;
        } else {
          toast.warning(`${removedCount} invalid assignment(s) were cleaned before publishing.`);
        }
      }
    }

    if (selectedOperations.length === 0) {
      alert("Please define the Operation Routing (Step 1) before publishing.");
      return;
    }

    publishPlan.mutate({
      productionOrderId: Number(selectedOrder.id),
      bundles,
      assignments: cleanAssignments,
      // Pass operations in step order — backend uses this for displayOrder gating
      operations: selectedOperations,
      operationOrder: selectedOperations.map((id, idx) => ({ operationId: id, stepOrder: idx + 1 }))
    }, {
      onSuccess: () => {
        setPublishedOrderNumber(selectedOrder.orderNumber);
        setGeneratedBundles(bundles);
        
        // Remove from drafts
        setDrafts(prev => {
          const newDrafts = { ...prev };
          if (selectedOrderId) {
            delete newDrafts[selectedOrderId];
          }
          return newDrafts;
        });

        setSelectedOrderId(null);
        setSelectedOperations([]);
        setAssignments({});
        localStorage.removeItem('planning_selected_order');
        toast.success("Plan published and tags assigned successfully.");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || err.message || "Failed to publish plan");
      }
    });
  };

  const isLoading = loadingOrders || loadingResources || loadingOps || loadingMetrics || loadingHistory;
  const isPublishing = publishPlan.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-zinc-950">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const activeOp = activeOperationId ? operations.find(o => Number(o.id) === activeOperationId) : null;
  const activeOpReqMinutes = activeOp && selectedOrder ? Math.ceil(selectedOrder.targetQuantity * (activeOp as any).smv) : 0;

  // Filter out resources already assigned to OTHER operations in this planning session
  const globallyAssignedWorkers = new Set<number>();
  const globallyAssignedMachines = new Set<number>();

  if (activeOperationId) {
    Object.entries(assignments).forEach(([opIdStr, allocs]) => {
      if (Number(opIdStr) !== activeOperationId) {
        allocs.forEach(a => {
          globallyAssignedWorkers.add(Number(a.workerId));
          globallyAssignedMachines.add(Number(a.machineId));
        });
      }
    });
  }

  const filteredWorkers = (resources?.workers || []) as any[];
  const filteredMachines = (resources?.machines || []) as any[];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden relative">
      
      {/* Dashboard Section */}
      {metrics && (
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-zinc-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Orders */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider">Orders</h3>
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-white">{metrics.orders.active}</span>
                <span className="text-[10px] font-medium text-white/40 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-white/50 pt-1 border-t border-white/5 mt-1">
                <span>Tot: {metrics.orders.total}</span>
                <span className="text-emerald-500">Done: {metrics.orders.completed}</span>
              </div>
            </motion.div>

            {/* Bundles */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider">Bundles</h3>
                <Layers className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-white">{metrics.bundles.active}</span>
                <span className="text-[10px] font-medium text-white/40 uppercase">Running</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-white/50 pt-1 border-t border-white/5 mt-1">
                <span className="text-amber-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Wait: {metrics.bundles.waiting}</span>
              </div>
            </motion.div>

            {/* Workers */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider">Workers</h3>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-white">{metrics.workers.available}</span>
                <span className="text-[10px] font-medium text-white/40 uppercase">Avail</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-white/50 pt-1 border-t border-white/5 mt-1">
                <span>Tot: {metrics.workers.total}</span>
                <span className="text-amber-500">Busy: {metrics.workers.busy}</span>
              </div>
            </motion.div>

            {/* Machines */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider">Machines</h3>
                <Cpu className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-2xl font-bold text-white">{metrics.machines.available}</span>
                <span className="text-[10px] font-medium text-white/40 uppercase">Avail</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-white/50 pt-1 border-t border-white/5 mt-1">
                <span>Tot: {metrics.machines.total}</span>
                <span className="text-amber-500">Busy: {metrics.machines.busy}</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      
      {/* Bundle Tags Modal */}
      <BundleTagsModal 
        isOpen={generatedBundles !== null}
        onClose={() => setGeneratedBundles(null)}
        orderNumber={publishedOrderNumber}
        bundles={generatedBundles || []}
      />

      <AllocationWizardModal 
        isOpen={activeOperationId !== null}
        onClose={() => setActiveOperationId(null)}
        operationName={(activeOp as any)?.name || ""}
        availableWorkers={filteredWorkers}
        availableMachines={filteredMachines}
        initialAllocations={activeOperationId ? (assignments[activeOperationId] || []) : []}
        allAssignments={assignments}
        activeOperationId={activeOperationId}
        requiredSkillId={(activeOp as any)?.requiredSkillId}
        compatibleMachines={(activeOp as any)?.compatibleMachines}
        onSave={(allocations) => {
          if (activeOperationId) {
            setAssignments(prev => ({
              ...prev,
              [activeOperationId]: allocations
            }));
            setActiveOperationId(null);
          }
        }}
      />

      {/* Left Sidebar: PO Queue */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-zinc-900/30 flex flex-col overflow-hidden flex-shrink-0 md:h-full h-[250px]">
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-bold">Unplanned Orders</h2>
          <p className="text-xs text-white/50 mt-1">Select an order to start planning</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {pendingOrders.length === 0 ? (
            <div className="text-center p-6 text-white/40 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
              All caught up! No pending orders.
            </div>
          ) : (
            pendingOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => handleSelectOrder(order.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all",
                  selectedOrderId === order.id 
                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "bg-zinc-900 border-white/10 hover:border-white/30"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="text-sm font-medium mb-1 truncate">{order.customerName} - {order.styleNumber}</div>
                <div className="text-xs text-white/60 flex items-center justify-between">
                  <span>Qty: {order.targetQuantity}</span>
                  <span className="text-emerald-400 font-medium">Priority: {order.priority}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Canvas: Planning Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedOrder ? (
          <>
            <div className="p-6 border-b border-white/10 flex-shrink-0 bg-zinc-900/50">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">{selectedOrder.orderNumber} - Smart Plan</h1>
                  <p className="text-sm text-white/60 mt-1">{selectedOrder.customerName} | {selectedOrder.styleNumber} | Dept: {selectedOrder.department}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-zinc-800 border border-white/10 px-3 py-2 rounded-lg text-xs">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/60 font-semibold">Shift:</span>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => setSelectedShiftId(Number(e.target.value))}
                      className="bg-transparent text-white font-bold outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-zinc-900 text-white">🌅 Shift A (Morning 07:00 - 15:00)</option>
                      <option value={2} className="bg-zinc-900 text-white">🌆 Shift B (Evening 15:00 - 23:00)</option>
                      <option value={3} className="bg-zinc-900 text-white">🌃 Shift C (Night 23:00 - 07:00)</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      setAssignments({});
                      toast.info("Assignments reset.");
                    }}
                    className="flex items-center gap-1.5 bg-zinc-800 text-white/70 hover:text-white hover:bg-zinc-700 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border border-white/10"
                    title="Reset all assignments for this order"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>

                  <button 
                    onClick={handleAutoPlan}
                    className="flex items-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-4 py-2.5 rounded-lg font-semibold transition-all border border-blue-500/30"
                  >
                    <Wand2 className="w-4 h-4" /> Auto-Plan
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    {isPublishing ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Publish to IoT
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Step 1: Operation Routing & Allocation */}
              <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg"><CheckSquare className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold">1. Define Operation Routing & Allocate</h2>
                    <p className="text-xs text-white/50">Select operations and allocate workers & machines immediately</p>
                  </div>
                </div>
                
                {/* Two-panel: pick operations on left, ordered steps on right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: available operations to add */}
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Available Operations</p>
                    <div className="space-y-2">
                      {operations.map(op => {
                        const isSelected = selectedOperations.includes(Number(op.id));
                        return (
                          <button
                            key={op.id}
                            onClick={() => handleToggleOperation(Number(op.id))}
                            className={cn(
                              "w-full p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-left",
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/50 opacity-60 cursor-default"
                                : "bg-zinc-950 border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                            )}
                            disabled={isSelected}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border shrink-0",
                              isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20 bg-zinc-900"
                            )}>
                              {isSelected && <CheckCircle className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-white/80">{(op as any).name}</div>
                              <div className="text-[10px] text-white/40 font-mono">{op.operationCode} | SMV: {(op as any).smv}</div>
                            </div>
                          </button>
                        );
                      })}
                      {operations.length === 0 && (
                        <div className="text-center py-4 text-white/40 text-sm">No operations found in the system.</div>
                      )}
                    </div>
                  </div>

                  {/* Right: ordered step sequence */}
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Operation Routing Sequence</p>
                    {selectedOperations.length === 0 ? (
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-white/30 text-sm">
                        <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Click operations on the left to add steps
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedOperations.map((opId, stepIdx) => {
                          const op = operations.find(o => Number(o.id) === opId);
                          if (!op) return null;
                          const alloc = assignments[opId] || [];
                          return (
                            <div key={opId}>
                              <div
                                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3"
                              >
                              {/* Step badge */}
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                                {stepIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-emerald-300 truncate">{(op as any).name}</div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] text-white/40 font-mono">{op.operationCode} | SMV: {(op as any).smv}</span>
                                  <span className="text-[10px] text-emerald-400/70 flex items-center gap-1"><Users className="w-2.5 h-2.5" />{alloc.length} <Cpu className="w-2.5 h-2.5 ml-1" />{alloc.length}</span>
                                </div>
                              </div>
                              {/* Reorder buttons */}
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => handleMoveStep(opId, 'up')}
                                  disabled={stepIdx === 0}
                                  className="p-0.5 rounded text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleMoveStep(opId, 'down')}
                                  disabled={stepIdx === selectedOperations.length - 1}
                                  className="p-0.5 rounded text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              {/* Edit allocation */}
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveOperationId(opId); }}
                                className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition-colors"
                              >
                                Allocate
                              </button>
                              {/* Remove */}
                              <button
                                onClick={() => handleToggleOperation(opId)}
                                className="text-xs text-red-400/70 hover:text-red-400 px-1 py-1 rounded transition-colors"
                                title="Remove step"
                              >
                                ×
                              </button>
                            </div>
                            
                            {/* Phase 3.4: Live Tracker */}
                            {selectedOrder.status === 'running' && (
                              <LiveOperationTracker operationId={opId} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                </div>

                {selectedOperations.length === 0 && operations.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Please select at least one operation to define the routing plan.
                  </div>
                )}
              </section>

              {/* Step 2: Segregation */}
              <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><Layers className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold">2. Bundle Segregation</h2>
                    <p className="text-xs text-white/50">Split {selectedOrder.targetQuantity} items into trackable bundles</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex-1 max-w-sm">
                    <label className="text-sm text-white/70 block mb-2">Pieces per Bundle (Bundle Size)</label>
                    <input 
                      type="number" 
                      min="1"
                      max={selectedOrder.targetQuantity}
                      value={piecesPerBundle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setPiecesPerBundle("");
                          return;
                        }
                        const raw = parseInt(val);
                        if (!isNaN(raw)) {
                          setPiecesPerBundle(Math.max(1, Math.min(raw, selectedOrder.targetQuantity)));
                        }
                      }}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-400 font-medium mb-1">Generated Bundles</div>
                        <div className="text-2xl font-bold">{piecesPerBundle ? Math.ceil(selectedOrder.targetQuantity / (piecesPerBundle as number)) : 0}</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-blue-500/50" />
                      <div>
                        <div className="text-sm text-blue-400 font-medium mb-1">Items per Bundle</div>
                        <div className="text-2xl font-bold">{piecesPerBundle || "-"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Planning History */}
              <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg"><Clock className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold">Shop Floor Tracking Logs</h2>
                    <p className="text-xs text-white/50">Live terminal scans and activity for {selectedOrder.orderNumber}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {historyData.filter((h: any) => h.bundle?.productionOrderId === Number(selectedOrder.id)).length > 0 ? (
                    historyData
                      .filter((h: any) => h.bundle?.productionOrderId === Number(selectedOrder.id))
                      .slice(0, 5)
                      .map((log: any) => (
                        <div key={log.id} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                                Tag: {log.tag?.tagCode || 'N/A'}
                              </span>
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                Bundle: {log.bundle?.bundleNumber}
                              </span>
                            </div>
                            <span className="text-[10px] text-white/40">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="text-white/60">Operation:</span>
                            <span className="text-white font-medium">{log.operation?.name || log.operation?.operationName || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm mt-1 bg-white/5 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-500" />
                              <span className="text-white/80">{log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'System Assigned'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-blue-500" />
                              <span className="text-white/80">Assigned Machine</span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 border border-white/5 border-dashed rounded-xl flex flex-col items-center gap-3 bg-zinc-950">
                      <Clock className="w-8 h-8 text-white/10" />
                      <p className="text-sm text-white/40 max-w-sm">No activity logged yet. Tracking logs will appear here once workers scan bundles on the shop floor.</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Select an Order</h2>
            <p className="text-white/40 max-w-md">
              Choose a production order from the queue to start smart capacity planning.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
