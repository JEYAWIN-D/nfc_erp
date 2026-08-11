"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const assignment_repository_1 = require("../repository/assignment.repository");
const worker_repository_1 = require("../../worker/repository/worker.repository");
const machine_repository_1 = require("../../machine/repository/machine.repository");
const operation_repository_1 = require("../../operation/repository/operation.repository");
const shift_repository_1 = require("../../shift/repository/shift.repository");
const client_1 = require("@prisma/client");
const websocket_1 = require("../../websocket");
class AssignmentService {
    assignmentRepo;
    workerRepo;
    machineRepo;
    operationRepo;
    shiftRepo;
    constructor() {
        this.assignmentRepo = new assignment_repository_1.AssignmentRepository();
        this.workerRepo = new worker_repository_1.WorkerRepository();
        this.machineRepo = new machine_repository_1.MachineRepository();
        this.operationRepo = new operation_repository_1.OperationRepository();
        this.shiftRepo = new shift_repository_1.ShiftRepository();
    }
    async createAssignment(data) {
        return prisma_1.default.$transaction(async (tx) => {
            const [worker, machine, operation, shift] = await Promise.all([
                tx.worker.findUnique({ where: { id: data.workerId } }),
                tx.machine.findUnique({ where: { id: data.machineId } }),
                tx.operation.findUnique({ where: { id: data.operationId }, include: { requiredSkill: true } }),
                tx.shift.findUnique({ where: { id: data.shiftId } }),
            ]);
            if (!worker || worker.status !== client_1.RecordStatus.ACTIVE)
                throw new Error("Worker not found or not active");
            if (!machine || machine.status !== client_1.RecordStatus.ACTIVE)
                throw new Error("Machine not found or not active");
            if (!operation || operation.status !== client_1.RecordStatus.ACTIVE)
                throw new Error("Operation not found or not active");
            if (!shift || shift.status !== client_1.RecordStatus.ACTIVE)
                throw new Error("Shift not found or not active");
            if (operation.requiredSkillId) {
                const hasSkill = await tx.workerSkill.findUnique({
                    where: { workerId_skillId: { workerId: data.workerId, skillId: operation.requiredSkillId } }
                });
                if (!hasSkill) {
                    throw new Error(`Worker does not have the required skill "${operation.requiredSkill?.name}" for operation "${operation.operationName}"`);
                }
            }
            // reject if machine already occupied THIS shift — locked inside the same tx
            const machineBusy = await tx.assignment.findFirst({
                where: { machineId: data.machineId, shiftId: data.shiftId, status: client_1.AssignmentStatus.ACTIVE }
            });
            if (machineBusy)
                throw new Error("Machine is already assigned in this shift");
            // release worker's existing active assignment
            await tx.assignment.updateMany({
                where: { workerId: data.workerId, status: client_1.AssignmentStatus.ACTIVE },
                data: { status: client_1.AssignmentStatus.COMPLETED, releasedAt: new Date() }
            });
            const assignment = await tx.assignment.create({
                data: {
                    workerId: data.workerId,
                    machineId: data.machineId,
                    operationId: data.operationId,
                    shiftId: data.shiftId,
                    assignedBy: data.assignedBy,
                    remarks: data.remarks,
                    status: client_1.AssignmentStatus.ACTIVE,
                }
            });
            return assignment;
        }, { isolationLevel: "Serializable" })
            .then((assignment) => {
            websocket_1.websocketService.publish(websocket_1.WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, assignment);
            return assignment;
        })
            .catch((error) => {
            if (error.code === 'P2034') {
                throw new Error("Transaction conflict occurred. Please retry.");
            }
            throw error;
        });
    }
    async getAllAssignments(params) {
        return this.assignmentRepo.findAll(params);
    }
    async getAssignmentById(id) {
        const assignment = await this.assignmentRepo.findById(id);
        if (!assignment)
            throw new Error("Assignment not found");
        return assignment;
    }
    async releaseAssignment(id) {
        const assignment = await this.assignmentRepo.findById(id);
        if (!assignment)
            throw new Error("Assignment not found");
        if (assignment.status === client_1.AssignmentStatus.COMPLETED) {
            throw new Error("Assignment is already released");
        }
        const released = await this.assignmentRepo.releaseAssignment(id);
        websocket_1.websocketService.publish(websocket_1.WEBSOCKET_EVENTS.ASSIGNMENT_RELEASED, released);
        return released;
    }
    async updateAssignment(id, data) {
        const assignment = await this.assignmentRepo.findById(id);
        if (!assignment)
            throw new Error("Assignment not found");
        const updated = await this.assignmentRepo.update(id, data);
        websocket_1.websocketService.publish(websocket_1.WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, updated);
        return updated;
    }
}
exports.AssignmentService = AssignmentService;
