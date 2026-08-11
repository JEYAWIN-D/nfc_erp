// ─── Factory Floor Type Definitions v2 ──────────────────────────────────────
// Hierarchy: Factory → Building → Floor → Room → Line → Machine → Worker
// All entities carry 3D-ready position fields for future React Three Fiber upgrade.

// ─── Primitive Status Types ───────────────────────────────────────────────────

export type MachineStatus = 'running' | 'idle' | 'offline' | 'maintenance' | 'no_worker';
export type WorkerGrade = 'A' | 'B' | 'C' | 'D';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';
export type PowerStatus = 'on' | 'off' | 'standby';
export type NetworkStatus = 'online' | 'offline' | 'weak';
export type RoomType = 'stitching' | 'finishing' | 'embroidery' | 'qc' | 'packing' | 'cutting';

// ─── Status Metadata Maps ─────────────────────────────────────────────────────

export const MACHINE_STATUS_META: Record<
  MachineStatus,
  { label: string; color: string; bg: string; border: string; glow: string; dot: string }
> = {
  running: {
    label: 'Running',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/50',
    glow: 'shadow-[0_0_14px_3px_rgba(16,185,129,0.28)]',
    dot: 'bg-emerald-400',
  },
  idle: {
    label: 'Idle',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    glow: 'shadow-[0_0_12px_2px_rgba(245,158,11,0.22)]',
    dot: 'bg-amber-400',
  },
  offline: {
    label: 'Offline',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_12px_2px_rgba(239,68,68,0.22)]',
    dot: 'bg-red-500',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/50',
    glow: 'shadow-[0_0_12px_2px_rgba(139,92,246,0.22)]',
    dot: 'bg-violet-400',
  },
  no_worker: {
    label: 'No Worker',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-600/40',
    glow: '',
    dot: 'bg-zinc-500',
  },
};

export const ROOM_TYPE_META: Record<
  RoomType,
  { label: string; borderAccent: string; headerBg: string; dotColor: string; iconColor: string }
> = {
  stitching: {
    label: 'Stitching',
    borderAccent: 'border-l-cyan-500',
    headerBg: 'bg-cyan-500/[0.06]',
    dotColor: 'bg-cyan-500',
    iconColor: 'text-cyan-400',
  },
  finishing: {
    label: 'Finishing',
    borderAccent: 'border-l-amber-500',
    headerBg: 'bg-amber-500/[0.06]',
    dotColor: 'bg-amber-500',
    iconColor: 'text-amber-400',
  },
  embroidery: {
    label: 'Embroidery',
    borderAccent: 'border-l-violet-500',
    headerBg: 'bg-violet-500/[0.06]',
    dotColor: 'bg-violet-500',
    iconColor: 'text-violet-400',
  },
  qc: {
    label: 'QC',
    borderAccent: 'border-l-emerald-500',
    headerBg: 'bg-emerald-500/[0.06]',
    dotColor: 'bg-emerald-500',
    iconColor: 'text-emerald-400',
  },
  packing: {
    label: 'Packing',
    borderAccent: 'border-l-blue-500',
    headerBg: 'bg-blue-500/[0.06]',
    dotColor: 'bg-blue-500',
    iconColor: 'text-blue-400',
  },
  cutting: {
    label: 'Cutting',
    borderAccent: 'border-l-orange-500',
    headerBg: 'bg-orange-500/[0.06]',
    dotColor: 'bg-orange-500',
    iconColor: 'text-orange-400',
  },
};

export const GRADE_META: Record<WorkerGrade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Grade A', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  B: { label: 'Grade B', color: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
  C: { label: 'Grade C', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  D: { label: 'Grade D', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30' },
};

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; color: string; dot: string }> = {
  present: { label: 'Present', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  late: { label: 'Late', color: 'text-amber-400', dot: 'bg-amber-400' },
  absent: { label: 'Absent', color: 'text-red-400', dot: 'bg-red-400' },
  half_day: { label: 'Half Day', color: 'text-orange-400', dot: 'bg-orange-400' },
};

// ─── Worker ───────────────────────────────────────────────────────────────────

export interface Worker {
  id: string;
  name: string;
  photo?: string;
  role: string;
  department: string;
  employeeId: string;
  shiftId: string;
  // v2
  grade: WorkerGrade;
  attendanceToday: AttendanceStatus;
  checkInTime: string; // ISO
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

export interface Bundle {
  id: string;
  bundleNumber: string;
  styleCode: string;
  totalPieces: number;
  completedPieces: number;
  progress: number; // 0–100
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface Assignment {
  id: string;
  workerId: string;
  machineId: string;
  operationId: string;
  operationName: string;
  bundleId: string;
  startedAt: string; // ISO
  targetPieces: number;
  completedPieces: number;
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  type: 'start' | 'bundle' | 'maintenance' | 'idle' | 'offline' | 'info';
}

// ─── Machine v2 ───────────────────────────────────────────────────────────────

export interface Machine {
  id: string;
  machineNumber: string;
  machineType: string;
  status: MachineStatus;
  department: string;
  worker: Worker | null;
  assignment: Assignment | null;
  bundle: Bundle | null;
  healthScore: number;         // 0–100
  uptimePercent: number;       // 0–100
  efficiency: number;          // 0–100  (v2)
  lastMaintenance: string;     // date string
  nextMaintenanceDate: string; // date string (v2)
  temperatureC: number | null; // IoT-ready, null when unavailable (v2)
  powerStatus: PowerStatus;    // (v2)
  networkStatus: NetworkStatus;// (v2)
  todayTimeline: TimelineEvent[];
  roomId?: number;
  rowIndex?: number;
  position: { row: 'top' | 'bottom'; index: number; x?: number; y?: number; z?: number };
}

// ─── Production Line ──────────────────────────────────────────────────────────

export interface ProductionLine {
  id: string;
  lineNumber: number;
  lineName: string;
  machines: Machine[];
  position?: { x?: number; y?: number; z?: number };
}

// ─── Room v2 ─────────────────────────────────────────────────────────────────

export interface FactoryRoom {
  id: string;
  name: string;
  description?: string;
  roomType: RoomType;
  lines: ProductionLine[];
  position?: { x?: number; y?: number; z?: number };
}

// ─── Floor ───────────────────────────────────────────────────────────────────

export interface FactoryFloorLevel {
  id: string;
  floorNumber: number;
  name: string;
  rooms: FactoryRoom[];
}

// ─── Building ────────────────────────────────────────────────────────────────

export interface FactoryBuilding {
  id: string;
  name: string;
  description?: string;
  floors: FactoryFloorLevel[];
  position?: { x?: number; y?: number; z?: number };
}

// ─── Factory Config v2 ───────────────────────────────────────────────────────

export interface FactoryConfig {
  id: string;
  name: string;
  location: string;
  buildings: FactoryBuilding[]; // replaces flat rooms[]
  lastUpdated: string;
}

// ─── Machine Context (for Smart Inspector) ───────────────────────────────────

export interface MachineContext {
  machine: Machine;
  line: ProductionLine;
  room: FactoryRoom;
  floor: FactoryFloorLevel;
  building: FactoryBuilding;
}

// ─── Computed Stats ───────────────────────────────────────────────────────────

export interface FactoryStats {
  totalMachines: number;
  byStatus: Record<MachineStatus, number>;
  activeWorkers: number;
  totalBuildings: number;
  totalFloors: number;
  totalRooms: number;
  totalLines: number;
  productionToday: number;
  activeBundles: number;
  qcPassRate: number;
  alertsCount: number;
  absentWorkers: number;
}
