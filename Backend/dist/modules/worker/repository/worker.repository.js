"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerRepository = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
class WorkerRepository {
    async create(data) {
        return prisma_1.default.worker.create({
            data,
        });
    }
    async findAll(params) {
        const { employeeCode, name, departmentId, gradeId, status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = params;
        const skip = (page - 1) * limit;
        const where = {
            ...(employeeCode && { employeeCode: { contains: employeeCode, mode: "insensitive" } }),
            ...(name && {
                OR: [
                    { firstName: { contains: name, mode: "insensitive" } },
                    { lastName: { contains: name, mode: "insensitive" } }
                ]
            }),
            ...(departmentId && { departmentId: Number(departmentId) }),
            ...(gradeId && { gradeId: Number(gradeId) }),
            ...(status && { status }),
        };
        const [total, data] = await Promise.all([
            prisma_1.default.worker.count({ where }),
            prisma_1.default.worker.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    department: true,
                    grade: true,
                    skills: {
                        include: {
                            skill: true
                        }
                    },
                    assignments: {
                        where: { status: "ACTIVE" },
                        include: { machine: true, operation: true }
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
        return prisma_1.default.worker.findUnique({
            where: { id },
            include: {
                department: true,
                grade: true,
                skills: {
                    include: {
                        skill: true
                    }
                },
                assignments: {
                    where: { status: "ACTIVE" },
                    include: { machine: true, operation: true }
                }
            }
        });
    }
    async findByEmployeeCode(employeeCode) {
        return prisma_1.default.worker.findUnique({
            where: { employeeCode },
        });
    }
    async findByNFCCard(nfcCardId) {
        return prisma_1.default.worker.findUnique({
            where: { nfcCardId },
        });
    }
    async update(id, data) {
        return prisma_1.default.worker.update({
            where: { id },
            data,
        });
    }
    async changeStatus(id, status) {
        return prisma_1.default.worker.update({
            where: { id },
            data: { status },
        });
    }
    async checkDepartmentExists(id) {
        return prisma_1.default.department.findUnique({
            where: { id },
        });
    }
    async checkGradeExists(id) {
        return prisma_1.default.workerGrade.findUnique({
            where: { id },
        });
    }
}
exports.WorkerRepository = WorkerRepository;
