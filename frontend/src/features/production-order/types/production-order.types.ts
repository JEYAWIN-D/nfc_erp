import { z } from "zod";

export type OrderStatus = "draft" | "planned" | "ready_for_production" | "running" | "in_progress" | "qc" | "paused" | "completed" | "delayed" | "closed";
export type OrderPriority = "low" | "medium" | "high" | "urgent";

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  styleNumber: string;
  color: string;
  size: string;
  
  targetQuantity: number;
  completedQuantity: number;
  defectiveQuantity: number;
  
  department: string;
  priority: OrderPriority;
  status: OrderStatus;
  
  startDate: string;
  dueDate: string;
  remarks?: string;
  
  // Richer data for drawer
  timeline: {
    id: string;
    timestamp: string;
    action: string;
    user: string;
  }[];
  allocations: {
    workersCount: number;
    machinesCount: number;
    bundlesCount: number;
    workersList?: { id: number, name: string, code: string }[];
    machinesList?: { id: number, name: string, code: string }[];
  };
}

export const productionOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  styleNumber: z.string().min(1, "Style number is required"),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  targetQuantity: z.number().min(1, "Quantity must be at least 1"),
  department: z.string().min(1, "Department is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.date(),
  remarks: z.string().optional(),
});

export type ProductionOrderFormValues = z.infer<typeof productionOrderSchema>;
