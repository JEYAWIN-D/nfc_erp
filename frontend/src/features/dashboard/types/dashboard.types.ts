export interface WorkersSummary {
  total: number;
  present: number;
  absent: number;
  active?: number;
  idle?: number;
}

export interface MachinesSummary {
  total: number;
  running: number;
  idle: number;
  offline: number;
}

export interface ProductionSummary {
  planned: number;
  completed: number;
  pending: number;
  efficiency: number;
}

export interface BundlesSummary {
  created: number;
  inProgress: number;
  completed: number;
}

export interface QCSummary {
  pass: number;
  reject: number;
  rework: number;
}

export interface DashboardOverviewResponse {
  workers: WorkersSummary;
  machines: MachinesSummary;
  production: ProductionSummary;
  bundles: BundlesSummary;
  qc: QCSummary;
}

export interface LiveMachineCard {
  machineCode: string;
  machineName: string;
  workerName: string | null;
  employeeCode: string | null;
  operation: string | null;
  shift: string | null;
  bundle: string | null;
  terminalStatus: "ONLINE" | "OFFLINE";
  attendance: "IN" | "OUT" | null;
  machineStatus: "RUNNING" | "IDLE" | "OFFLINE";
}

export interface AttendanceTapRecord {
  id: number;
  workerId: number;
  tapTime: string;
  attendanceType: "IN" | "OUT";
  worker: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  shift: {
    id: number;
    shiftName: string;
  } | null;
  machine: {
    id: number;
    machineCode: string;
    machineName: string;
  } | null;
}

export interface LeaderboardItem {
  name: string;
  employeeCode: string;
  completed: number;
  passRate: number;
}

export interface IdleAlertItem {
  name: string;
  employeeCode: string;
  idleMinutes: number;
  lastActive: string;
}

export interface DiagnosticItem {
  terminalCode: string;
  name: string;
  status: "ONLINE" | "OFFLINE";
  lastHeartbeat: string;
  firmware: string;
  errorCount: number;
}

export interface LayoutMachineItem {
  machineCode: string;
  machineName: string;
  row: number;
  position: number;
  machineStatus: "RUNNING" | "IDLE" | "OFFLINE";
}

export interface RoomLayoutItem {
  id: number;
  name: string;
  rowsCount: number;
  machinesPerRow: number;
  machines: LayoutMachineItem[];
}

export interface ETAEstimatorItem {
  orderNumber: string;
  styleName: string;
  planned: number;
  completed: number;
  pending: number;
  speed: string;
  etaString: string;
}

export interface ShiftComparisonItem {
  shiftName: string;
  completedQuantity: number;
  efficiency: number;
}

export interface DefectItem {
  reason: string;
  percentage: number;
}

export interface QuarantineAlertItem {
  bundleNumber: string;
  fails: number;
  operation: string;
  lastCheck: string;
}

export interface DashboardExtendedResponse {
  leaderboard: LeaderboardItem[];
  idleAlerts: IdleAlertItem[];
  diagnostics: DiagnosticItem[];
  floorMiniMap: {
    rooms: RoomLayoutItem[];
  };
  etaEstimator: ETAEstimatorItem[];
  shiftComparison: ShiftComparisonItem[];
  topDefects: DefectItem[];
  quarantineAlerts: QuarantineAlertItem[];
}
