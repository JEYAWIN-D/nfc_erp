import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Cog,
  FileText,
  Layers,
  ShieldCheck,
  RefreshCw,
  Search,
  Radio,
  Bell,
  CheckCheck,
  CheckSquare,
  AlertTriangle,
  User,
  Factory,
  Shield,
  Clock,
  Package,
  List,
  LayoutGrid,
  Award,
  AlertOctagon,
  HardDrive,
  Percent
} from "lucide-react";
import { PageContainer, PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDashboardOverview, useLiveFloorData, useDashboardAttendance, useDashboardExtended } from "./hooks/useDashboardData";
import { useNotificationStore } from "@/store/notification.store";
import { formatRelativeTime } from "@/shared/utils/date.utils";
import { cn } from "@/lib/utils";
import type { LiveMachineCard, AttendanceTapRecord } from "./types/dashboard.types";
import type { Notification } from "@/shared/types";

// Types mapping for notifications icons/colors
const typeConfig: Record<Notification["type"], { icon: React.ComponentType<{ className?: string }>, color: string, bg: string }> = {
  machine: { icon: Factory, color: "text-orange-500", bg: "bg-orange-500/10" },
  worker: { icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
  production: { icon: Package, color: "text-green-500", bg: "bg-green-500/10" },
  qc: { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  attendance: { icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
  bundle: { icon: Package, color: "text-cyan-500", bg: "bg-cyan-500/10" },
};

const priorityBar: Record<Notification["priority"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const getDateRange = () => {
    if (dateFilter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    } else if (dateFilter === "yesterday") {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    } else {
      if (!customStartDate) return { start: undefined, end: undefined };
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = customEndDate ? new Date(customEndDate) : new Date();
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
  };

  const { start: filterStart, end: filterEnd } = getDateRange();

  const { 
    data: overview, 
    isLoading: loadingOverview, 
    isRefetching: refetchingOverview, 
    refetch: refetchOverview 
  } = useDashboardOverview(filterStart, filterEnd);
  
  const { 
    data: liveFloor = [], 
    isLoading: loadingFloor, 
    isRefetching: refetchingFloor, 
    refetch: refetchFloor 
  } = useLiveFloorData();

  const {
    data: attendanceLogs = [],
    isLoading: loadingAttendance,
    isRefetching: refetchingAttendance,
    refetch: refetchAttendance
  } = useDashboardAttendance();

  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const {
    data: extendedData,
    isLoading: loadingExtended,
    isRefetching: refetchingExtended,
    refetch: refetchExtended
  } = useDashboardExtended(filterStart, filterEnd);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "RUNNING" | "IDLE" | "OFFLINE">("ALL");
  const [viewType, setViewType] = useState<"table" | "grid">("table");
  const [activeRightTab, setActiveRightTab] = useState<"alerts" | "attendance">("alerts");
  const [dashboardView, setDashboardView] = useState<"floor" | "admin">("floor");
  const [selectedMiniMapMachine, setSelectedMiniMapMachine] = useState<any>(null);

  const handleRefresh = async () => {
    await Promise.all([
      refetchOverview(),
      refetchFloor(),
      refetchAttendance(),
      refetchExtended()
    ]);
  };

  const filteredMachines = liveFloor.filter((machine) => {
    const matchesSearch = 
      machine.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.machineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (machine.workerName && machine.workerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (machine.operation && machine.operation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || machine.machineStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeMachinesCount = liveFloor.filter(m => m.machineStatus === "RUNNING").length;
  const idleMachinesCount = liveFloor.filter(m => m.machineStatus === "IDLE").length;
  const offlineMachinesCount = liveFloor.filter(m => m.machineStatus === "OFFLINE").length;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Industrial Dashboard"
        description="Real-time operations tracking, shop-floor machinery status, and live production logs."
        breadcrumbs={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>/</span>
            <span className="text-foreground font-medium">Dashboard</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter Selector */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/10">
            <button
              onClick={() => setDateFilter("today")}
              className={cn(
                "text-xs px-2.5 py-1.5 font-semibold rounded-md transition-all",
                dateFilter === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter("yesterday")}
              className={cn(
                "text-xs px-2.5 py-1.5 font-semibold rounded-md transition-all",
                dateFilter === "yesterday" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter("custom")}
              className={cn(
                "text-xs px-2.5 py-1.5 font-semibold rounded-md transition-all",
                dateFilter === "custom" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Custom Date
            </button>
          </div>

          {/* Custom Date Input Fields */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-1.5 bg-muted/40 border border-border/30 px-2 py-1 rounded-lg">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-transparent border-0 outline-none text-foreground focus:ring-0 p-0 w-28 [color-scheme:dark]"
                title="Start Date"
              />
              <span className="text-muted-foreground text-[10px] font-bold px-1">TO</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-transparent border-0 outline-none text-foreground focus:ring-0 p-0 w-28 [color-scheme:dark]"
                title="End Date"
              />
            </div>
          )}

          {/* Main Dashboard View Selector */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/10">
            <button
              onClick={() => setDashboardView("floor")}
              className={cn(
                "text-xs px-2.5 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5",
                dashboardView === "floor" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Radio className="w-3.5 h-3.5" />
              Live Shop Floor
            </button>
            <button
              onClick={() => setDashboardView("admin")}
              className={cn(
                "text-xs px-2.5 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5",
                dashboardView === "admin" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin Operations
            </button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loadingOverview || loadingFloor || refetchingOverview || refetchingFloor || loadingExtended}
            className="gap-2 border-border/60 hover:bg-muted font-medium transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", (refetchingOverview || refetchingFloor || refetchingAttendance || refetchingExtended) && "animate-spin")} />
            Sync Data
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards Grid */}
      {loadingOverview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {/* Workers Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-16 h-16 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workers</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {overview?.workers.present ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">/ {overview?.workers.total ?? 0} Present</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/30 text-[11px] text-muted-foreground font-medium">
              <div>
                <span className="text-emerald-500 font-bold block">{overview?.workers.active ?? 0}</span>
                <span>Active</span>
              </div>
              <div>
                <span className="text-amber-500 font-bold block">{overview?.workers.idle ?? 0}</span>
                <span>Idle</span>
              </div>
              <div>
                <span className="text-rose-500 font-bold block">{overview?.workers.absent ?? 0}</span>
                <span>Absent</span>
              </div>
            </div>
          </motion.div>

          {/* Machines Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cog className="w-16 h-16 text-purple-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Cog className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Machines</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {overview?.machines.total ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">Active Units</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/30 text-[11px] text-muted-foreground font-medium">
              <div>
                <span className="text-emerald-500 font-bold block">{overview?.machines.running ?? 0}</span>
                <span>Running</span>
              </div>
              <div>
                <span className="text-amber-500 font-bold block">{overview?.machines.idle ?? 0}</span>
                <span>Idle</span>
              </div>
              <div>
                <span className="text-rose-500 font-bold block">{overview?.machines.offline ?? 0}</span>
                <span>Offline</span>
              </div>
            </div>
          </motion.div>

          {/* Production Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all duration-200 col-span-1"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Production</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {overview ? Math.round((overview.production.completed / (overview.production.planned || 1)) * 100) : 0}%
              </span>
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            
            <div className="space-y-1.5 pt-2 border-t border-border/30">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${overview ? Math.min(100, Math.round((overview.production.completed / (overview.production.planned || 1)) * 100)) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>Completed: {overview?.production.completed ?? 0}</span>
                <span>Target: {overview?.production.planned ?? 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Bundles Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Layers className="w-16 h-16 text-cyan-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bundles</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {overview?.bundles.inProgress ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-2 border-t border-border/30 text-[11px] text-muted-foreground font-medium">
              <div>
                <span className="text-primary font-bold block">{overview?.bundles.created ?? 0}</span>
                <span>Created</span>
              </div>
              <div>
                <span className="text-emerald-500 font-bold block">{overview?.bundles.completed ?? 0}</span>
                <span>Completed</span>
              </div>
            </div>
          </motion.div>

          {/* QC Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-16 h-16 text-rose-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quality Check</span>
            </div>
            
            {(() => {
              const pass = overview?.qc.pass ?? 0;
              const reject = overview?.qc.reject ?? 0;
              const rework = overview?.qc.rework ?? 0;
              const totalQC = pass + reject + rework;
              const passRate = totalQC > 0 ? Math.round((pass / totalQC) * 100) : 100;
              
              return (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {passRate}%
                    </span>
                    <span className="text-sm text-muted-foreground">Pass Rate</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/30 text-[11px] text-muted-foreground font-medium">
                    <div>
                      <span className="text-emerald-500 font-bold block">{pass}</span>
                      <span>Pass</span>
                    </div>
                    <div>
                      <span className="text-amber-500 font-bold block">{rework}</span>
                      <span>Rework</span>
                    </div>
                    <div>
                      <span className="text-rose-500 font-bold block">{reject}</span>
                      <span>Reject</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Main Content Layout */}
      {dashboardView === "floor" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Live Shop Floor */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col max-h-[750px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Live Shop Floor Status</h2>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-auto">
                {/* View Switcher */}
                <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/10">
                  <button
                    onClick={() => setViewType("table")}
                    className={cn(
                      "p-1.5 rounded-md transition-all text-muted-foreground hover:text-foreground",
                      viewType === "table" && "bg-background text-primary shadow-xs"
                    )}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewType("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all text-muted-foreground hover:text-foreground",
                      viewType === "grid" && "bg-background text-primary shadow-xs"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Tabs/Filters */}
                <div className="flex flex-wrap items-center gap-1 bg-muted p-0.5 rounded-lg">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={cn(
                      "text-[11px] px-2 py-1 font-semibold rounded-md transition-all",
                      statusFilter === "ALL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({liveFloor.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("RUNNING")}
                    className={cn(
                      "text-[11px] px-2 py-1 font-semibold rounded-md transition-all flex items-center gap-1",
                      statusFilter === "RUNNING" ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Running ({activeMachinesCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("IDLE")}
                    className={cn(
                      "text-[11px] px-2 py-1 font-semibold rounded-md transition-all flex items-center gap-1",
                      statusFilter === "IDLE" ? "bg-background text-amber-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    Idle ({idleMachinesCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("OFFLINE")}
                    className={cn(
                      "text-[11px] px-2 py-1 font-semibold rounded-md transition-all flex items-center gap-1",
                      statusFilter === "OFFLINE" ? "bg-background text-rose-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-rose-500/40" />
                    Offline ({offlineMachinesCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-5 flex-shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search machine code, worker name, or operation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-border/60 focus-visible:ring-primary bg-background/50"
              />
            </div>

            {/* Scrollable Container with Fixed Max Height */}
            <div className="flex-1 overflow-y-auto max-h-[520px] pr-1.5 scrollbar-thin">
              {loadingFloor ? (
                viewType === "table" ? (
                  <div className="space-y-2.5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-muted/20 animate-pulse border border-border/20" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-36 rounded-xl bg-muted/20 animate-pulse border border-border/20" />
                    ))}
                  </div>
                )
              ) : filteredMachines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-xl bg-background/30 text-center">
                  <Cog className="w-10 h-10 text-muted-foreground/40 mb-3 animate-spin duration-10000" />
                  <span className="text-sm font-semibold text-muted-foreground">No matching machines found</span>
                  <span className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search keywords.</span>
                </div>
              ) : viewType === "table" ? (
                /* Dense, Compact Table View */
                <div className="border border-border/40 rounded-xl overflow-hidden bg-background/30 shadow-inner">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-muted/30 uppercase tracking-wider text-[10px]">
                        <th className="p-3">Machine</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Worker</th>
                        <th className="p-3">Operation</th>
                        <th className="p-3 font-mono">Bundle</th>
                        <th className="p-3">Shift</th>
                        <th className="p-3 text-right">Terminal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMachines.map((machine) => (
                        <tr 
                          key={machine.machineCode} 
                          className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3">
                            <span className="font-mono font-bold text-muted-foreground block text-[10px]">
                              {machine.machineCode}
                            </span>
                            <span className="font-bold text-foreground text-xs">
                              {machine.machineName}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge 
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm",
                                machine.machineStatus === "RUNNING" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10",
                                machine.machineStatus === "IDLE" && "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10",
                                machine.machineStatus === "OFFLINE" && "bg-muted text-muted-foreground border border-border/30 hover:bg-muted"
                              )}
                            >
                              {machine.machineStatus === "RUNNING" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block animate-pulse" />
                              )}
                              {machine.machineStatus}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {machine.workerName ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-muted border flex items-center justify-center flex-shrink-0 text-muted-foreground font-semibold text-[9px]">
                                  {machine.workerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-foreground truncate block leading-tight">{machine.workerName}</span>
                                  <span className="text-[10px] text-muted-foreground/80 leading-none">{machine.employeeCode}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{machine.operation || "-"}</span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className="font-semibold text-foreground">{machine.bundle || "-"}</span>
                          </td>
                          <td className="p-3 font-medium text-muted-foreground">
                            {machine.shift || "-"}
                          </td>
                          <td className="p-3 text-right">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 border border-border/30",
                                machine.terminalStatus === "ONLINE" ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/20" : "text-rose-500 bg-rose-500/5 border-rose-500/20"
                              )}
                            >
                              {machine.terminalStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Compact Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <AnimatePresence mode="popLayout">
                    {filteredMachines.map((machine) => (
                      <motion.div
                        key={machine.machineCode}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "rounded-xl border p-3.5 bg-background/40 hover:bg-background/80 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden group border-border/40",
                          machine.machineStatus === "RUNNING" && "hover:border-emerald-500/30",
                          machine.machineStatus === "IDLE" && "hover:border-amber-500/30",
                          machine.machineStatus === "OFFLINE" && "hover:border-rose-500/20"
                        )}
                      >
                        {/* Decorative edge line indicator */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1",
                          machine.machineStatus === "RUNNING" && "bg-emerald-500",
                          machine.machineStatus === "IDLE" && "bg-amber-500",
                          machine.machineStatus === "OFFLINE" && "bg-zinc-600"
                        )} />

                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-2 mb-3 flex-shrink-0">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                {machine.machineCode}
                              </span>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                machine.terminalStatus === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
                              )} />
                            </div>
                            <h3 className="font-bold text-sm text-foreground truncate max-w-[170px] mt-0.5">
                              {machine.machineName}
                            </h3>
                          </div>

                          <Badge 
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm",
                              machine.machineStatus === "RUNNING" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10",
                              machine.machineStatus === "IDLE" && "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10",
                              machine.machineStatus === "OFFLINE" && "bg-muted text-muted-foreground border border-border/30 hover:bg-muted"
                            )}
                          >
                            {machine.machineStatus === "RUNNING" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            )}
                            {machine.machineStatus}
                          </Badge>
                        </div>

                        {/* Card Content */}
                        <div className="space-y-2.5 text-xs mb-2.5">
                          {/* Worker */}
                          <div className="flex items-center gap-2">
                            <div className="w-5.5 h-5.5 rounded-full bg-muted border flex items-center justify-center flex-shrink-0 text-muted-foreground font-semibold text-[9px]">
                              {machine.workerName ? machine.workerName.charAt(0).toUpperCase() : "-"}
                            </div>
                            <div className="min-w-0">
                              {machine.workerName ? (
                                <>
                                  <p className="font-semibold text-foreground truncate leading-tight">{machine.workerName}</p>
                                  <p className="text-[10px] text-muted-foreground leading-none">{machine.employeeCode}</p>
                                </>
                              ) : (
                                <p className="text-muted-foreground italic">No Worker Assigned</p>
                              )}
                            </div>
                          </div>

                          {/* Task / Operation Info */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20 text-[11px] text-muted-foreground">
                            <div>
                              <span className="text-[10px] text-muted-foreground/60 block uppercase font-medium">Operation</span>
                              <span className="font-semibold text-foreground truncate block">
                                {machine.operation || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground/60 block uppercase font-medium">Active Bundle</span>
                              <span className="font-semibold text-foreground font-mono block">
                                {machine.bundle || "None"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 bg-muted/40 p-1.5 rounded-lg border border-border/20">
                          <span>Shift: <strong className="text-foreground">{machine.shift || "N/A"}</strong></span>
                          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[9px]">
                            <span className={cn(
                              "w-1 h-1 rounded-full",
                              machine.terminalStatus === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                            NFC Reader
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts and Clock Taps Feed */}
        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm flex flex-col h-[672px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-border/20 pb-3">
              <div className="flex bg-muted p-0.5 rounded-lg border border-border/10">
                <button
                  onClick={() => setActiveRightTab("alerts")}
                  className={cn(
                    "text-[11px] px-2 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5",
                    activeRightTab === "alerts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bell className="w-3 h-3 text-amber-500" />
                  Alerts
                </button>
                <button
                  onClick={() => setActiveRightTab("attendance")}
                  className={cn(
                    "text-[11px] px-2 py-1.5 font-semibold rounded-md transition-all flex items-center gap-1.5",
                    activeRightTab === "attendance" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Clock className="w-3 h-3 text-primary animate-pulse" />
                  Clock Taps
                </button>
              </div>

              {activeRightTab === "alerts" ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead} 
                  className="h-8 text-[10px] font-semibold text-primary hover:text-primary-foreground hover:bg-primary gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Clear All
                </Button>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live feed
                </span>
              )}
            </div>

            {/* Scrollable lists */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {activeRightTab === "alerts" ? (
                /* Alerts Tab View */
                notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground/60">
                    <CheckSquare className="w-10 h-10 mb-2 text-muted-foreground/30" />
                    <p className="text-xs font-semibold">All caught up!</p>
                    <p className="text-[10px]">No active system alerts at the moment.</p>
                  </div>
                ) : (
                  notifications.map((alert) => {
                    const config = typeConfig[alert.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "relative flex gap-3 p-3 rounded-xl bg-background/50 hover:bg-background transition-all border border-border/30 cursor-pointer overflow-hidden group",
                          !alert.isRead && "border-primary/20 bg-background/80 shadow-xs"
                        )}
                        onClick={() => markAsRead(alert.id)}
                      >
                        {/* Priority strip on top */}
                        <span className={cn("absolute right-2.5 top-2.5 w-1.5 h-1.5 rounded-full", priorityBar[alert.priority])} />

                        {/* Icon */}
                        <div className={cn("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold truncate leading-tight text-foreground/90 group-hover:text-primary transition-colors", !alert.isRead && "text-foreground font-extrabold")}>
                            {alert.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-1 line-clamp-2">
                            {alert.description}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRelativeTime(alert.timestamp)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!alert.isRead && (
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )
              ) : (
                /* Live Attendance Clock Taps View */
                loadingAttendance ? (
                  <div className="space-y-2.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-muted/20 animate-pulse border border-border/20" />
                    ))}
                  </div>
                ) : attendanceLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground/60">
                    <Clock className="w-10 h-10 mb-2 text-muted-foreground/30" />
                    <p className="text-xs font-semibold">No clock actions today</p>
                    <p className="text-[10px]">Taps registered on terminal NFC readers will list here.</p>
                  </div>
                ) : (
                  attendanceLogs.map((tap) => (
                    <motion.div
                      key={tap.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start justify-between p-3 rounded-xl bg-background/40 hover:bg-background border border-border/30 transition-all text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Status Icon */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]",
                          tap.attendanceType === "IN" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {tap.attendanceType}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate leading-tight">
                            {tap.worker ? `${tap.worker.firstName} ${tap.worker.lastName}` : "Unknown Worker"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                            {tap.worker?.employeeCode} • {tap.shift?.shiftName || "Shift"}
                          </p>
                          {tap.machine && (
                            <p className="text-[9px] text-primary/85 mt-1 font-semibold flex items-center gap-1 font-mono">
                              <span className="w-1 h-1 rounded-full bg-primary" />
                              {tap.machine.machineCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-1">
                        <span className="text-[9px] font-mono text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/20">
                          {new Date(tap.tapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

      </div>
      ) : (
        /* Admin Operations View - 4 Categories of Widgets */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* 1. Workforce & Efficiency Panel */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">Workforce & Efficiency</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Leaderboard Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Productivity Leaderboard (Top 5)</h3>
                </div>
                <div className="border border-border/40 rounded-lg overflow-hidden bg-background/30 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/40 font-semibold text-muted-foreground">
                        <th className="p-2.5">Rank</th>
                        <th className="p-2.5">Operator</th>
                        <th className="p-2.5 text-center">Bundles</th>
                        <th className="p-2.5 text-right">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(extendedData?.leaderboard || []).map((item, idx) => (
                        <tr key={item.employeeCode} className="border-b border-border/10 hover:bg-muted/10">
                          <td className="p-2.5 font-bold">
                            {idx === 0 && "🥇"}
                            {idx === 1 && "🥈"}
                            {idx === 2 && "🥉"}
                            {idx > 2 && `${idx + 1}`}
                          </td>
                          <td className="p-2.5 font-semibold text-foreground">{item.name}</td>
                          <td className="p-2.5 text-center font-mono font-semibold">{item.completed}</td>
                          <td className="p-2.5 text-right text-emerald-500 font-bold">{item.passRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Idle Time Alerts Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Idle Time Alerts (&gt;30m)</h3>
                </div>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.idleAlerts || []).map((alert) => (
                    <div 
                      key={alert.employeeCode}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between gap-3 text-xs bg-amber-500/5 border-amber-500/20",
                        alert.idleMinutes > 40 && "bg-red-500/5 border-red-500/20 text-red-100"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{alert.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{alert.employeeCode} • Last Active: {alert.lastActive}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={cn(
                          "px-2 py-0.5 font-semibold text-[10px] rounded-full",
                          alert.idleMinutes > 40 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {alert.idleMinutes}m idle
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Machinery & IoT Diagnostics Panel */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Cog className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">Live Machinery & IoT Layout</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Floor Layout Mini-Map Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout Mini-Map (Grid)</h3>
                </div>
                
                {(extendedData?.floorMiniMap?.rooms || []).map((room) => (
                  <div key={room.id} className="space-y-2 bg-background/25 border p-3 rounded-lg border-border/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{room.name}</p>
                    
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${room.machinesPerRow}, minmax(0, 1fr))` }}>
                      {room.machines.map((mac) => (
                        <button
                          key={mac.machineCode}
                          onClick={() => setSelectedMiniMapMachine(mac)}
                          className={cn(
                            "aspect-square rounded border transition-all cursor-pointer relative group",
                            mac.machineStatus === "RUNNING" && "bg-emerald-500 border-emerald-500/20 hover:scale-110",
                            mac.machineStatus === "IDLE" && "bg-amber-500 border-amber-500/20 hover:scale-110",
                            mac.machineStatus === "OFFLINE" && "bg-zinc-700 border-border/25 hover:scale-110",
                            selectedMiniMapMachine?.machineCode === mac.machineCode && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                          )}
                          title={`${mac.machineCode} - ${mac.machineStatus}`}
                        />
                      ))}
                    </div>

                    {selectedMiniMapMachine && (
                      <div className="mt-3.5 p-2 bg-muted/60 border border-border/20 rounded text-[10px] space-y-1">
                        <p className="font-bold text-foreground">
                          {selectedMiniMapMachine.machineCode} • {selectedMiniMapMachine.machineName}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          Status: 
                          <span className={cn(
                            "font-bold uppercase",
                            selectedMiniMapMachine.machineStatus === "RUNNING" && "text-emerald-500",
                            selectedMiniMapMachine.machineStatus === "IDLE" && "text-amber-500",
                            selectedMiniMapMachine.machineStatus === "OFFLINE" && "text-zinc-400"
                          )}>
                            {selectedMiniMapMachine.machineStatus}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* NFC Scanner Diagnostics Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scanner Diagnostics (IoT)</h3>
                </div>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.diagnostics || []).map((term) => (
                    <div key={term.terminalCode} className="border border-border/20 p-2.5 rounded-lg bg-background/25 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          <span>{term.terminalCode}</span>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            term.status === "ONLINE" ? "bg-emerald-500" : "bg-rose-500"
                          )} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{term.name} • {term.firmware}</p>
                      </div>

                      <div className="text-right">
                        {term.errorCount > 0 ? (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 shadow-sm font-semibold">
                            {term.errorCount} Errors
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">Active OK</span>
                        )}
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">Heartbeat: {term.lastHeartbeat}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Production Planning & ETA Estimator Panel */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">Production Schedule &amp; Shifts</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* ETA Estimator Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Target Estimator (Live ETA)</h3>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.etaEstimator || []).map((order) => (
                    <div key={order.orderNumber} className="border border-border/20 p-3 rounded-lg bg-background/25 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-foreground">{order.orderNumber} ({order.styleName})</span>
                        <span className="text-primary font-mono text-[10px] bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                          {order.speed}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Completed: {order.completed} / {order.planned}</span>
                        <span>Pending: {order.pending}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/10 text-[11px]">
                        <span className="text-muted-foreground font-medium">Estimated Time Remaining:</span>
                        <span className="text-emerald-500 font-extrabold">{order.etaString}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shift Comparison Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shift Performance (Outputs)</h3>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.shiftComparison || []).map((shift) => (
                    <div key={shift.shiftName} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-foreground">{shift.shiftName}</span>
                        <span className="text-muted-foreground">{shift.completedQuantity} Pcs Completed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((shift.completedQuantity / 1800) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 shrink-0">{shift.efficiency}% Eff</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Quality Control & Defect Analysis Panel */}
          <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">Quality Control &amp; Defects</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {/* Top Defect Reasons Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Defect Pareto Breakdown (Top 3)</h3>
                </div>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.topDefects || []).map((def) => (
                    <div key={def.reason} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-foreground">{def.reason}</span>
                        <span className="text-rose-500 font-bold">{def.percentage}%</span>
                      </div>
                      <div className="bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${def.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QC Quarantine Alerts Feed Widget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quarantine Alerts Feed (Fails &gt;= 2)</h3>
                </div>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {(extendedData?.quarantineAlerts || []).map((item) => (
                    <div 
                      key={item.bundleNumber} 
                      className="border border-red-500/20 bg-red-500/5 p-3 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-red-400 font-mono tracking-tight">{item.bundleNumber}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.operation} • Detected: {item.lastCheck}</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className="bg-red-500/25 text-red-500 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-red-500/30">
                          {item.fails} Failed Checks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </PageContainer>
  );
}
