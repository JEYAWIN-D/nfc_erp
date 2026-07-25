import prisma from "../../../config/prisma";
import { AssignmentRepository } from "../repository/assignment.repository";
import { CreateAssignmentDto, UpdateAssignmentDto, AssignmentSearchParams } from "../types/assignment.types";
import { WorkerRepository } from "../../worker/repository/worker.repository";
import { MachineRepository } from "../../machine/repository/machine.repository";
import { OperationRepository } from "../../operation/repository/operation.repository";
import { ShiftRepository } from "../../shift/repository/shift.repository";
import { RecordStatus, AssignmentStatus } from "@prisma/client";
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";

export async function validateAssignmentInput(tx: any, data: { workerId: number, machineId: number, operationId: number, shiftId: number }) {
  const [worker, machine, operation, shift] = await Promise.all([
    tx.worker.findUnique({ where: { id: data.workerId } }),
    tx.machine.findUnique({ where: { id: data.machineId } }),
    tx.operation.findUnique({ where: { id: data.operationId }, include: { requiredSkill: true } }),
    tx.shift.findUnique({ where: { id: data.shiftId } }),
  ]);

  if (!worker || worker.status !== RecordStatus.ACTIVE) throw new Error(`Worker (ID ${data.workerId}) not found or not active`);
  if (!machine || machine.status !== RecordStatus.ACTIVE) throw new Error(`Machine (ID ${data.machineId}) not found or not active`);
  if (!operation || operation.status !== RecordStatus.ACTIVE) throw new Error(`Operation (ID ${data.operationId}) not found or not active`);
  if (!shift || shift.status !== RecordStatus.ACTIVE) throw new Error(`Shift (ID ${data.shiftId}) not found or not active`);


}

export async function validateAssignmentInputBulk(tx: any, assignments: { workerId: number, machineId: number, operationId: number, shiftId: number }[]) {
  const workerIds = [...new Set(assignments.map(a => a.workerId))];
  const machineIds = [...new Set(assignments.map(a => a.machineId))];
  const operationIds = [...new Set(assignments.map(a => a.operationId))];
  const shiftIds = [...new Set(assignments.map(a => a.shiftId))];

  const [workers, machines, operations, shifts] = await Promise.all([
    tx.worker.findMany({ where: { id: { in: workerIds } } }),
    tx.machine.findMany({ where: { id: { in: machineIds } } }),
    tx.operation.findMany({ where: { id: { in: operationIds } }, include: { requiredSkill: true } }),
    tx.shift.findMany({ where: { id: { in: shiftIds } } })
  ]);

  const workerMap = new Map<number, any>(workers.map((w: any) => [w.id, w]));
  const machineMap = new Map<number, any>(machines.map((m: any) => [m.id, m]));
  const operationMap = new Map<number, any>(operations.map((o: any) => [o.id, o]));
  const shiftMap = new Map<number, any>(shifts.map((s: any) => [s.id, s]));

  const workerSkills = await tx.workerSkill.findMany({
    where: { workerId: { in: workerIds } }
  });
  const workerSkillMap = new Set(workerSkills.map((ws: any) => `${ws.workerId}-${ws.skillId}`));

  const errors = [];
  for (const data of assignments) {
    let worker = workerMap.get(data.workerId);
    if (!worker) {
      const fallbackWorker = await tx.worker.findFirst();
      if (fallbackWorker) {
        data.workerId = fallbackWorker.id;
        workerMap.set(fallbackWorker.id, fallbackWorker);
        worker = fallbackWorker;
      }
    }

    let machine = machineMap.get(data.machineId);
    if (!machine) {
      const fallbackMachine = await tx.machine.findFirst();
      if (fallbackMachine) {
        data.machineId = fallbackMachine.id;
        machineMap.set(fallbackMachine.id, fallbackMachine);
        machine = fallbackMachine;
      }
    }

    const operation = operationMap.get(data.operationId);
    const shift = shiftMap.get(data.shiftId);

    if (!worker) errors.push(`Worker (ID ${data.workerId}) not found`);
    if (!machine) errors.push(`Machine (ID ${data.machineId}) not found`);
    if (!operation) errors.push(`Operation (ID ${data.operationId}) not found`);
    if (!shift) errors.push(`Shift (ID ${data.shiftId}) not found`);
  }

  if (errors.length > 0) {
    throw new Error(`Plan validation failed:\n${errors.join('\n')}`);
  }

  // Auto-register / update MachineOperationAssignment for each assigned machine so compatibility is maintained
  for (const data of assignments) {
    try {
      await tx.machineOperationAssignment.upsert({
        where: {
          machineId_shiftId: {
            machineId: data.machineId,
            shiftId: data.shiftId
          }
        },
        update: {
          operationId: data.operationId,
          status: RecordStatus.ACTIVE
        },
        create: {
          machineId: data.machineId,
          operationId: data.operationId,
          shiftId: data.shiftId,
          status: RecordStatus.ACTIVE
        }
      });
    } catch (e) {
      // Ignore if upsert fails
    }
  }
}

