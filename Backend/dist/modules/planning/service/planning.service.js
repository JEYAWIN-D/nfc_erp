"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.planningService = exports.PlanningService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const resource_availability_service_1 = require("./resource-availability.service");
class PlanningService {
    async generateUniqueTaskId(tx) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const count = await tx.productionTask.count();
            const taskId = `TSK-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
            const exists = await tx.productionTask.findUnique({ where: { taskId } });
            if (!exists)
                return taskId;
        }
        throw new Error("Could not generate a unique task ID, please retry");
    }
    async generateUniqueBundleNumber(tx, orderNumber) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const count = await tx.bundle.count({ where: { productionOrder: { orderNumber } } });
            const bundleNumber = `${orderNumber}-B${(count + 1).toString().padStart(3, '0')}`;
            const exists = await tx.bundle.findUnique({ where: { bundleNumber } });
            if (!exists)
                return bundleNumber;
        }
        throw new Error("Could not generate a unique bundle number, please retry");
    }
    async getDashboardMetrics() {
        const totalOrders = await prisma_1.default.productionOrder.count();
        const activeOrders = await prisma_1.default.productionOrder.count({ where: { status: "IN_PROGRESS" } });
        const completedOrders = await prisma_1.default.productionOrder.count({ where: { status: "COMPLETED" } });
        const activeBundles = await prisma_1.default.bundle.count({ where: { status: "IN_PROGRESS" } });
        const waitingBundles = await prisma_1.default.bundle.count({ where: { status: "WAITING" } });
        const totalWorkers = await prisma_1.default.worker.count({ where: { status: "ACTIVE" } });
        const busyWorkers = (await prisma_1.default.assignment.groupBy({
            by: ["workerId"],
            where: { status: "ACTIVE" }
        })).length;
        const totalMachines = await prisma_1.default.machine.count({ where: { status: "ACTIVE" } });
        const busyMachines = (await prisma_1.default.assignment.groupBy({
            by: ["machineId"],
            where: { status: "ACTIVE" }
        })).length;
        const pendingTasks = await prisma_1.default.productionTask.count({
            where: { status: { in: ["CREATED", "PLANNED"] } }
        });
        return {
            orders: { total: totalOrders, active: activeOrders, completed: completedOrders },
            bundles: { active: activeBundles, waiting: waitingBundles },
            workers: { total: totalWorkers, busy: busyWorkers, available: totalWorkers - busyWorkers },
            machines: { total: totalMachines, busy: busyMachines, available: totalMachines - busyMachines },
            tasks: { pending: pendingTasks }
        };
    }
    async getAllTasks() {
        return prisma_1.default.productionTask.findMany({
            include: {
                productionOrder: true,
                operation: true,
                department: true,
                machine: true,
                worker: true,
            },
            orderBy: { priority: "desc" },
        });
    }
    async getTaskById(id) {
        return prisma_1.default.productionTask.findUnique({
            where: { id },
            include: {
                productionOrder: true,
                operation: true,
                department: true,
                machine: true,
                worker: true,
            },
        });
    }
    async createTask(data) {
        return prisma_1.default.$transaction(async (tx) => {
            const taskId = await this.generateUniqueTaskId(tx);
            return tx.productionTask.create({
                data: {
                    ...data,
                    taskId,
                },
                include: {
                    productionOrder: true,
                    operation: true,
                },
            });
        });
    }
    async updateTask(id, data) {
        if (data.status) {
            const task = await prisma_1.default.productionTask.findUnique({ where: { id } });
            if (!task)
                throw new Error("Task not found");
            const allowedTransitions = {
                'CREATED': ['PLANNED', 'ASSIGNED'],
                'PLANNED': ['ASSIGNED', 'CREATED'],
                'ASSIGNED': ['ACCEPTED', 'RUNNING', 'PLANNED'],
                'ACCEPTED': ['RUNNING', 'ASSIGNED'],
                'RUNNING': ['COMPLETED', 'ASSIGNED', 'ACCEPTED'],
                'COMPLETED': ['CLOSED'],
                'CLOSED': []
            };
            if (task.status !== data.status) {
                const allowed = allowedTransitions[task.status] || [];
                if (!allowed.includes(data.status)) {
                    throw new Error(`Invalid status transition from ${task.status} to ${data.status}`);
                }
            }
        }
        return prisma_1.default.productionTask.update({
            where: { id },
            data,
        });
    }
    async getResourceAvailability() {
        const workers = await resource_availability_service_1.resourceAvailabilityService.getAvailableWorkers();
        const machines = await resource_availability_service_1.resourceAvailabilityService.getAvailableMachines();
        return { workers, machines };
    }
    async runAutoScheduler(taskId) {
        const task = await prisma_1.default.productionTask.findUnique({
            where: { id: taskId },
            include: { operation: true }
        });
        if (!task)
            throw new Error("Task not found");
        const availableMachines = await resource_availability_service_1.resourceAvailabilityService.getAvailableMachines({
            departmentId: task.departmentId
        });
        const availableWorkers = await resource_availability_service_1.resourceAvailabilityService.getAvailableWorkers({
            departmentId: task.departmentId,
            requiredSkillId: task.operation.requiredSkillId
        });
        // Score workers based on grade, skills, and current load
        const scoredWorkers = availableWorkers.map(w => {
            let score = 0;
            // Base score from grade (A=4, B=3, C=2, D=1)
            const gradeScore = 5 - w.grade.priority;
            score += gradeScore * 10;
            // Skill match
            const hasRequiredSkill = w.skills.some(s => s.skillId === task.operation.requiredSkillId);
            if (hasRequiredSkill)
                score += 50;
            // Deduct points if they have active assignments (load balancing)
            // Since getAvailableWorkers filters out active assignments, they should all be 0 here,
            // but in a real system we'd check their total assigned tasks for the day.
            const taskLoad = 0; // w.productionTasks?.length || 0;
            score -= taskLoad * 5;
            return { worker: w, score };
        }).sort((a, b) => b.score - a.score);
        const bestWorker = scoredWorkers[0]?.worker || null;
        let skillMatch = 0;
        let efficiency = 0;
        if (bestWorker) {
            skillMatch = bestWorker.skills.some(s => s.skillId === task.operation.requiredSkillId) ? 100 : 75;
            efficiency = Math.max(50, 100 - (bestWorker.grade.priority * 5));
        }
        const estimatedMinutes = task.estimatedTime;
        const now = new Date();
        const scheduledStart = now;
        const scheduledEnd = new Date(now.getTime() + estimatedMinutes * 60000);
        return {
            taskId: task.id,
            recommendedMachine: availableMachines[0] || null,
            recommendedWorker: bestWorker,
            skillMatch,
            efficiency,
            scheduledStart,
            scheduledEnd,
            estimatedCompletionTime: `${Math.ceil(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
        };
    }
    async publishPlan(data) {
        return prisma_1.default.$transaction(async (tx) => {
            const order = await tx.productionOrder.findUnique({
                where: { id: data.productionOrderId },
                include: { bundles: true }
            });
            if (!order)
                throw new Error("Production order not found");
            // 1. Generate Bundles if requested
            const newBundles = [];
            if (data.bundles && data.bundles.length > 0) {
                const availableTags = await tx.bundleTagAssignment.findMany({
                    where: { status: "AVAILABLE" },
                    take: data.bundles.length,
                    orderBy: { tagCode: 'asc' }
                });
                if (availableTags.length < data.bundles.length) {
                    throw new Error(`Not enough available tags in the pool. Need ${data.bundles.length}, but only have ${availableTags.length}. Please register more tags first.`);
                }
                for (let i = 0; i < data.bundles.length; i++) {
                    const b = data.bundles[i];
                    const bundleNumber = await this.generateUniqueBundleNumber(tx, order.orderNumber);
                    const safeQuantity = Math.max(1, Math.floor(b.quantity));
                    const bundle = await tx.bundle.create({
                        data: {
                            bundleNumber,
                            productionOrderId: order.id,
                            quantity: safeQuantity,
                            status: "CREATED"
                        }
                    });
                    newBundles.push(bundle);
                    await tx.bundleTagAssignment.update({
                        where: { id: availableTags[i].id },
                        data: {
                            bundleId: bundle.id,
                            status: "ASSIGNED",
                            assignedAt: new Date(),
                            releasedAt: null,
                            assignedBy: "System Planner"
                        }
                    });
                }
            }
            // 2. Create Assignments (Activate for IoT) with safety
            let defaultShiftId = undefined;
            if (data.assignments.some(a => !a.shiftId)) {
                const activeShift = await tx.shift.findFirst({ where: { status: "ACTIVE" } });
                if (activeShift)
                    defaultShiftId = activeShift.id;
            }
            const createdAssignments = [];
            for (const a of data.assignments) {
                const shiftId = a.shiftId || defaultShiftId;
                if (!shiftId)
                    throw new Error("No active shift found for assignment");
                // Gracefully release any prior active assignments for this machine
                await tx.assignment.updateMany({
                    where: { machineId: a.machineId, status: 'ACTIVE' },
                    data: { status: 'COMPLETED', releasedAt: new Date() }
                });
                // Release worker's prior active assignment
                await tx.assignment.updateMany({
                    where: { workerId: a.workerId, status: 'ACTIVE' },
                    data: { status: 'COMPLETED', releasedAt: new Date() }
                });
                const assignment = await tx.assignment.create({
                    data: {
                        operationId: a.operationId,
                        workerId: a.workerId,
                        machineId: a.machineId,
                        shiftId,
                        status: "ACTIVE",
                        assignedBy: "System Planner"
                    }
                });
                createdAssignments.push(assignment);
            }
            // 2.5 Create Production Tasks for the Planning Board
            if (data.operations && data.operations.length > 0) {
                const defaultDept = await tx.department.findFirst();
                const deptId = defaultDept?.id || 1;
                for (const opId of data.operations) {
                    const assignmentsForOp = data.assignments.filter(a => a.operationId === opId);
                    const op = await tx.operation.findUnique({ where: { id: opId } });
                    const estimatedTime = op ? Math.ceil(order.plannedQuantity * op.standardMinuteValue) : 60;
                    if (assignmentsForOp.length > 0) {
                        for (const assignment of assignmentsForOp) {
                            const taskId = await this.generateUniqueTaskId(tx);
                            const splitQuantity = Math.max(1, Math.ceil(order.plannedQuantity / assignmentsForOp.length));
                            const splitTime = Math.max(1, Math.ceil(estimatedTime / assignmentsForOp.length));
                            await tx.productionTask.create({
                                data: {
                                    taskId,
                                    productionOrderId: order.id,
                                    operationId: opId,
                                    departmentId: deptId,
                                    machineId: assignment.machineId,
                                    workerId: assignment.workerId,
                                    shiftId: assignment.shiftId || defaultShiftId,
                                    targetQuantity: splitQuantity,
                                    estimatedTime: splitTime,
                                    status: "ASSIGNED",
                                    priority: order.priority
                                }
                            });
                        }
                    }
                    else {
                        const taskId = await this.generateUniqueTaskId(tx);
                        await tx.productionTask.create({
                            data: {
                                taskId,
                                productionOrderId: order.id,
                                operationId: opId,
                                departmentId: deptId,
                                targetQuantity: order.plannedQuantity,
                                estimatedTime,
                                status: "PLANNED",
                                priority: order.priority
                            }
                        });
                    }
                }
            }
            // 3. Mark Production Order as IN_PROGRESS or PLANNED
            if (order.status === "PLANNED") {
                await tx.productionOrder.update({
                    where: { id: order.id },
                    data: { status: "IN_PROGRESS" }
                });
            }
            return {
                success: true,
                message: "Plan published successfully to IoT terminals",
                bundlesCreated: newBundles.length,
                assignmentsCreated: createdAssignments.length
            };
        }, { isolationLevel: 'Serializable' });
    }
    async getHistory() {
        return prisma_1.default.bundleStageLog.findMany({
            include: {
                bundle: {
                    include: {
                        productionOrder: true
                    }
                },
                tag: true,
                operation: true,
                operator: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100
        });
    }
}
exports.PlanningService = PlanningService;
exports.planningService = new PlanningService();
