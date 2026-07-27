import { z } from "zod";

export type BundleStatus = "in_progress" | "completed" | "rejected" | "delayed" | "on_hold" | "rework";
export type BundlePriority = "low" | "medium" | "high" | "urgent";

export interface Bundle {
  id: string;
  bundleNumber: string;
  productionOrder: string;
  orderNumber?: string;
  customerName?: string;
  styleNumber?: string;
  operation: string;
  department: string;
  
  targetPieces: number;
  completedPieces: number;
  defectivePieces: number;

  currentWorker?: string;
  currentMachine?: string;
  
  priority: BundlePriority;
  status: BundleStatus;
  
  startedTime?: string;
  completedTime?: string;
  remarks?: string;
  
  qcResult?: "Pass" | "Fail" | "Pending";
  
  timeline: {
    id: string;
    timestamp: string;
    action: string;
    user: string;
  }[];
  
  // Simulator helpers
  activeTagCode?: string;
  activeTerminalCode?: string;
  activeWorkerCardId?: string;
}

export const bundleSchema = z.object({
  productionOrder: z.string().min(1, "Production Order is required"),
  operation: z.string().min(1, "Operation is required"),
  targetPieces: z.number().min(1, "Must have at least 1 piece"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  remarks: z.string().optional(),
});

export type BundleFormValues = z.infer<typeof bundleSchema>;

// --- API Types ---

export interface BundleAPI {
  id: number;
  bundleNumber: string;
  productionOrderId: number;
  currentOperationId: number | null;
  currentMachineId: number | null;
  currentWorkerId: number | null;
  quantity: number;
  completedQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  productionOrder?: {
    id: number;
    orderNumber: string;
    buyerName: string;
    styleNumber: string;
    styleName: string;
  };
  
  // Relations
  currentMachine?: { id: number; machineName: string; machineCode: string; department?: { name: string } };
  currentOperation?: { id: number; name: string };
  currentWorker?: { id: number; firstName: string; lastName: string; employeeCode: string; nfcCardId: string; department?: { name: string } };
  
  stageLogs?: {
    id: number;
    inTime: string;
    outTime: string | null;
    operationId: number;
  }[];
  
  tagAssignments?: {
    tagCode: string;
    status: string;
  }[];
}

export interface BundleQueryParams {
  search?: string;
  status?: string;
  productionOrderId?: number;
  page?: number;
  limit?: number;
}

export interface BundlesResponse {
  success: boolean;
  data: BundleAPI[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateBundleRequest {
  productionOrderId: number;
  quantity: number;
  status?: string;
}

export type UpdateBundleRequest = Partial<CreateBundleRequest> & {
  currentOperationId?: number;
  currentMachineId?: number;
  currentWorkerId?: number;
  completedQuantity?: number;
};
