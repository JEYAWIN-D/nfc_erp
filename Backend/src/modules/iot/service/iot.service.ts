import prisma from '../../../config/prisma';
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";

export class IotService {
  /**
   * Handles a tag scan event from an IoT terminal.
   * If there is an open log, it closes it (Scan Out).
   * If there is no open log, it opens a new one (Scan In).
   */
  async handleScan(tagCode: string, workerCardId: string, terminalCode: string) {
    return prisma.$transaction(async (tx) => {
      const tag = await tx.bundleTagAssignment.findUnique({
        where: { tagCode }, include: { bundle: { include: { productionOrder: true } } }
      });
      if (!tag || tag.status !== "ASSIGNED" || !tag.bundleId || !tag.bundle) {
        throw new Error("Invalid tag or tag not assigned to an active bundle.");
      }

      const worker = await tx.worker.findUnique({ where: { nfcCardId: workerCardId } });
      if (!worker) throw new Error("Worker ID card not recognized.");

      const terminal = await tx.terminal.findUnique({ where: { terminalCode }, include: { machine: true } });
      if (!terminal?.machine) throw new Error("Terminal not recognized or not mapped to a machine.");

      const assignment = await tx.assignment.findFirst({
        where: { machineId: terminal.machine.id, workerId: worker.id, status: "ACTIVE" },
        include: { operation: true }
      });
      if (!assignment) throw new Error(`Worker not actively assigned to machine ${terminal.machine.machineCode}.`);

      const operation = assignment.operation;
      const openLog = await tx.bundleStageLog.findFirst({
        where: { bundleId: tag.bundle.id, tagId: tag.id, operationId: operation.id, outTime: null }
      });

      if (openLog) {
        // SCAN OUT
        await tx.bundleStageLog.update({ where: { id: openLog.id }, data: { outTime: new Date() } });

        // is this the last operation in the route?
        const maxOrderTask = await tx.productionTask.findFirst({
          where: { productionOrderId: tag.bundle.productionOrderId },
          include: { operation: true },
          orderBy: { operation: { displayOrder: "desc" } }
        });
        const isFinalOperation = maxOrderTask?.operationId === operation.id;

        const updatedBundle = await tx.bundle.update({
          where: { id: tag.bundle.id },
          data: { status: isFinalOperation ? "COMPLETED" : "IN_PROGRESS" }
        });

        const task = await tx.productionTask.findFirst({
          where: { productionOrderId: tag.bundle.productionOrderId, operationId: operation.id }
        });
        // If it's the final operation, we might mark the task as COMPLETED (or let QC do it).
        // Following the prompt's suggestion: scan-out on final operation -> COMPLETED
        if (isFinalOperation && task && task.status !== "COMPLETED") {
          await tx.productionTask.update({ where: { id: task.id }, data: { status: "COMPLETED" } });
        }

        websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, updatedBundle);
        return { action: "SCAN_OUT", bundle: tag.bundle.bundleNumber, operation: operation.operationName, movedToQC: isFinalOperation };
      } else {
        // SCAN IN
        const newLog = await tx.bundleStageLog.create({
          data: { bundleId: tag.bundle.id, tagId: tag.id, operationId: operation.id, operatorId: worker.id, inTime: new Date() }
        });
        
        const task = await tx.productionTask.findFirst({
          where: { productionOrderId: tag.bundle.productionOrderId, operationId: operation.id }
        });
        if (task && task.status !== "RUNNING") {
          await tx.productionTask.update({ where: { id: task.id }, data: { status: "RUNNING" } });
        }

        const updatedBundle = await tx.bundle.update({
          where: { id: tag.bundle.id },
          data: { currentOperationId: operation.id, currentMachineId: terminal.machine.id, currentWorkerId: worker.id, status: "IN_PROGRESS" }
        });
        websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, updatedBundle);
        return { action: "SCAN_IN", bundle: tag.bundle.bundleNumber, operation: operation.operationName };
      }
    });
  }
}
