"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineRepository = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
class MachineRepository {
    async create(data) {
        return prisma_1.default.machine.create({
            data,
        });
    }
    async findAll(params) {
        const { machineCode, machineName, departmentId, machineTypeId, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = params;
        const skip = (page - 1) * limit;
        const where = {
            ...(machineCode && { machineCode: { contains: machineCode, mode: "insensitive" } }),
            ...(machineName && { machineName: { contains: machineName, mode: "insensitive" } }),
            ...(departmentId && { departmentId: Number(departmentId) }),
            ...(machineTypeId && { machineTypeId: Number(machineTypeId) }),
            ...(status && { status }),
        };
        const [total, data] = await Promise.all([
            prisma_1.default.machine.count({ where }),
            prisma_1.default.machine.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    department: true,
                    machineType: true,
                    terminal: true,
                    room: true,
                    assignments: {
                        where: { status: "ACTIVE" },
                        include: { worker: true, operation: true, shift: true }
                    }
                }
            })
        ]);
        return {
            total,
            page,
            limit,
            data
        };
    }
    async findById(id) {
        return prisma_1.default.machine.findUnique({
            where: { id },
            include: {
                department: true,
                machineType: true,
                terminal: true,
                room: true,
                assignments: {
                    where: { status: "ACTIVE" },
                    include: { worker: true, operation: true, shift: true }
                }
            }
        });
    }
    async findByMachineCode(machineCode) {
        return prisma_1.default.machine.findUnique({
            where: { machineCode },
        });
    }
    async findByTerminal(terminalId) {
        return prisma_1.default.machine.findUnique({
            where: { terminalId },
        });
    }
    async update(id, data) {
        return prisma_1.default.machine.update({
            where: { id },
            data,
        });
    }
    async changeStatus(id, status) {
        return prisma_1.default.machine.update({
            where: { id },
            data: { status },
        });
    }
    async checkDepartmentExists(id) {
        return prisma_1.default.department.findUnique({
            where: { id },
        });
    }
    async checkMachineTypeExists(id) {
        return prisma_1.default.machineType.findUnique({
            where: { id },
        });
    }
    async checkTerminalExists(id) {
        return prisma_1.default.terminal.findUnique({
            where: { id },
        });
    }
    async assignRoom(id, data) {
        return prisma_1.default.machine.update({
            where: { id },
            data,
            include: { room: true },
        });
    }
}
exports.MachineRepository = MachineRepository;
