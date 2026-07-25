import { useState, useEffect } from "react";
import {
  Cpu,
  HeartPulse,
  Wrench,
  Users,
  BarChart2,
  Clock,
  Thermometer,
  Zap,
  Timer,
  Package,
  CheckCircle2,
  AlertTriangle,
  Activity,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { useMachineStore } from "../store/machine.store";
import { useMachine } from "../hooks/useMachine";
import { StatusBadge, HealthBadge, MachineAvatar } from "./MachineUIHelpers";
import type { MachineTimelineEvent } from "../types/machine.types";
import { DetailsDrawer } from "@/shared/components/ui/DetailsDrawer";
import { Loader2 } from "lucide-react";
import api from "@/services/axios";
import { useQueryClient } from "@tanstack/react-query";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-muted/10 border border-border/40 p-3 rounded-lg">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold text-foreground",
          mono && "font-mono"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/40">
      <div className={cn("p-2 rounded-lg bg-background", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground leading-tight">
          {value}
          {unit && (
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function TimelineIcon({ type }: { type: MachineTimelineEvent["type"] }) {
  const map: Record<MachineTimelineEvent["type"], { Icon: LucideIcon; color: string }> = {
    status_change: { Icon: Activity, color: "text-blue-500 bg-blue-500/10" },
    assignment: { Icon: Users, color: "text-purple-500 bg-purple-500/10" },
    maintenance: { Icon: Wrench, color: "text-orange-500 bg-orange-500/10" },
    production: { Icon: Package, color: "text-emerald-500 bg-emerald-500/10" },
    heartbeat: { Icon: HeartPulse, color: "text-cyan-500 bg-cyan-500/10" },
    alert: { Icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10" },
  };
  const { Icon, color } = map[type] ?? map.heartbeat;
  return (
    <div
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
        color
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

// ─── IoT Demo Panel ─────────────────────────────────────────────────────────────
function IotDemoPanel({ machineId }: { machineId: string }) {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");
  const queryClient = useQueryClient();

  const handleSimulate = async () => {
    setLoading(true);
    setLog("Simulating IoT scan for this machine...");
    try {
      const { data: scanRes } = await api.post(`/iot/demo-scan/${machineId}`);

      if (!scanRes.success) throw new Error(scanRes.error || "Scan failed");

      const scanData = scanRes.data;
      setLog(
        `Success! Action: ${scanData.action}\n${scanData.message}\n\n` +
        `Bundle: ${scanData.bundle}\nOperation: ${scanData.operation}\nWorker: ${scanData.worker}`
      );

      // Trigger factory layout UI to refresh immediately
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    } catch (err: any) {
      setLog(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-500" /> Demo IoT Scanner
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This panel simulates a real NFC scan on the factory floor. It will fetch an available bundle tag, find the assigned worker's ID card, and simulate a terminal scan.
        </p>
        <button 
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
          {loading ? "Simulating..." : "Simulate ID / Bundle Scan"}
        </button>

        {log && (
          <div className="mt-6 bg-black/40 border border-border/40 p-4 rounded-xl font-mono text-xs text-emerald-400 whitespace-pre-wrap">
            {log}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: Cpu },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "assignments", label: "Assignments", icon: Users },
  { id: "production", label: "Production", icon: BarChart2 },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "iot-demo", label: "IoT Demo", icon: Zap },
];

export function MachineDetailsDrawer() {
  const store = useMachineStore();
  const { data: machine, isLoading } = useMachine(store.selectedMachineId);
  const [hideIotDemo, setHideIotDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHideIotDemo(localStorage.getItem("hideIotDemo") === "true");
    }
  }, []);

  const activeTabs = TABS.filter(t => !hideIotDemo || t.id !== "iot-demo");

  if (!store.isDrawerOpen) return null;

  if (isLoading || !machine) {
    return (
      <DetailsDrawer
        isOpen={store.isDrawerOpen}
        onClose={() => store.setDrawerOpen(false)}
        title={
          <div className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading details...</span>
          </div>
        }
      >
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DetailsDrawer>
    );
  }

  return (
    <DetailsDrawer
      isOpen={store.isDrawerOpen}
      onClose={() => store.setDrawerOpen(false)}
      title={
        <div className="flex items-center gap-4">
          <MachineAvatar
            machineId={machine.machineId}
            type={machine.type}
          />
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {machine.name}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              {machine.machineId} · {machine.department}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={machine.status} />
              <HealthBadge
                health={machine.health}
                score={machine.healthScore}
              />
            </div>
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="border-b border-border/40 flex-shrink-0 px-4 bg-muted/20">
        <div className="flex overflow-x-auto hide-scrollbar gap-1">
          {activeTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => store.setDrawerTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap",
                store.drawerTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* ── OVERVIEW TAB ─────────────────────────────────── */}
        {store.drawerTab === "overview" && (
          <div className="space-y-6">
            {/* Identity */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Identity
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Machine ID" value={machine.machineId} mono />
                <InfoField label="Machine Name" value={machine.name} />
                <InfoField label="Department" value={machine.department} />
                <InfoField label="Type" value={machine.type} />
                <InfoField
                  label="Terminal"
                  value={machine.terminalName ?? "Not Assigned"}
                />
                <InfoField
                  label="Worker"
                  value={
                    machine.currentAssignment?.workerName ?? "Unassigned"
                  }
                />
                <InfoField
                  label="Work Start Time (Check-IN)"
                  value={
                    machine.currentAssignment?.checkInTime 
                      ? new Date(machine.currentAssignment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                      : "Not Checked IN"
                  }
                  mono
                />
                <InfoField
                  label="Work End Time (Check-OUT)"
                  value={
                    machine.currentAssignment?.checkOutTime 
                      ? new Date(machine.currentAssignment.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                      : "Not Checked OUT"
                  }
                  mono
                />
                <InfoField
                  label="Shift"
                  value={
                    machine.currentAssignment?.shift ?? "N/A"
                  }
                />
              </div>
            </section>

            {/* Location */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Location
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Building" value={machine.building} />
                <InfoField label="Floor" value={machine.floor} />
                <InfoField label="Room" value={machine.room} />
                <InfoField label="Production Line" value={machine.productionLine} />
              </div>
            </section>

            {/* Live Metrics */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Live Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Running Hours"
                  value={machine.runningHours.toLocaleString()}
                  unit="hrs"
                  icon={Timer}
                  color="text-blue-500"
                />
                <MetricCard
                  label="Temperature"
                  value={`${machine.temperature}°C`}
                  icon={Thermometer}
                  color={
                    machine.temperature > 55
                      ? "text-rose-500"
                      : "text-amber-500"
                  }
                />
                <MetricCard
                  label="Power"
                  value={machine.powerConsumption}
                  unit="W"
                  icon={Zap}
                  color="text-yellow-500"
                />
                <MetricCard
                  label="Heartbeat"
                  value={(() => {
                    const d = Math.floor(
                      (Date.now() -
                        new Date(machine.lastHeartbeat).getTime()) /
                        60000
                    );
                    return d < 2 ? "Live" : `${d}m ago`;
                  })()}
                  icon={HeartPulse}
                  color="text-emerald-500"
                />
              </div>
            </section>

            {/* Production Today */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Production Today
              </h3>
              <div className="p-4 border border-border/40 rounded-xl bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      Operation:{" "}
                      <span className="text-foreground">
                        {machine.currentAssignment?.operation ?? machine.currentOperation ?? "—"}
                      </span>
                    </span>
                    {machine.currentAssignment?.project && (
                      <span className="text-sm text-muted-foreground">
                        Project:{" "}
                        <span className="text-foreground">
                          {machine.currentAssignment.project} ({machine.currentAssignment.productionOrder})
                        </span>
                      </span>
                    )}
                    {machine.currentAssignment?.department && (
                      <span className="text-sm text-muted-foreground">
                        Department:{" "}
                        <span className="text-foreground">
                          {machine.currentAssignment.department}
                        </span>
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold",
                      machine.efficiency >= 80
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : machine.efficiency >= 60
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}
                  >
                    {machine.efficiency}% Efficiency
                  </Badge>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      machine.efficiency >= 80
                        ? "bg-emerald-500"
                        : machine.efficiency >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    )}
                    style={{ width: `${machine.efficiency}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completed: {machine.todayCompleted}</span>
                  <span>Target: {machine.todayTarget}</span>
                </div>
                {machine.currentBundle && (
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Bundle</p>
                      <p className="text-sm font-mono text-foreground">
                        {machine.currentBundle.bundleId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground text-right">Style</p>
                      <p className="text-sm text-foreground">
                        {machine.currentBundle.style}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground text-right">Qty</p>
                      <p className="text-sm font-bold text-foreground">
                        {machine.currentBundle.completed} /{" "}
                        {machine.currentBundle.qty}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Notes */}
            {machine.notes && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Notes
                </h3>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-sm text-foreground">
                  {machine.notes}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── HEALTH TAB ───────────────────────────────────── */}
        {store.drawerTab === "health" && (
          <div className="space-y-6">
            {/* Score Gauge */}
            <div className="flex items-center justify-center p-8 bg-muted/10 rounded-2xl border border-border/40">
              <div className="text-center">
                <div
                  className={cn(
                    "text-7xl font-black mb-2",
                    machine.healthScore >= 80
                      ? "text-emerald-500"
                      : machine.healthScore >= 50
                        ? "text-amber-500"
                        : "text-rose-500"
                  )}
                >
                  {machine.healthScore}
                </div>
                <div className="text-muted-foreground text-sm">Health Score</div>
                <div className="mt-3">
                  <HealthBadge
                    health={machine.health}
                    score={machine.healthScore}
                  />
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Temperature"
                value={`${machine.temperature}°C`}
                icon={Thermometer}
                color={
                  machine.temperature > 55
                    ? "text-rose-500"
                    : "text-amber-500"
                }
              />
              <MetricCard
                label="Power Draw"
                value={machine.powerConsumption}
                unit="W"
                icon={Zap}
                color="text-yellow-500"
              />
              <MetricCard
                label="Running Hours"
                value={machine.runningHours.toLocaleString()}
                unit="hrs"
                icon={Timer}
                color="text-blue-500"
              />
              <MetricCard
                label="Today Efficiency"
                value={`${machine.efficiency}%`}
                icon={Activity}
                color="text-cyan-500"
              />
            </div>

            {/* Health Indicators */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Health Indicators
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: "Temperature",
                    ok: machine.temperature <= 55,
                    value: `${machine.temperature}°C`,
                  },
                  {
                    label: "Power Consumption",
                    ok: machine.powerConsumption <= 900,
                    value: `${machine.powerConsumption}W`,
                  },
                  {
                    label: "Heartbeat Signal",
                    ok:
                      Date.now() -
                        new Date(machine.lastHeartbeat).getTime() <
                      300000,
                    value: "Signal OK",
                  },
                  {
                    label: "Running Hours (Overuse risk)",
                    ok: machine.runningHours < 4000,
                    value: `${machine.runningHours.toLocaleString()} hrs`,
                  },
                ].map((ind) => (
                  <div
                    key={ind.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/40"
                  >
                    <div className="flex items-center gap-2">
                      {ind.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground">
                        {ind.label}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        ind.ok ? "text-emerald-500" : "text-amber-500"
                      )}
                    >
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── MAINTENANCE TAB ──────────────────────────────── */}
        {store.drawerTab === "maintenance" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Maintenance History
              </h3>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                + Schedule
              </button>
            </div>
            {machine.maintenanceHistory.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        rec.type === "emergency"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : rec.type === "corrective"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}
                    >
                      {rec.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        rec.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : rec.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}
                    >
                      {rec.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(rec.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{rec.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Technician: {rec.technician}</span>
                  <span>{rec.durationHours}h</span>
                  <span>₹{rec.cost.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB ──────────────────────────────── */}
        {store.drawerTab === "assignments" && (
          <div className="space-y-5">
            {machine.currentAssignment ? (
              <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Current Assignment
                  </h3>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none">
                    Active
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField
                    label="Worker"
                    value={machine.currentAssignment.workerName}
                  />
                  <InfoField
                    label="Worker ID"
                    value={machine.currentAssignment.workerId}
                    mono
                  />
                  <InfoField
                    label="Operation"
                    value={machine.currentAssignment.operation}
                  />
                  <InfoField
                    label="Shift"
                    value={machine.currentAssignment.shift}
                  />
                  <InfoField
                    label="Assigned At"
                    value={new Date(
                      machine.currentAssignment.assignedAt
                    ).toLocaleString()}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No worker assigned</p>
                <button className="mt-4 px-4 py-2 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors">
                  Assign Worker
                </button>
              </div>
            )}

            {/* Bundle */}
            {machine.currentBundle && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Current Bundle
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField
                    label="Bundle ID"
                    value={machine.currentBundle.bundleId}
                    mono
                  />
                  <InfoField
                    label="Order ID"
                    value={machine.currentBundle.productionOrderId}
                    mono
                  />
                  <InfoField
                    label="Style"
                    value={machine.currentBundle.style}
                  />
                  <InfoField
                    label="Progress"
                    value={`${machine.currentBundle.completed} / ${machine.currentBundle.qty} pcs`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTION TAB ───────────────────────────────── */}
        {store.drawerTab === "production" && (
          <div className="space-y-5">
            {/* Today Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className="text-2xl font-black text-cyan-500">
                  {machine.todayCompleted}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  Completed
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p className="text-2xl font-black text-foreground">
                  {machine.todayTarget}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  Target
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/10 border border-border/40 text-center">
                <p
                  className={cn(
                    "text-2xl font-black",
                    machine.efficiency >= 80
                      ? "text-emerald-500"
                      : machine.efficiency >= 60
                        ? "text-amber-500"
                        : "text-rose-500"
                  )}
                >
                  {machine.efficiency}%
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  Efficiency
                </p>
              </div>
            </div>

            {/* 7-day History */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                7-Day Production History
              </h3>
              <div className="space-y-2">
                {machine.productionHistory.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/40"
                  >
                    <div className="w-24 text-xs text-muted-foreground flex-shrink-0">
                      {new Date(rec.date).toLocaleDateString("en", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            rec.efficiency >= 80
                              ? "bg-emerald-500"
                              : rec.efficiency >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          )}
                          style={{ width: `${rec.efficiency}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-20 text-right">
                      {rec.completed}/{rec.target}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-bold w-12 text-right",
                        rec.efficiency >= 80
                          ? "text-emerald-500"
                          : rec.efficiency >= 60
                            ? "text-amber-500"
                            : "text-rose-500"
                      )}
                    >
                      {rec.efficiency}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ─────────────────────────────────── */}
        {store.drawerTab === "timeline" && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Machine Timeline
            </h3>
            <div className="relative pl-4">
              <div className="absolute left-7 top-0 bottom-0 w-px bg-border/40" />
              <div className="space-y-4">
                {machine.timeline.map((evt) => (
                  <div key={evt.id} className="flex gap-4 items-start">
                    <TimelineIcon type={evt.type} />
                    <div className="flex-1 pb-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {evt.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(evt.timestamp).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {evt.description}
                      </p>
                      {evt.severity && evt.severity !== "info" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1.5 text-[9px]",
                            evt.severity === "critical"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}
                        >
                          {evt.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── IOT DEMO TAB ─────────────────────────────────── */}
        {store.drawerTab === "iot-demo" && !hideIotDemo && (
          <div className="space-y-4">
             <div className="flex justify-end">
                <button 
                  onClick={() => {
                     localStorage.setItem("hideIotDemo", "true");
                     setHideIotDemo(true);
                     store.setDrawerTab("overview");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20 transition-colors"
                >
                  Remove IoT Demo Option
                </button>
             </div>
             <IotDemoPanel machineId={machine.id} />
          </div>
        )}
      </div>
    </DetailsDrawer>
  );
}
