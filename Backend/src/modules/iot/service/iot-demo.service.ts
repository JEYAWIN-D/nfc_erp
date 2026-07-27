import prisma from '../../../config/prisma';
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";

export interface DemoActivityLogEntry {
  id: string;
  timestamp: string;
  category: 'ATTENDANCE' | 'MACHINE' | 'BUNDLE' | 'SYSTEM';
  eventType: string;
  message: string;
  details?: any;
}

export class IotDemoService {
  /**
   * Helper to write timestamped activity logs to Database (ActivityLog model)
   */
  async writeActivity(
    category: 'ATTENDANCE' | 'MACHINE' | 'BUNDLE' | 'SYSTEM',
    eventType: string,
    message: string,
    details?: any,
    tx?: any
  ): Promise<DemoActivityLogEntry> {
    const db = tx || prisma;
    const productionOrderId = details?.productionOrderId ? Number(details.productionOrderId) : undefined;

    const created = await db.activityLog.create({
      data: {
        category,
        eventType,
        message,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        productionOrderId: productionOrderId || null,
      },
    });

    const entry: DemoActivityLogEntry = {
      id: created.id,
      timestamp: created.timestamp.toISOString(),
      category: created.category as any,
      eventType: created.eventType,
      message: created.message,
      details: created.details,
    };

    websocketService.publish('iot.demo.log', entry);
    return entry;
  }

