import { z } from "zod";

export const createBundleSchema = z.object({
  bundleNumber: z.string().min(1, "Bundle number is required"),
  productionOrderId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const updateBundleSchema = z.object({
  currentOperationId: z.number().int().positive().optional().nullable(),
  currentMachineId: z.number().int().positive().optional().nullable(),
  currentWorkerId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive().optional(),
});

export const updateBundleStatusSchema = z.object({
  status: z.enum(["CREATED", "IN_PROGRESS", "WAITING", "COMPLETED", "QC_COMPLETED", "REWORK", "HOLD"]),
});
