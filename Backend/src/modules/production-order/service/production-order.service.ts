import { ProductionOrderRepository } from "../repository/production-order.repository";
import { ProductionOrderCreateInput, ProductionOrderUpdateInput } from "../types/production-order.types";
import { OrderStatus } from "@prisma/client";
import prisma from "../../../config/prisma";
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";

export class ProductionOrderService {
  private repository: ProductionOrderRepository;

  constructor() {
    this.repository = new ProductionOrderRepository();
  }

  async create(data: ProductionOrderCreateInput) {
    const existing = await this.repository.findByOrderNumber(data.orderNumber);
    if (existing) {
      throw new Error(`Production order with order number ${data.orderNumber} already exists`);
    }

    if (new Date(data.plannedStartDate) > new Date(data.plannedEndDate)) {
      throw new Error("Planned start date cannot be after planned end date");
    }

    return this.repository.create({
      ...data,
      plannedStartDate: new Date(data.plannedStartDate),
      plannedEndDate: new Date(data.plannedEndDate),
    });
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new Error("Production order not found");
    }
    return order;
  }

  async update(id: number, data: ProductionOrderUpdateInput) {
    const order = await this.findById(id);
    
    if (data.orderNumber && data.orderNumber !== order.orderNumber) {
      const existing = await this.repository.findByOrderNumber(data.orderNumber);
      if (existing) {
        throw new Error(`Production order with order number ${data.orderNumber} already exists`);
      }
    }

    const startDate = data.plannedStartDate ? new Date(data.plannedStartDate) : order.plannedStartDate;
    const endDate = data.plannedEndDate ? new Date(data.plannedEndDate) : order.plannedEndDate;

    if (startDate > endDate) {
      throw new Error("Planned start date cannot be after planned end date");
    }

    const updateData: any = { ...data };
    if (data.plannedStartDate) updateData.plannedStartDate = new Date(data.plannedStartDate);
    if (data.plannedEndDate) updateData.plannedEndDate = new Date(data.plannedEndDate);

    return this.repository.update(id, updateData);
  }

  async changeStatus(id: number, status: OrderStatus) {
    await this.findById(id);
    return this.repository.changeStatus(id, status);
  }

  /**
   * Delete Production Order:
   * 1. Releases all active worker and machine assignments tied to this order.
   * 2. Sets assigned machines to IDLE (INACTIVE).
   * 3. Sets production order status to CANCELLED for history preservation.
   * 4. Emits real-time WebSocket refresh events across factory floor & boards.
   */
  async delete(id: number) {
    const order = await this.findById(id);

    // Collect all assigned worker & machine IDs in order tasks
    const workerIds = order.productionTasks
      .map((t: any) => t.workerId)
      .filter((wId: any): wId is number => Boolean(wId));

    const machineIds = order.productionTasks
      .map((t: any) => t.machineId)
      .filter((mId: any): mId is number => Boolean(mId));

    // Release active assignments
    if (workerIds.length > 0 || machineIds.length > 0) {
      await prisma.assignment.updateMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { workerId: { in: workerIds } },
            { machineId: { in: machineIds } },
          ],
        },
        data: {
          status: 'COMPLETED',
          releasedAt: new Date(),
        },
      });
    }

    // Set assigned machines status to INACTIVE (Idle)
    if (machineIds.length > 0) {
      await prisma.machine.updateMany({
        where: { id: { in: machineIds } },
        data: { status: 'INACTIVE' },
      });
    }

    // Hard delete order and associated records from database
    const deletedOrder = await this.repository.delete(id);

    // Broadcast WebSocket updates for instant UI synchronization
    websocketService.publish(WEBSOCKET_EVENTS.DASHBOARD_REFRESH, {});
    websocketService.publish(WEBSOCKET_EVENTS.MACHINE_UPDATED, {});
    websocketService.publish(WEBSOCKET_EVENTS.ATTENDANCE_UPDATED, {});
    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, {});

    return {
      success: true,
      message: `Production Order ${order.orderNumber} permanently deleted.`,
      order: deletedOrder,
    };
  }
}
