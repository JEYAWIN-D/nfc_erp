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

const inMemoryActivityLogs: DemoActivityLogEntry[] = [];
const MAX_LOGS = 100;

export class IotDemoService {
  /**
   * Helper to write timestamped activity logs
   */
  async writeActivity(
    category: 'ATTENDANCE' | 'MACHINE' | 'BUNDLE' | 'SYSTEM',
    eventType: string,
    message: string,
    details?: any
  ): Promise<DemoActivityLogEntry> {
    const entry: DemoActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      category,
      eventType,
      message,
      details,
    };

    inMemoryActivityLogs.unshift(entry);
    if (inMemoryActivityLogs.length > MAX_LOGS) {
      inMemoryActivityLogs.pop();
    }

    websocketService.publish('iot.demo.log', entry);
    return entry;
  }

  /**
   * Get recent simulation activity logs
   */
  async getActivityLogs(): Promise<DemoActivityLogEntry[]> {
    return inMemoryActivityLogs;
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
      const activeOrder = orders.find(o => o.status === 'RUNNING' || o.status === 'READY_FOR_PRODUCTION' || o.status === 'IN_PROGRESS' || o.status === 'PLANNED' || o.status === 'DRAFT') || orders[0];
      productionOrderId = activeOrder.id;
    }

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
              include: { currentWorker: true, currentMachine: true, currentOperation: true }
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
      const fallbackOrder = orders.find(o => o.status === 'RUNNING' || o.status === 'READY_FOR_PRODUCTION' || o.status === 'IN_PROGRESS' || o.status === 'PLANNED' || o.status === 'DRAFT') || orders[0];
      selectedOrder = await prisma.productionOrder.findUnique({
        where: { id: fallbackOrder.id },
        include: {
          bundles: {
            orderBy: { id: 'asc' },
            include: { currentWorker: true, currentMachine: true, currentOperation: true }
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
        timeline: inMemoryActivityLogs,
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
      }
    });

    const latestAttendances = await prisma.attendance.findMany({
      orderBy: { tapTime: 'desc' },
      take: 200,
    });

    // Calculate worker timing metrics from activity logs & bundles
    const workerTimingStats: Record<number, { completedCount: number; avgMinutesPerBundle: number }> = {};

    inMemoryActivityLogs.forEach(log => {
      if (log.category === 'BUNDLE' && log.eventType === 'BUNDLE_COMPLETED' && log.details?.workerId) {
        const wId = Number(log.details.workerId);
        if (!workerTimingStats[wId]) {
          workerTimingStats[wId] = { completedCount: 0, avgMinutesPerBundle: 14.5 };
        }
        workerTimingStats[wId].completedCount += 1;
        const durationMin = log.details.durationMinutes || 14.5;
        workerTimingStats[wId].avgMinutesPerBundle = Math.round(((workerTimingStats[wId].avgMinutesPerBundle * (workerTimingStats[wId].completedCount - 1) + durationMin) / workerTimingStats[wId].completedCount) * 10) / 10;
      }
    });

    // Filter activity logs relevant to this order or general system
    const orderLogs = inMemoryActivityLogs.filter(log => 
      !log.details?.productionOrderId || log.details.productionOrderId === productionOrderId
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

    const firstAssignment = worker.assignments.length > 0 ? worker.assignments[0] : await prisma.assignment.findFirst({
      where: { workerId: worker.id, status: 'ACTIVE' },
      include: { machine: true, shift: true, operation: true }
    });

    // Check if worker has associated production task
    const task = await prisma.productionTask.findFirst({
      where: { workerId: worker.id, status: { in: ['ASSIGNED', 'RUNNING'] } },
      include: { productionOrder: true, machine: true }
    });

    const firstTerminal = (await prisma.terminal.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
    const targetMachine = task?.machine || firstAssignment?.machine || (await prisma.machine.findFirst({ where: { status: 'ACTIVE' } })) || { id: 1 };
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
          data: { status: 'ACTIVE' }
        });
      }

      // 2. Update Task status to RUNNING
      if (task && task.status !== 'RUNNING') {
        await prisma.productionTask.update({
          where: { id: task.id },
          data: { status: 'RUNNING' }
        });
      }

      // 3. Update Order status to RUNNING if it was READY_FOR_PRODUCTION or PLANNED
      if (task?.productionOrder && (task.productionOrder.status === ('READY_FOR_PRODUCTION' as any) || task.productionOrder.status === 'PLANNED' || task.productionOrder.status === 'IN_PROGRESS')) {
        await prisma.productionOrder.update({
          where: { id: task.productionOrderId },
          data: { status: 'RUNNING' as any }
        });

        await this.writeActivity('SYSTEM', 'PRODUCTION_STARTED', `Production Started for Order ${task.productionOrder.orderNumber}`, {
          productionOrderId: task.productionOrderId
        });
      }

      const logMsg = `Worker ${workerName} (${worker.employeeCode}) Checked IN — Machine ${(targetMachine as any).machineCode || targetMachine.id} Running`;
      await this.writeActivity('ATTENDANCE', 'WORKER_CHECK_IN', logMsg, {
        workerId,
        employeeCode: worker.employeeCode,
        machineId: targetMachine.id,
        productionOrderId
      });
    } else {
      // Worker Check OUT — Paused / Idle
      if (targetMachine.id) {
        await prisma.machine.update({
          where: { id: targetMachine.id },
          data: { status: 'INACTIVE' }
        });
      }

      const logMsg = `Worker ${workerName} (${worker.employeeCode}) Checked OUT — Machine Paused / Idle`;
      await this.writeActivity('ATTENDANCE', 'WORKER_CHECK_OUT', logMsg, {
        workerId,
        employeeCode: worker.employeeCode,
        machineId: targetMachine.id,
        productionOrderId
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
    const nextStatus = targetStatus
      ? targetStatus
      : isRunning
      ? 'idle'
      : 'running';

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
   * Enforces Sequential Gating: Only ONE bundle can be IN_PROGRESS at a time for an order.
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

    const nextStatusMap: Record<string, { status: any; completedQty: number; label: string }> = {
      CREATED: { status: 'IN_PROGRESS', completedQty: Math.floor(bundle.quantity / 2), label: 'Started (In Progress)' },
      WAITING: { status: 'IN_PROGRESS', completedQty: Math.floor(bundle.quantity / 2), label: 'Started (In Progress)' },
      IN_PROGRESS: { status: 'COMPLETED', completedQty: bundle.quantity, label: 'Completed' },
      COMPLETED: { status: 'QC_COMPLETED', completedQty: bundle.quantity, label: 'Closed (Transferred to QC)' },
      QC_PENDING: { status: 'QC_COMPLETED', completedQty: bundle.quantity, label: 'Closed (Transferred to QC)' },
      QC_COMPLETED: { status: 'CREATED', completedQty: 0, label: 'Reset to Allocated' },
    };

    const nextStep = nextStatusMap[bundle.status] || nextStatusMap.CREATED;

    // Determine target worker, machine, operation
    let targetWorkerId = workerId || bundle.currentWorkerId || undefined;
    let targetMachineId = bundle.currentMachineId || undefined;
    let targetOperationId = bundle.currentOperationId || undefined;

    if (!targetWorkerId && nextStep.status === 'IN_PROGRESS') {
      const taskWithWorker = await prisma.productionTask.findFirst({
        where: { productionOrderId: bundle.productionOrderId, workerId: { not: null } },
        include: { worker: true, machine: true, operation: true }
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
        include: { machine: true, operation: true }
      });
      if (workerAssignment) {
        targetMachineId = targetMachineId || workerAssignment.machineId;
        targetOperationId = targetOperationId || workerAssignment.operationId;
      }
    }

    // Reset worker assignment if resetting to CREATED
    if (nextStep.status === 'CREATED') {
      targetWorkerId = undefined;
      targetMachineId = undefined;
      targetOperationId = undefined;
    }

    const updatedBundle = await prisma.bundle.update({
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
      }
    });

    const activeWorkerName = updatedBundle.currentWorker
      ? `${updatedBundle.currentWorker.firstName} ${updatedBundle.currentWorker.lastName}`
      : undefined;

    const startTimeMs = bundle.updatedAt ? new Date(bundle.updatedAt).getTime() : Date.now() - 14.5 * 60 * 1000;
    const durationMs = Date.now() - startTimeMs;
    const durationMinutes = Math.max(8, Math.min(30, Math.round((durationMs / (1000 * 60)) * 10) / 10 || 14.5));

    const logMsg = nextStep.status === 'COMPLETED'
      ? `Bundle ${bundle.bundleNumber} Completed (${nextStep.completedQty}/${bundle.quantity} pcs)${activeWorkerName ? ` by ${activeWorkerName}` : ''} in ${durationMinutes}m`
      : nextStep.status === 'IN_PROGRESS'
      ? `Bundle ${bundle.bundleNumber} Started by Worker ${activeWorkerName || 'Operator'} (IN USE)`
      : `Bundle ${bundle.bundleNumber} ${nextStep.label}`;

    await this.writeActivity('BUNDLE', nextStep.status === 'COMPLETED' ? 'BUNDLE_COMPLETED' : 'BUNDLE_STARTED', logMsg, {
      bundleId,
      bundleNumber: bundle.bundleNumber,
      status: nextStep.status,
      workerId: targetWorkerId,
      workerName: activeWorkerName,
      durationMinutes: nextStep.status === 'COMPLETED' ? durationMinutes : undefined,
      productionOrderId: bundle.productionOrderId
    });

    // Check overall order progression
    if (bundle.productionOrderId) {
      const allBundles = await prisma.bundle.findMany({
        where: { productionOrderId: bundle.productionOrderId }
      });

      const allFinished = allBundles.every(b => b.status === 'COMPLETED' || b.status === 'QC_COMPLETED');
      if (allFinished) {
        await prisma.productionTask.updateMany({
          where: { productionOrderId: bundle.productionOrderId },
          data: { status: 'COMPLETED' }
        });
        await prisma.productionOrder.update({
          where: { id: bundle.productionOrderId },
          data: { status: 'QC' as any }
        });
        await this.writeActivity('SYSTEM', 'ORDER_QC', `All Bundles Finished. Order ${bundle.productionOrder?.orderNumber || bundle.productionOrderId} Moved to QC`, {
          productionOrderId: bundle.productionOrderId
        });
      }
    }

    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, updatedBundle);
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_LIVEFLOOR_UPDATED, {});

    return {
      success: true,
      bundleId,
      bundleNumber: bundle.bundleNumber,
      status: nextStep.status,
      completedQuantity: nextStep.completedQty,
      totalQuantity: bundle.quantity,
      message: logMsg,
    };
  }

  /**
   * Reset Demo:
   * Resets workers to Absent, machines to Idle, bundles to CREATED, and clears activity logs.
   */
  async resetDemo(productionOrderId?: number) {
    inMemoryActivityLogs.length = 0;

    await prisma.machine.updateMany({
      data: { status: 'INACTIVE' },
    });

    if (productionOrderId) {
      await prisma.bundle.updateMany({
        where: { productionOrderId },
        data: {
          status: 'CREATED',
          completedQuantity: 0,
          currentMachineId: null,
          currentWorkerId: null,
        },
      });
    } else {
      await prisma.bundle.updateMany({
        data: {
          status: 'CREATED',
          completedQuantity: 0,
          currentMachineId: null,
          currentWorkerId: null,
        },
      });
    }

    const activeWorkers = await prisma.worker.findMany({
      where: { status: 'ACTIVE' },
      take: 100,
    });

    const now = new Date();
    for (const worker of activeWorkers) {
      try {
        await prisma.attendance.create({
          data: {
            workerId: worker.id,
            assignmentId: 1,
            terminalId: 1,
            machineId: 1,
            shiftId: 1,
            attendanceType: 'OUT',
            tapTime: now,
          },
        });
      } catch (e) {
        // ignore fallback errors
      }
    }

    const logMsg = 'Order Demo Environment Reset: Workers set to Absent, machines to Idle, bundles to Allocated.';
    await this.writeActivity('SYSTEM', 'DEMO_RESET', logMsg);

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
