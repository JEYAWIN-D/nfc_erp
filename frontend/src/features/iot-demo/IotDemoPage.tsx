import React, { useState } from 'react';
import {
  Zap,
  Users,
  Cpu,
  Layers,
  Activity,
  RotateCcw,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wrench,
  Percent,
  ArrowLeft,
  Play,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIotDemoStore } from './store/iot-demo.store';
import { useIotDemo } from './hooks/useIotDemo';
import { WorkerDemoCard } from './components/WorkerDemoCard';
import { MachineDemoCard } from './components/MachineDemoCard';
import { BundleDemoCard } from './components/BundleDemoCard';
import { DemoActivityLog } from './components/DemoActivityLog';
import { WorkerAttendanceModal } from './components/WorkerAttendanceModal';

export default function IotDemoPage() {
  const navigate = useNavigate();
  const {
    selectedOrderId,
    setSelectedOrderId,
    activeOperationId,
    setActiveOperationId,
  } = useIotDemoStore();

  const {
    context,
    orders,
    selectedOrder,
    tasks,
    operations,
    bundles,
    attendances,
    workerTimingStats = {},
    isLoading,
    toggleWorker,
    isTogglingWorker,
    toggleMachine,
    isTogglingMachine,
    advanceBundle,
    isAdvancingBundle,
    resetDemo,
    isResettingDemo,
  } = useIotDemo();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [togglingWorkerId, setTogglingWorkerId] = useState<number | null>(null);
  const [activeModalWorker, setActiveModalWorker] = useState<any | null>(null);
  const [optimisticAttendanceMap, setOptimisticAttendanceMap] = useState<Record<number, { attendanceType: string; tapTime: string }>>({});

  // Filter tasks strictly for current order & selected operation ('ALL' or specific op)
  const activeOpId = activeOperationId ?? 'ALL';

  const activeTasks = activeOpId === 'ALL'
    ? tasks.filter((t: any) => !selectedOrderId || t.productionOrderId === selectedOrderId)
    : tasks.filter((t: any) => t.operationId === activeOpId && (!selectedOrderId || t.productionOrderId === selectedOrderId));

  // Extract assigned workers & machines from tasks and activeAssignments
  const assignedWorkerMap = new Map<number, any>();
  const assignedMachineMap = new Map<number, any>();

  activeTasks.forEach((t: any) => {
    if (t.worker) assignedWorkerMap.set(t.worker.id, t.worker);
    if (t.machine) assignedMachineMap.set(t.machine.id, t.machine);
  });

  const activeAssignments = (useIotDemoStore.getState() as any)?.activeAssignments || [];
  if (Array.isArray(activeAssignments)) {
    activeAssignments.forEach((a: any) => {
      if (activeOpId === 'ALL' || a.operationId === activeOpId) {
        if (a.worker) assignedWorkerMap.set(a.worker.id, a.worker);
        if (a.machine) assignedMachineMap.set(a.machine.id, a.machine);
      }
    });
  }

  const assignedWorkersList = Array.from(assignedWorkerMap.values()).sort((a: any, b: any) => a.id - b.id);
  const assignedMachinesList = Array.from(assignedMachineMap.values()).sort((a: any, b: any) => a.id - b.id);

  // Attendance lookup: get latest attendance record per worker for current order session
  const getLatestWorkerAttendance = (workerId: number) => {
    if (optimisticAttendanceMap[workerId]) {
      return optimisticAttendanceMap[workerId];
    }
    if (!Array.isArray(attendances) || attendances.length === 0) return null;
    const orderCreatedAt = selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).getTime() : 0;
    
    const workerRecords = attendances.filter((a: any) => {
      if (Number(a.workerId) !== Number(workerId)) return false;
      const recTime = new Date(a.tapTime || a.createdAt || 0).getTime();
      return orderCreatedAt === 0 || recTime >= orderCreatedAt - 120000;
    });

    if (workerRecords.length === 0) return null;
    return workerRecords.reduce((latest: any, current: any) => {
      const latestTime = new Date(latest.tapTime || latest.createdAt || 0).getTime();
      const currentTime = new Date(current.tapTime || current.createdAt || 0).getTime();
      if (currentTime > latestTime) return current;
      if (currentTime === latestTime && (current.id || 0) > (latest.id || 0)) return current;
      return latest;
    }, workerRecords[0]);
  };

  // Stats calculation
  const presentWorkersCount = assignedWorkersList.filter((w) => {
    const latest = getLatestWorkerAttendance(w.id);
    return latest?.attendanceType === 'IN';
  }).length;
  const runningMachinesCount = assignedMachinesList.filter(
    (m) => m.status === 'ACTIVE' || (m.status as string) === 'running'
  ).length;

  const completedBundlesCount = bundles.filter(
    (b: any) => b.status === 'COMPLETED' || b.status === 'QC_COMPLETED'
  ).length;

  const totalCompletedPcs = bundles.reduce((acc: number, b: any) => acc + (b.completedQuantity || 0), 0);
  const totalTargetPcs = selectedOrder?.plannedQuantity || selectedOrder?.targetQuantity || 100;
  const completionPercent = Math.min(100, Math.round((totalCompletedPcs / totalTargetPcs) * 100));

  const setSearchParams = useSearchParams()[1];

  // Handlers
  const handleOrderChange = (orderId: number) => {
    setSelectedOrderId(orderId);
    setActiveOperationId(null);
    setSearchParams({ orderId: String(orderId) });
  };

  const handleToggleWorker = (workerId: number) => {
    const currentAtt = getLatestWorkerAttendance(workerId);
    const isCurrentlyIn = currentAtt?.attendanceType === 'IN';
    const nextType = isCurrentlyIn ? 'OUT' : 'IN';
    const tapTime = new Date().toISOString();

    // Instant optimistic state update
    setOptimisticAttendanceMap(prev => ({
      ...prev,
      [workerId]: { attendanceType: nextType, tapTime }
    }));

    setTogglingWorkerId(workerId);
    toggleWorker(workerId, {
      onSuccess: (res: any) => {
        setTogglingWorkerId(null);
        toast.success(res.message || 'Worker presence updated');
      },
      onError: (err: any) => {
        setTogglingWorkerId(null);
        setOptimisticAttendanceMap(prev => {
          const next = { ...prev };
          delete next[workerId];
          return next;
        });
        toast.error(err.message || 'Worker toggle failed');
      },
    });
  };

  const handleToggleMachine = (machineId: number, currentStatus: string) => {
    const nextTarget = currentStatus === 'ACTIVE' || currentStatus === 'running' ? 'idle' : 'running';
    toggleMachine(
      { machineId, targetStatus: nextTarget },
      {
        onSuccess: (res: any) => {
          toast.success(res.message || 'Machine status updated');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Machine status failed');
        },
      }
    );
  };

  const presentWorkersList = assignedWorkersList.filter((w) => {
    const latest = getLatestWorkerAttendance(w.id);
    return latest?.attendanceType === 'IN';
  });

  const handleAdvanceBundle = (bundleId: number, workerId?: number) => {
    advanceBundle(
      { bundleId, workerId },
      {
        onSuccess: (res: any) => {
          toast.success(res?.data?.message || res?.message || 'Bundle stage advanced');
        },
        onError: (err: any) => {
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Sequential Gate: Complete previous bundle first';
          toast.error(errorMsg);
        },
      }
    );
  };

  const handleResetDemo = () => {
    resetDemo(selectedOrderId || undefined, {
      onSuccess: () => {
        setShowResetConfirm(false);
        toast.success('Production Order Demo Environment Reset');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Demo reset failed');
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white" style={{ height: 'calc(100vh - 56px)' }}>
      {/* ── Header Bar ── */}
      <header className="shrink-0 border-b border-white/[0.08] bg-zinc-900/80 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 shrink-0" />
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-950/40 shrink-0">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-extrabold text-white tracking-tight">Production Execution Console</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                <Wifi className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5 truncate">
              Worker NFC Check-In · Machine Auto-Sync · Sequential Bundles · Real-Time Floor Sync
            </p>
          </div>
        </div>

        {/* Center: Order Selector with Style Name First */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/10">
          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-white/50 shrink-0">Order:</span>
          <select
            value={selectedOrder?.id || ''}
            onChange={(e) => handleOrderChange(Number(e.target.value))}
            className="bg-transparent text-xs text-white font-bold font-mono appearance-none cursor-pointer focus:outline-none max-w-[240px]"
          >
            {orders.map((po: any) => {
              const customer = po.buyerName || po.customerName || 'Customer';
              const style = po.styleName || po.styleNumber || 'Style';
              return (
                <option key={po.id} value={po.id} className="bg-zinc-900">
                  {customer} — {style} ({po.orderNumber})
                </option>
              );
            })}
          </select>
        </div>

        {/* Right: Reset */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all active:scale-95 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </header>

      {/* ── Order Context Banner with Customer Name Prominent ── */}
      {selectedOrder && (
        <div className="shrink-0 bg-zinc-900/60 border-b border-white/[0.06] px-4 py-2 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider shrink-0">Customer</span>
            <span className="text-sm font-extrabold text-cyan-400 shrink-0">
              {(selectedOrder as any).buyerName || (selectedOrder as any).customerName || 'Customer'}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/70 font-semibold truncate">
              {(selectedOrder as any).styleName || (selectedOrder as any).styleNumber || 'Style'}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/40 font-mono shrink-0">{(selectedOrder as any).orderNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {(selectedOrder as any).status === 'RUNNING' || (selectedOrder as any).status === 'running' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Production Running
              </span>
            ) : (selectedOrder as any).status === 'READY_FOR_PRODUCTION' || (selectedOrder as any).status === 'ready_for_production' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Ready for Production
              </span>
            ) : (selectedOrder as any).status === 'QC' || (selectedOrder as any).status === 'qc' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                QC Pending
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Order Metrics Progress Bar ── */}
      <div className="bg-zinc-900/40 border-b border-white/8 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Workers Present</p>
            <p className="text-sm font-bold font-mono text-white">
              {presentWorkersCount} / {assignedWorkersList.length || 1}{' '}
              <span className="text-[10px] text-emerald-400 font-normal">
                ({Math.round((presentWorkersCount / (assignedWorkersList.length || 1)) * 100)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Machines Running</p>
            <p className="text-sm font-bold font-mono text-white">
              {runningMachinesCount} / {assignedMachinesList.length || 1}{' '}
              <span className="text-[10px] text-blue-400 font-normal">
                ({Math.round((runningMachinesCount / (assignedMachinesList.length || 1)) * 100)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Bundles Done</p>
            <p className="text-sm font-bold font-mono text-white">
              {completedBundlesCount} / {bundles.length || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Percent className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Order Progress</p>
              <span className="text-xs font-bold font-mono text-teal-400">{completionPercent}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Column: Workflow Operations, Workers, Machines, Bundles */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden space-y-4">
          {/* Operation Step Filter Tabs */}
          {operations.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 border-b border-white/8 pb-3 overflow-x-auto hide-scrollbar">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                Operations:
              </span>
              <button
                onClick={() => setActiveOperationId('ALL')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer',
                  activeOpId === 'ALL'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/30'
                    : 'bg-zinc-900/60 border-white/5 text-white/40 hover:text-white hover:bg-zinc-900'
                )}
              >
                All Operations ({tasks.length})
              </button>
              {operations.map((op: any) => (
                <button
                  key={op.id}
                  onClick={() => setActiveOperationId(op.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer',
                    activeOpId === op.id
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/30'
                      : 'bg-zinc-900/60 border-white/5 text-white/40 hover:text-white hover:bg-zinc-900'
                  )}
                >
                  {op.operationName}
                </button>
              ))}
            </div>
          )}

          {/* Workflow Sections Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
            {/* 1. ASSIGNED WORKERS (Assigned → Ready → Present) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Assigned Workers ({assignedWorkersList.length}) — Click to Check-IN / Check-OUT
                  </h2>
                </div>
              </div>

              {assignedWorkersList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-white/30">
                  No workers assigned to this operation task in Planning.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {assignedWorkersList.map((w: any) => {
                    const latestAttendance = getLatestWorkerAttendance(w.id);
                    const isCheckedIn = latestAttendance?.attendanceType === 'IN';
                    const matchingTask = activeTasks.find((t: any) => t.workerId === w.id);
                    const orderStatus = (selectedOrder as any)?.status;
                    const orderIsCompleted = orderStatus === 'QC' || orderStatus === 'qc' || orderStatus === 'COMPLETED' || orderStatus === 'completed' || matchingTask?.status === 'COMPLETED';
                    const activeWorkerBundle = bundles.find((b: any) => b.currentWorkerId === w.id && b.status === 'IN_PROGRESS');

                    return (
                      <WorkerDemoCard
                        key={w.id}
                        worker={w}
                        latestAttendance={latestAttendance}
                        operationName={matchingTask?.operation?.operationName}
                        machineCode={matchingTask?.machine?.machineCode}
                        activeBundleNumber={activeWorkerBundle?.bundleNumber}
                        avgMinutesPerBundle={workerTimingStats[w.id]?.avgMinutesPerBundle || 14.5}
                        isCompleted={orderIsCompleted}
                        onOpenModal={() => setActiveModalWorker(w)}
                        isLoading={togglingWorkerId === w.id}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. ASSIGNED MACHINES (Idle → Ready → Running) */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Assigned Machines ({assignedMachinesList.length}) — Idle ↔ Ready ↔ Running
                  </h2>
                </div>
              </div>

              {assignedMachinesList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-white/30">
                  No machines assigned to this operation task in Planning.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {assignedMachinesList.map((m: any) => {
                    const isRunning = m.status === 'ACTIVE' || (m.status as string) === 'running';
                    const assignedWorker = activeTasks.find((t: any) => t.machineId === m.id)?.worker
                      || activeAssignments.find((a: any) => a.machineId === m.id)?.worker
                      || tasks.find((t: any) => t.machineId === m.id)?.worker;

                    const workerLatestAttendance = assignedWorker ? getLatestWorkerAttendance(assignedWorker.id) : null;
                    const isWorkerPresent = workerLatestAttendance?.attendanceType === 'IN';

                    return (
                      <MachineDemoCard
                        key={m.id}
                        machine={m}
                        isRunning={isRunning}
                        isWorkerPresent={isWorkerPresent}
                        assignedWorker={assignedWorker}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. SEQUENTIAL BUNDLE QUEUE */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sequential Bundle Queue ({bundles.length}) — Only 1 Active at a time
                  </h2>
                </div>
              </div>

              {bundles.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-white/30">
                  No bundles generated for this production order. Generate bundles in the Bundle module.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {bundles.map((b: any, idx: number) => {
                    // Sequential Gating: Bundle is locked if previous bundle is not completed
                    const isLocked =
                      idx > 0 &&
                      b.status === 'CREATED' &&
                      bundles[idx - 1].status !== 'COMPLETED' &&
                      bundles[idx - 1].status !== 'QC_COMPLETED';

                    return (
                      <BundleDemoCard
                        key={b.id}
                        bundle={b}
                        isLocked={isLocked}
                        presentWorkers={presentWorkersList}
                        onAdvance={(workerId) => handleAdvanceBundle(b.id, workerId)}
                        isLoading={isAdvancingBundle}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Right Column: Live Event Activity Log Stream */}
        <div className="w-80 sm:w-96 shrink-0 h-full overflow-hidden">
          <DemoActivityLog />
        </div>
      </div>

      {/* ── Worker Attendance NFC Modal ── */}
      <WorkerAttendanceModal
        worker={activeModalWorker}
        isOpen={!!activeModalWorker}
        onClose={() => setActiveModalWorker(null)}
        latestAttendance={activeModalWorker ? getLatestWorkerAttendance(activeModalWorker.id) : null}
        operationName={activeTasks.find((t: any) => t.workerId === activeModalWorker?.id)?.operation?.operationName}
        machineCode={activeTasks.find((t: any) => t.workerId === activeModalWorker?.id)?.machine?.machineCode}
        activeBundles={bundles.filter((b: any) => b.currentWorkerId === activeModalWorker?.id && b.status === 'IN_PROGRESS')}
        availableBundles={bundles.filter((b: any) => b.status !== 'COMPLETED' && b.status !== 'QC_COMPLETED' && b.currentWorkerId !== activeModalWorker?.id)}
        avgMinutesPerBundle={activeModalWorker ? (workerTimingStats[activeModalWorker.id]?.avgMinutesPerBundle || 14.5) : 14.5}
        onToggleAttendance={(workerId, selectedBundleId) => {
          handleToggleWorker(workerId);
          if (selectedBundleId) {
            handleAdvanceBundle(selectedBundleId, workerId);
          }
          setActiveModalWorker(null);
        }}
        onClaimBundle={(bundleId, workerId) => {
          handleAdvanceBundle(bundleId, workerId);
        }}
        isLoading={togglingWorkerId === activeModalWorker?.id}
      />

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Reset Production Order Demo?</h3>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              This will set all workers assigned to this order to <span className="text-white font-semibold">Absent</span>, machines to{' '}
              <span className="text-white font-semibold">Idle</span>, bundles to <span className="text-white font-semibold">Allocated</span>, and clear activity logs.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isResettingDemo}
                onClick={handleResetDemo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/30 transition-all flex items-center gap-2"
              >
                {isResettingDemo ? 'Resetting…' : 'Yes, Reset Order Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
