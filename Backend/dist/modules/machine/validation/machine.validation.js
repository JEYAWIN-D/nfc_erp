"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignMachineRoomSchema = exports.changeMachineStatusSchema = exports.updateMachineSchema = exports.createMachineSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createMachineSchema = zod_1.z.object({
    machineCode: zod_1.z.string().min(1, "Machine Code is required"),
    machineName: zod_1.z.string().min(1, "Machine Name is required"),
    departmentId: zod_1.z.number().int().positive("Department ID must be a positive number"),
    machineTypeId: zod_1.z.number().int().positive("Machine Type ID must be a positive number"),
    terminalId: zod_1.z.number().int().positive("Terminal ID must be a positive number"),
    status: zod_1.z.nativeEnum(client_1.RecordStatus).optional(),
    remarks: zod_1.z.string().optional(),
    roomId: zod_1.z.number().int().optional().nullable(),
    rowIndex: zod_1.z.number().int().optional().nullable(),
    positionIndex: zod_1.z.number().int().optional().nullable(),
});
exports.updateMachineSchema = zod_1.z.object({
    machineName: zod_1.z.string().min(1).optional(),
    departmentId: zod_1.z.number().int().positive().optional(),
    machineTypeId: zod_1.z.number().int().positive().optional(),
    terminalId: zod_1.z.number().int().positive().optional(),
    remarks: zod_1.z.string().optional(),
    roomId: zod_1.z.number().int().optional().nullable(),
    rowIndex: zod_1.z.number().int().optional().nullable(),
    positionIndex: zod_1.z.number().int().optional().nullable(),
});
exports.changeMachineStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.RecordStatus, { message: "Status is required" }),
});
exports.assignMachineRoomSchema = zod_1.z.object({
    roomId: zod_1.z.number().int().nullable(),
    rowIndex: zod_1.z.number().int().nullable(),
    positionIndex: zod_1.z.number().int().nullable(),
});
