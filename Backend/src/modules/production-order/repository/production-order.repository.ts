import prisma from "../../../config/prisma";
import { Prisma, OrderStatus } from "@prisma/client";

export class ProductionOrderRepository {
  async create(data: Prisma.ProductionOrderCreateInput) {
    return prisma.productionOrder.create({ data });
  }

  async findAll() {
    const orders = await prisma.productionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bundles: {
          select: { completedQuantity: true }
        },
        productionTasks: {
          select: { 
            workerId: true, 
            machineId: true,
            worker: { select: { firstName: true, lastName: true, employeeCode: true } },
            machine: { select: { machineName: true, machineCode: true } }
          }
        },
        _count: {
          select: { bundles: true }
        }
      }
    });

    return orders.map(order => {
      const bundleCompleted = order.bundles && order.bundles.length > 0
        ? order.bundles.reduce((acc, b) => acc + (b.completedQuantity || 0), 0)
        : order.completedQuantity;

      return {
        ...order,
        completedQuantity: bundleCompleted
      };
    });
  }

  async findById(id: number) {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: { 
        bundles: true,
        productionTasks: {
          select: { 
            workerId: true, 
            machineId: true,
            worker: { select: { firstName: true, lastName: true, employeeCode: true } },
            machine: { select: { machineName: true, machineCode: true } }
          }
        },
        _count: {
          select: { bundles: true }
        }
      }
    });

    if (!order) return null;

    const bundleCompleted = order.bundles && order.bundles.length > 0
      ? order.bundles.reduce((acc, b) => acc + (b.completedQuantity || 0), 0)
      : order.completedQuantity;

    return {
      ...order,
      completedQuantity: bundleCompleted
    };
  }

  async findByOrderNumber(orderNumber: string) {
    return prisma.productionOrder.findUnique({
      where: { orderNumber }
    });
  }

  async update(id: number, data: Prisma.ProductionOrderUpdateInput) {
    return prisma.productionOrder.update({
      where: { id },
      data
    });
  }

  async changeStatus(id: number, status: OrderStatus) {
    return prisma.productionOrder.update({
      where: { id },
      data: { status }
    });
  }

  async delete(id: number) {
    // Cascading delete associated production tasks, stage logs, tags, qc logs, bundles, and order
    await prisma.productionTask.deleteMany({ where: { productionOrderId: id } });
    await prisma.bundleStageLog.deleteMany({ where: { bundle: { productionOrderId: id } } });
    await prisma.bundleTagAssignment.deleteMany({ where: { bundle: { productionOrderId: id } } });
    await prisma.qCCheckLog.deleteMany({ where: { bundle: { productionOrderId: id } } });
    await prisma.bundle.deleteMany({ where: { productionOrderId: id } });
    return prisma.productionOrder.delete({ where: { id } });
  }
}
