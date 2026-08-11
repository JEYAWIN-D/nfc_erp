"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPlanSchema = exports.UpdateTaskSchema = exports.CreateTaskSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.CreateTaskSchema = zod_1.z.object({
    productionOrderId: zod_1.z.number(),
    bundleId: zod_1.z.number().optional(),
    operationId: zod_1.z.number(),
    departmentId: zod_1.z.number(),
    machineId: zod_1.z.number().optional(),
    workerId: zod_1.z.number().optional(),
    shiftId: zod_1.z.number().optional(),
    priority: zod_1.z.number().default(0),
    estimatedTime: zod_1.z.number(),
    targetQuantity: zod_1.z.number(),
    supervisor: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
exports.UpdateTaskSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TaskStatus).optional(),
    machineId: zod_1.z.number().nullable().optional(),
    workerId: zod_1.z.number().nullable().optional(),
    shiftId: zod_1.z.number().nullable().optional(),
    priority: zod_1.z.number().optional(),
    supervisor: zod_1.z.string().nullable().optional(),
    remarks: zod_1.z.string().nullable().optional(),
});
exports.PublishPlanSchema = zod_1.z.object({
    productionOrderId: zod_1.z.number(),
    bundles: zod_1.z.array(zod_1.z.object({
        quantity: zod_1.z.number().int().positive()
    })),
    assignments: zod_1.z.array(zod_1.z.object({
        operationId: zod_1.z.number(),
        workerId: zod_1.z.number(),
        machineId: zod_1.z.number(),
        shiftId: zod_1.z.number().optional()
    })),
    operations: zod_1.z.array(zod_1.z.number()).optional()
});
