import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type MachineStatus =
  | "running"
  | "idle"
  | "offline"
  | "maintenance"
  | "error";

export type MachineHealth = "healthy" | "warning" | "critical" | "unknown";

export type MachineType =
  | "Single Needle"
  | "Double Needle"
  | "Overlock"
  | "Flatlock"
  | "Interlock"
  | "Bar Tack"
  | "Button Hole"
  | "Feed Off Arm"
  | "Embroidery"
  | "Cutting";

// ─── Sub-Types ────────────────────────────────────────────────────────────────

export interface MachineAssignment {
  workerId: string;
  workerName: string;
  operation: string;
  project?: string;
  productionOrder?: string;
  department?: string;
  assignedAt: string;
  shift: string;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceState?: 'present' | 'checked_out' | 'assigned_not_present';
}

export interface MachineBundle {
  bundleId: string;
  productionOrderId: string;
  style: string;
  qty: number;
  completed: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: "preventive" | "corrective" | "emergency";
  technician: string;
  description: string;
  durationHours: number;
  cost: number;
  status: "completed" | "in_progress" | "scheduled";
}

export interface ProductionRecord {
  date: string;
  target: number;
  completed: number;
  efficiency: number;
  operation: string;
}

export interface MachineTimelineEvent {
  id: string;
  timestamp: string;
  type:
    | "status_change"
    | "assignment"
    | "maintenance"
    | "production"
    | "heartbeat"
    | "alert";
  title: string;
  description: string;
  severity?: "info" | "warning" | "critical";
}

// ─── Core Machine Data ────────────────────────────────────────────────────────

export interface MachineData {
  id: string;
  machineId: string;
  name: string;
  department: string;
  type: MachineType;
  building: string;
  floor: string;
  room: string;
  productionLine: string;
  status: MachineStatus;
  health: MachineHealth;
  healthScore: number;
  terminalId?: string;
  terminalName?: string;

  // Live Metrics
  runningHours: number;
  temperature: number;
  powerConsumption: number;
  lastHeartbeat: string;

  // Assignments
  currentAssignment?: MachineAssignment;
  currentBundle?: MachineBundle;

  // Production
  todayTarget: number;
  todayCompleted: number;
  efficiency: number;
  currentOperation?: string;

  // Metadata
  purchaseDate: string;
  imageUrl?: string;
  notes?: string;

  // Related Records
  maintenanceHistory: MaintenanceRecord[];
  productionHistory: ProductionRecord[];
  timeline: MachineTimelineEvent[];
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface MachineStats {
  total: number;
  running: number;
  idle: number;
  offline: number;
  maintenance: number;
  assigned: number;
  unassigned: number;
  healthy: number;
}

// ─── Form Zod Schema ──────────────────────────────────────────────────────────

export const machineFormSchema = z.object({
  machineId: z
    .string()
    .min(3, "Machine ID must be at least 3 characters")
    .max(20),
  name: z.string().min(2, "Machine name is required"),
  department: z.string().min(1, "Department is required"),
  type: z.enum([
    "Single Needle",
    "Double Needle",
    "Overlock",
    "Flatlock",
    "Interlock",
    "Bar Tack",
    "Button Hole",
    "Feed Off Arm",
    "Embroidery",
    "Cutting",
  ]),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  productionLine: z.string().optional(),
  terminalId: z.string().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  status: z
    .enum(["running", "idle", "offline", "maintenance", "error"])
    .default("idle"),
  notes: z.string().optional(),
});

export type MachineFormData = z.infer<typeof machineFormSchema>;