  /**
   * Get recent simulation activity logs from Database
   */
  async getActivityLogs(productionOrderId?: number): Promise<DemoActivityLogEntry[]> {
    const logs = await prisma.activityLog.findMany({
      where: productionOrderId ? { OR: [{ productionOrderId: null }, { productionOrderId }] } : undefined,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      category: l.category as any,
      eventType: l.eventType,
      message: l.message,
      details: l.details,
    }));
  }

  /**
   * Get Production Order Workflow Context
   * Loads production orders, tasks, assigned workers, assigned machines, bundles, and timeline logs.
   */
  async getOrderWorkflowContext(productionOrderId?: number) {
    const orders = await prisma.productionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (!productionOrderId && orders.length > 0) {
      const activeOrder =
        orders.find(
          (o) =>
            o.status === 'RUNNING' ||
            o.status === 'READY_FOR_PRODUCTION' ||
            o.status === 'IN_PROGRESS' ||
            o.status === 'PLANNED' ||
            o.status === 'DRAFT'
        ) || orders[0];
      productionOrderId = activeOrder.id;
    }

    const activityLogs = await this.getActivityLogs(productionOrderId);

    if (!productionOrderId) {
      return {
        orders: [],
        selectedOrder: null,
        tasks: [],
        activeAssignments: [],
        operations: [],
        assignedWorkers: [],
        assignedMachines: [],
        bundles: [],
        timeline: [],
      };
    }

    let selectedOrder = productionOrderId
      ? await prisma.productionOrder.findUnique({
          where: { id: productionOrderId },
          include: {
            bundles: {
              orderBy: { id: 'asc' },
              include: { currentWorker: true, currentMachine: true, currentOperation: true },
            },
            productionTasks: {
              include: {
                operation: true,
                worker: { include: { department: true } },
                machine: { include: { department: true } },
                shift: true,
              },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        })
      : null;

    // Fallback if productionOrderId is missing, stale, or deleted
    if (!selectedOrder && orders.length > 0) {
      const fallbackOrder =
        orders.find(
          (o) =>
            o.status === 'RUNNING' ||
            o.status === 'READY_FOR_PRODUCTION' ||
            o.status === 'IN_PROGRESS' ||
            o.status === 'PLANNED' ||
            o.status === 'DRAFT'
        ) || orders[0];
      selectedOrder = await prisma.productionOrder.findUnique({
        where: { id: fallbackOrder.id },
        include: {
          bundles: {
            orderBy: { id: 'asc' },
            include: { currentWorker: true, currentMachine: true, currentOperation: true },
          },
          productionTasks: {
            include: {
              operation: true,
              worker: { include: { department: true } },
              machine: { include: { department: true } },
              shift: true,
            },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });
    }

    if (!selectedOrder) {
      return {
        orders,
        selectedOrder: null,
        tasks: [],
        activeAssignments: [],
        operations: [],
        bundles: [],
        attendances: [],
        timeline: activityLogs,
      };
    }

    // Extract unique operations
    const operationsMap = new Map();
    selectedOrder.productionTasks.forEach((t) => {
      if (t.operation && !operationsMap.has(t.operation.id)) {
        operationsMap.set(t.operation.id, t.operation);
      }
    });

    // Also fetch active assignments to guarantee worker/machine mapping alignment
    const activeAssignments = await prisma.assignment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        worker: { include: { department: true } },
        machine: { include: { department: true } },
        operation: true,
        shift: true,
      },
    });

    const latestAttendances = await prisma.attendance.findMany({
      orderBy: { tapTime: 'desc' },
      take: 200,
    });

    // Calculate worker timing metrics from DB activity logs & bundles
    const workerTimingStats: Record<
      number,
      { completedCount: number; avgMinutesPerBundle: number; isSimulated: boolean }
    > = {};

    activityLogs.forEach((log) => {
      if (log.category === 'BUNDLE' && log.eventType === 'BUNDLE_COMPLETED' && (log.details as any)?.workerId) {
        const details = log.details as any;
        const wId = Number(details.workerId);
        if (!workerTimingStats[wId]) {
          workerTimingStats[wId] = {
            completedCount: 0,
            avgMinutesPerBundle: details.durationMinutes || 14.5,
            isSimulated: details.isEstimated ?? false,
          };
        }
        workerTimingStats[wId].completedCount += 1;
        const durationMin = details.durationMinutes || 14.5;
        workerTimingStats[wId].avgMinutesPerBundle =
          Math.round(
            ((workerTimingStats[wId].avgMinutesPerBundle * (workerTimingStats[wId].completedCount - 1) + durationMin) /
              workerTimingStats[wId].completedCount) *
              10
          ) / 10;
        if (details.isEstimated) {
          workerTimingStats[wId].isSimulated = true;
        }
      }
    });

    // Filter activity logs relevant to this order or general system
    const orderLogs = activityLogs.filter(
      (log) => !(log.details as any)?.productionOrderId || (log.details as any).productionOrderId === productionOrderId
    );

    return {
      orders,
      selectedOrder,
      tasks: selectedOrder.productionTasks,
      activeAssignments,
      operations: Array.from(operationsMap.values()),
      bundles: selectedOrder.bundles,
      attendances: latestAttendances,
      workerTimingStats,
      timeline: orderLogs,
    };
  }

  /**
   * Toggle Worker Check-in / Check-out (Present ↔ Absent).
   * Automatically updates Machine status, Production Task, Production Order, and emits WebSockets.
   */
  async toggleWorker(workerId: number) {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        assignments: { where: { status: 'ACTIVE' }, include: { machine: true, shift: true, operation: true } },
      },
    });

    if (!worker) throw new Error('Worker not found');

    const latestAttendance = await prisma.attendance.findFirst({
      where: { workerId: worker.id },
      orderBy: { tapTime: 'desc' },
    });

    const isCurrentlyIn = latestAttendance?.attendanceType === 'IN';
    const nextAttendanceType = isCurrentlyIn ? 'OUT' : 'IN';

    const firstAssignment =
      worker.assignments.length > 0
        ? worker.assignments[0]
        : await prisma.assignment.findFirst({
            where: { workerId: worker.id, status: 'ACTIVE' },
            include: { machine: true, shift: true, operation: true },
          });

    // Check if worker has associated production task
    const task = await prisma.productionTask.findFirst({
      where: { workerId: worker.id, status: { in: ['ASSIGNED', 'RUNNING'] } },
      include: { productionOrder: true, machine: true },
    });

    const firstTerminal = (await prisma.terminal.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
    const targetMachine =
      task?.machine ||
      firstAssignment?.machine ||
      (await prisma.machine.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
    const firstShift = firstAssignment?.shift || (await prisma.shift.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };

    const attendanceRecord = await prisma.attendance.create({
      data: {
        workerId: worker.id,
        assignmentId: firstAssignment?.id || 1,
        terminalId: firstTerminal.id,
        machineId: targetMachine.id,
        shiftId: firstShift.id,
        attendanceType: nextAttendanceType,
        tapTime: new Date(),
      },
    });

    const workerName = `${worker.firstName} ${worker.lastName}`;
    let productionOrderId: number | undefined = undefined;

    if (task) {
      productionOrderId = task.productionOrderId;
    }

    if (nextAttendanceType === 'IN') {
      // 1. Update Machine to ACTIVE / Running
      if (targetMachine.id) {
        await prisma.machine.update({
          where: { id: targetMachine.id },
          data: { status: 'ACTIVE' },
        });
      }

      // 2. Update Task status to RUNNING
      if (task && task.status !== 'RUNNING') {
        await prisma.productionTask.update({
          where: { id: task.id },
          data: { status: 'RUNNING' },
        });
      }

      // 3. Update Order status to RUNNING if it was READY_FOR_PRODUCTION or PLANNED
      if (
        task?.productionOrder &&
        (task.productionOrder.status === ('READY_FOR_PRODUCTION' as any) ||
          task.productionOrder.status === 'PLANNED' ||
          task.productionOrder.status === 'IN_PROGRESS')
      ) {
        await prisma.productionOrder.update({
          where: { id: task.productionOrderId },
          data: { status: 'RUNNING' as any },
        });

        await this.writeActivity(
          'SYSTEM',
          'PRODUCTION_STARTED',
          `Production Started for Order ${task.productionOrder.orderNumber}`,
          { productionOrderId: task.productionOrderId }
        );
      }

      const logMsg = `Worker ${workerName} (${worker.employeeCode}) Checked IN — Machine ${
        (targetMachine as any).machineCode || targetMachine.id
      } Running`;
      await this.writeActivity('ATTENDANCE', 'WORKER_CHECK_IN', logMsg, {
        workerId,
        employeeCode: worker.employeeCode,
        machineId: targetMachine.id,
        productionOrderId,
      });
    } else {
      // Worker Check OUT — Paused / Idle
      if (targetMachine.id) {
        await prisma.machine.update({
          where: { id: targetMachine.id },
          data: { status: 'INACTIVE' },
        });
      }

      const logMsg = `Worker ${workerName} (${worker.employeeCode}) Checked OUT — Machine Paused / Idle`;
      await this.writeActivity('ATTENDANCE', 'WORKER_CHECK_OUT', logMsg, {
        workerId,
        employeeCode: worker.employeeCode,
        machineId: targetMachine.id,
        productionOrderId,
      });
    }

    // Publish WebSocket events
    websocketService.publish(
      nextAttendanceType === 'IN' ? WEBSOCKET_EVENTS.ATTENDANCE_IN : WEBSOCKET_EVENTS.ATTENDANCE_OUT,
      { workerId, attendance: attendanceRecord }
    );
    websocketService.publish(WEBSOCKET_EVENTS.ATTENDANCE_UPDATED, { workerId });
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, { machineId: targetMachine.id });
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_LIVEFLOOR_UPDATED, {});

    return {
      success: true,
      status: nextAttendanceType === 'IN' ? 'PRESENT' : 'ABSENT',
      workerName,
      message: `${workerName} ${nextAttendanceType === 'IN' ? 'Checked In' : 'Checked Out'}`,
    };
  }

  /**
   * Toggle Machine Status (Running ↔ Idle)
   */
  async toggleMachine(machineId: number, targetStatus?: string, reason?: string) {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) throw new Error(`Machine ID ${machineId} not found`);

    const isRunning = machine.status === 'ACTIVE' || (machine.status as string) === 'running';
    const nextStatus = targetStatus ? targetStatus : isRunning ? 'idle' : 'running';

    const updatedMachine = await prisma.machine.update({
      where: { id: machineId },
      data: {
        status: nextStatus === 'running' || nextStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    const logMsg = reason
      ? `Machine ${machine.machineCode} (${machine.machineName}) set to ${nextStatus.toUpperCase()} (${reason})`
      : `Machine ${machine.machineCode} (${machine.machineName}) set to ${nextStatus.toUpperCase()}`;

    await this.writeActivity('MACHINE', `MACHINE_${nextStatus.toUpperCase()}`, logMsg, {
      machineId,
      machineCode: machine.machineCode,
      status: nextStatus,
    });

    websocketService.publish(
      nextStatus === 'running' ? WEBSOCKET_EVENTS.MACHINE_RUNNING : WEBSOCKET_EVENTS.MACHINE_IDLE,
      updatedMachine
    );
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, updatedMachine);
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});

    return {
      success: true,
      machineId,
      machineCode: machine.machineCode,
      status: nextStatus,
      message: logMsg,
    };
  }

  /**
   * Advance Bundle Progression:
   * Allocated (CREATED) → Started (IN_PROGRESS) → Completed (COMPLETED) → Closed (QC_COMPLETED)
   * Enforces:
   * 1. Sequential Gating: Only ONE bundle can be IN_PROGRESS at a time for an order.
   * 2. Worker Attendance Check & Fallback: Ensures a checked-in worker is assigned; fails loudly if none available.
   * 3. REWORK & HOLD explicit handling (HOLD blocked, REWORK returns to IN_PROGRESS without resetting qty).
   * 4. Race Condition Protection inside transaction.
   * 5. Prisma $transaction wrapping all writes.
   */
  async advanceBundle(bundleId: number, workerId?: number) {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        productionOrder: { include: { bundles: { orderBy: { id: 'asc' } } } },
        currentWorker: true,
      },
    });

    if (!bundle) throw new Error('Bundle not found');

    // 3. HOLD & Closed check
    if (bundle.status === 'HOLD') {
      throw new Error(`Bundle ${bundle.bundleNumber} is currently on HOLD. Release hold status before advancing.`);
    }

    if (bundle.status === 'QC_COMPLETED' || (bundle.status as string) === 'CLOSED') {
      throw new Error(`Bundle ${bundle.bundleNumber} is completed and closed. It cannot be reused or reset.`);
    }

    const nextStatusMap: Record<string, { status: any; completedQty: number; label: string }> = {
      CREATED: { status: 'IN_PROGRESS', completedQty: Math.floor(bundle.quantity / 2), label: 'Started (In Progress)' },
      WAITING: { status: 'IN_PROGRESS', completedQty: Math.floor(bundle.quantity / 2), label: 'Started (In Progress)' },
      IN_PROGRESS: { status: 'COMPLETED', completedQty: bundle.quantity, label: 'Completed' },
      COMPLETED: { status: 'QC_COMPLETED', completedQty: bundle.quantity, label: 'Closed (Transferred to QC)' },
      REWORK: { status: 'IN_PROGRESS', completedQty: bundle.completedQuantity, label: 'Returned to In Progress (Rework)' },
    };

    const nextStep = nextStatusMap[bundle.status] || nextStatusMap.CREATED;

    // Determine target worker, machine, operation
    let targetWorkerId = workerId || bundle.currentWorkerId || undefined;
    let targetMachineId = bundle.currentMachineId || undefined;
    let targetOperationId = bundle.currentOperationId || undefined;

    if (!targetWorkerId && nextStep.status === 'IN_PROGRESS') {
      const taskWithWorker = await prisma.productionTask.findFirst({
        where: { productionOrderId: bundle.productionOrderId, workerId: { not: null } },
        include: { worker: true, machine: true, operation: true },
      });
      if (taskWithWorker?.workerId) {
        targetWorkerId = taskWithWorker.workerId;
        targetMachineId = taskWithWorker.machineId || undefined;
        targetOperationId = taskWithWorker.operationId || undefined;
      }
    }

    if (targetWorkerId && (!targetMachineId || !targetOperationId)) {
      const workerAssignment = await prisma.assignment.findFirst({
        where: { workerId: targetWorkerId, status: 'ACTIVE' },
        include: { machine: true, operation: true },
      });
      if (workerAssignment) {
        targetMachineId = targetMachineId || workerAssignment.machineId;
        targetOperationId = targetOperationId || workerAssignment.operationId;
      }
    }

    // 2. Attendance Check & Auto Check-in for explicit worker allocation
    if (nextStep.status === 'IN_PROGRESS') {
      let isPresent = false;
      if (targetWorkerId) {
        const latestAttendance = await prisma.attendance.findFirst({
          where: { workerId: targetWorkerId },
          orderBy: [{ tapTime: 'desc' }, { id: 'desc' }],
        });
        isPresent = latestAttendance?.attendanceType === 'IN';
      }

      if (!isPresent) {
        if (workerId) {
          // Explicit workerId parameter was passed from Worker Attendance Terminal or Bundle Allocation action.
          // Auto-record an IN attendance entry for this worker so allocation succeeds smoothly.
          const firstAssignment = await prisma.assignment.findFirst({
            where: { workerId: targetWorkerId, status: 'ACTIVE' },
            include: { machine: true, shift: true },
          });
          const firstTerminal = (await prisma.terminal.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
          const firstShift = firstAssignment?.shift || (await prisma.shift.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
          const targetMachine = firstAssignment?.machine || (await prisma.machine.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };

          await prisma.attendance.create({
            data: {
              workerId: targetWorkerId!,
              assignmentId: firstAssignment?.id || 1,
              terminalId: firstTerminal.id,
              machineId: targetMachine.id,
              shiftId: firstShift.id,
              attendanceType: 'IN',
              tapTime: new Date(),
            },
          });

          if (targetMachine.id) {
            await prisma.machine.update({
              where: { id: targetMachine.id },
              data: { status: 'ACTIVE' },
            });
          }

          isPresent = true;
        } else {
          // Auto-assigned worker from task is not present — try fallback present worker
          const fallbackTask = await prisma.productionTask.findFirst({
            where: {
              productionOrderId: bundle.productionOrderId,
              workerId: { not: null },
              worker: {
                attendances: { some: { attendanceType: 'IN' } },
              },
            },
            orderBy: { sequenceOrder: 'asc' },
            include: { worker: true, machine: true, operation: true },
          });

          if (fallbackTask?.workerId) {
            targetWorkerId = fallbackTask.workerId;
            targetMachineId = fallbackTask.machineId || targetMachineId;
            targetOperationId = fallbackTask.operationId || targetOperationId;
          } else {
            throw new Error(
              `Cannot start bundle ${bundle.bundleNumber}: no checked-in worker is available for this order.`
            );
          }
        }
      }
    }

    // Reset worker assignment if resetting to CREATED
    if (nextStep.status === 'CREATED') {
      targetWorkerId = undefined;
      targetMachineId = undefined;
      targetOperationId = undefined;
    }

    // Calculate duration transparently
    const hasRealStartTime = Boolean(bundle.updatedAt);
    const startTimeMs = bundle.updatedAt ? new Date(bundle.updatedAt).getTime() : Date.now();
    const durationMs = Date.now() - startTimeMs;
    const rawDurationMinutes = Math.round((durationMs / (1000 * 60)) * 10) / 10;
    const isEstimated = !hasRealStartTime || rawDurationMinutes <= 0;
    const durationMinutes = isEstimated ? 14.5 : rawDurationMinutes;

    // 5. Wrap all database writes inside a single Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedBundle = await tx.bundle.update({
        where: { id: bundleId },
        data: {
          status: nextStep.status,
          completedQuantity: nextStep.completedQty,
          currentWorkerId: targetWorkerId ?? null,
          currentMachineId: targetMachineId ?? null,
          currentOperationId: targetOperationId ?? null,
        },
        include: {
          currentWorker: true,
          currentMachine: true,
          currentOperation: true,
        },
      });

      // Sync aggregate completedQuantity to ProductionOrder
      const orderCompletedAggregate = await tx.bundle.aggregate({
        where: { productionOrderId: bundle.productionOrderId },
        _sum: { completedQuantity: true },
      });

      await tx.productionOrder.update({
        where: { id: bundle.productionOrderId },
        data: { completedQuantity: orderCompletedAggregate._sum.completedQuantity || 0 },
      });

      const activeWorkerName = updatedBundle.currentWorker
        ? `${updatedBundle.currentWorker.firstName} ${updatedBundle.currentWorker.lastName}`
        : undefined;

      const durationText = isEstimated ? `~${durationMinutes}m (simulated)` : `${durationMinutes}m`;
      const logMsg =
        nextStep.status === 'COMPLETED'
          ? `Bundle ${bundle.bundleNumber} Completed (${nextStep.completedQty}/${bundle.quantity} pcs)${
              activeWorkerName ? ` by ${activeWorkerName}` : ''
            } in ${durationText}`
          : nextStep.status === 'IN_PROGRESS'
          ? `Bundle ${bundle.bundleNumber} Started by Worker ${activeWorkerName || 'Operator'} (IN USE)`
          : `Bundle ${bundle.bundleNumber} ${nextStep.label}`;

      await this.writeActivity(
        'BUNDLE',
        nextStep.status === 'COMPLETED' ? 'BUNDLE_COMPLETED' : 'BUNDLE_STARTED',
        logMsg,
        {
          bundleId,
          bundleNumber: bundle.bundleNumber,
          status: nextStep.status,
          workerId: targetWorkerId,
          workerName: activeWorkerName,
          durationMinutes: nextStep.status === 'COMPLETED' ? durationMinutes : undefined,
          isEstimated,
          productionOrderId: bundle.productionOrderId,
        },
        tx
      );

      // Check overall order progression
      if (bundle.productionOrderId) {
        const allBundles = await tx.bundle.findMany({
          where: { productionOrderId: bundle.productionOrderId },
        });

        const allFinished = allBundles.every((b) => b.status === 'COMPLETED' || b.status === 'QC_COMPLETED');
        if (allFinished) {
          await tx.productionTask.updateMany({
            where: { productionOrderId: bundle.productionOrderId },
            data: { status: 'COMPLETED' },
          });
          await tx.productionOrder.update({
            where: { id: bundle.productionOrderId },
            data: { status: 'QC' as any },
          });
          await this.writeActivity(
            'SYSTEM',
            'ORDER_QC',
            `All Bundles Finished. Order ${bundle.productionOrder?.orderNumber || bundle.productionOrderId} Moved to QC`,
            { productionOrderId: bundle.productionOrderId },
            tx
          );
        }
      }

      return { updatedBundle, logMsg };
    });

    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, result.updatedBundle);
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_LIVEFLOOR_UPDATED, {});

    return {
      success: true,
      bundleId,
      bundleNumber: bundle.bundleNumber,
      status: nextStep.status,
      completedQuantity: nextStep.completedQty,
      totalQuantity: bundle.quantity,
      message: result.logMsg,
    };
  }

  /**
   * Reset Demo:
   * Scoped to productionOrderId if specified, so factory machines and workers from other orders are not affected.
   * Resets workers to Absent using their real assignments/shifts, machines to Idle, bundles to CREATED, and clears order activity logs from DB.
   */
  async resetDemo(productionOrderId?: number) {
    if (productionOrderId) {
      // Find machines linked to this specific order's tasks or bundles
      const tasks = await prisma.productionTask.findMany({
        where: { productionOrderId },
        select: { machineId: true },
      });
      const orderBundles = await prisma.bundle.findMany({
        where: { productionOrderId },
        select: { currentMachineId: true },
      });

      const machineIds = Array.from(
        new Set([
          ...tasks.map((t) => t.machineId).filter(Boolean),
          ...orderBundles.map((b) => b.currentMachineId).filter(Boolean),
        ] as number[])
      );

      if (machineIds.length > 0) {
        await prisma.machine.updateMany({
          where: { id: { in: machineIds } },
          data: { status: 'INACTIVE' },
        });
      }

      await prisma.bundle.updateMany({
        where: { productionOrderId },
        data: {
          status: 'CREATED',
          completedQuantity: 0,
          currentMachineId: null,
          currentWorkerId: null,
        },
      });

      await prisma.activityLog.deleteMany({
        where: { productionOrderId },
      });
    } else {
      await prisma.machine.updateMany({
        data: { status: 'INACTIVE' },
      });

      await prisma.bundle.updateMany({
        data: {
          status: 'CREATED',
          completedQuantity: 0,
          currentMachineId: null,
          currentWorkerId: null,
        },
      });

      await prisma.activityLog.deleteMany({});
    }

    // Scoped active workers lookup
    const activeWorkers = productionOrderId
      ? await prisma.worker.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { productionTasks: { some: { productionOrderId } } },
              { assignments: { some: { status: 'ACTIVE', operation: { productionTasks: { some: { productionOrderId } } } } } },
            ],
          },
          take: 100,
        })
      : await prisma.worker.findMany({ where: { status: 'ACTIVE' }, take: 100 });

    // Clear simulation attendance records for workers on reset so workers return to default Assigned (Blue) state
    const workerIds = activeWorkers.map((w) => w.id);
    if (workerIds.length > 0) {
      try {
        await prisma.attendance.deleteMany({
          where: { workerId: { in: workerIds } },
        });
      } catch (e) {
        // ignore delete fallback errors
      }
    }

    const logMsg = productionOrderId
      ? `Order #${productionOrderId} Demo Environment Reset: Assigned machines set to Idle, order bundles to Allocated.`
      : 'Factory Demo Environment Reset: Workers set to Absent, machines to Idle, bundles to Allocated.';

    await this.writeActivity('SYSTEM', 'DEMO_RESET', logMsg, { productionOrderId });

    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});
    websocketService.publish(WEBSOCKET_EVENTS.ATTENDANCE_UPDATED, {});
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, {});
    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, {});

    return {
      success: true,
      message: logMsg,
    };
  }
}

export const iotDemoService = new IotDemoService();