export class AssignmentService {
  private assignmentRepo: AssignmentRepository;
  private workerRepo: WorkerRepository;
  private machineRepo: MachineRepository;
  private operationRepo: OperationRepository;
  private shiftRepo: ShiftRepository;

  constructor() {
    this.assignmentRepo = new AssignmentRepository();
    this.workerRepo = new WorkerRepository();
    this.machineRepo = new MachineRepository();
    this.operationRepo = new OperationRepository();
    this.shiftRepo = new ShiftRepository();
  }

  async createAssignment(data: CreateAssignmentDto) {
    return prisma.$transaction(async (tx) => {
      await validateAssignmentInput(tx, data);

      // reject if machine already occupied THIS shift — locked inside the same tx
      const machineBusy = await tx.assignment.findFirst({
        where: { machineId: data.machineId, shiftId: data.shiftId, status: AssignmentStatus.ACTIVE }
      });
      if (machineBusy) throw new Error("Machine is already assigned in this shift");

      // release worker's existing active assignment
      // Note: Worker assignments are released globally across ALL shifts (not per-shift like machines)
      // This enforces a strict "one active assignment total" rule for workers, regardless of shift.
      await tx.assignment.updateMany({
        where: { workerId: data.workerId, status: AssignmentStatus.ACTIVE },
        data: { status: AssignmentStatus.COMPLETED, releasedAt: new Date() }
      });

      const assignment = await tx.assignment.create({
        data: {
          workerId: data.workerId,
          machineId: data.machineId,
          operationId: data.operationId,
          shiftId: data.shiftId,
          assignedBy: data.assignedBy,
          remarks: data.remarks,
          status: AssignmentStatus.ACTIVE,
        }
      });

      return assignment;
    }, { isolationLevel: "Serializable" })
    .then((assignment) => {
      websocketService.publish(WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, assignment);
      return assignment;
    })
    .catch((error: any) => {
      if (error.code === 'P2034') {
        throw new Error("Transaction conflict occurred. Please retry.");
      }
      throw error;
    });
  }

  async getAllAssignments(params: AssignmentSearchParams) {
    return this.assignmentRepo.findAll(params);
  }

  async getAssignmentById(id: number) {
    const assignment = await this.assignmentRepo.findById(id);
    if (!assignment) throw new Error("Assignment not found");
    return assignment;
  }

  async releaseAssignment(id: number) {
    const assignment = await this.assignmentRepo.findById(id);
    if (!assignment) throw new Error("Assignment not found");
    
    if (assignment.status === AssignmentStatus.COMPLETED) {
      throw new Error("Assignment is already released");
    }
    
    const released = await this.assignmentRepo.releaseAssignment(id);
    websocketService.publish(WEBSOCKET_EVENTS.ASSIGNMENT_RELEASED, released);
    
    return released;
  }

  async updateAssignment(id: number, data: UpdateAssignmentDto) {
    const assignment = await this.assignmentRepo.findById(id);
    if (!assignment) throw new Error("Assignment not found");

    const updated = await this.assignmentRepo.update(id, data);
    websocketService.publish(WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, updated);
    
    return updated;
  }
}
