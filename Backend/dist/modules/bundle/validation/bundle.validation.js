"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBundleStatusSchema = exports.updateBundleSchema = exports.createBundleSchema = void 0;
const zod_1 = require("zod");
exports.createBundleSchema = zod_1.z.object({
    bundleNumber: zod_1.z.string().min(1, "Bundle number is required"),
    productionOrderId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().positive("Quantity must be positive"),
});
exports.updateBundleSchema = zod_1.z.object({
    currentOperationId: zod_1.z.number().int().positive().optional().nullable(),
    currentMachineId: zod_1.z.number().int().positive().optional().nullable(),
    currentWorkerId: zod_1.z.number().int().positive().optional().nullable(),
    quantity: zod_1.z.number().int().positive().optional(),
});
exports.updateBundleStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["CREATED", "IN_PROGRESS", "WAITING", "COMPLETED", "QC_COMPLETED", "REWORK", "HOLD"]),
});
