export type TaskStatus =
  | "CREATED"
  | "PLANNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "RUNNING"
  | "COMPLETED"
  | "QC"
  | "TRANSFERRED"
  | "CLOSED";

export interface ProductionTask {
  id: number;
  taskId: string;
  productionOrderId: number;
  bundleId?: number;
  operationId: number;
  departmentId: number;
  machineId?: number;
  workerId?: number;
  shiftId?: number;
  priority: number;
  estimatedTime: number; // in minutes
  targetQuantity: number;
  status: TaskStatus;
  supervisor?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  productionOrder?: any;
  operation?: any;
  department?: any;
  machine?: any;
  worker?: any;
}

export interface PlanningDashboardMetrics {
  orders: { total: number; active: number; completed: number };
  bundles: { active: number; waiting: number };
  workers: { total: number; busy: number; available: number };
  machines: { total: number; busy: number; available: number };
  tasks: { pending: number };
}

export interface CreateTaskPayload {
  productionOrderId: number;
  bundleId?: number;
  operationId: number;
  departmentId: number;
  machineId?: number;
  workerId?: number;
  shiftId?: number;
  priority?: number;
  estimatedTime: number;
  targetQuantity: number;
  supervisor?: string;
  remarks?: string;
}

export interface UpdateTaskPayload {
  status?: TaskStatus;
  machineId?: number | null;
  workerId?: number | null;
  shiftId?: number | null;
  priority?: number;
  supervisor?: string | null;
  remarks?: string | null;
}

export interface PublishPlanPayload {
  productionOrderId: number;
  bundles: Array<{ quantity: number }>;
  assignments: Array<{
    operationId: number;
    workerId: number;
    machineId: number;
    shiftId?: number;
  }>;
}

export interface PlanningWorker {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
  grade: {
    id: number;
    name: string;
    priority: number;
  };
  skills: Array<{
    skill: {
      id: number;
      name: string;
    }
  }>;
  assignments: Array<any>;
}

export interface PlanningMachine {
  id: number;
  machineCode: string;
  machineName: string;
  departmentId?: number;
  department?: {
    id?: number;
    name?: string;
  };
  machineType?: {
    id?: number;
    name?: string;
  };
  assignments: Array<any>;
  roomId?: number | null;
  rowIndex?: number | null;
  positionIndex?: number | null;
  room?: {
    id: number;
    name: string;
  } | null;
}

export interface PlanningResources {
  workers: PlanningWorker[];
  machines: PlanningMachine[];
}
