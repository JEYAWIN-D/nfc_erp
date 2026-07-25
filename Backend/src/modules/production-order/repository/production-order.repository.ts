import prisma from "../../../config/prisma";
import { Prisma, OrderStatus } from "@prisma/client";

export class ProductionOrderRepository {
  async create(data: Prisma.ProductionOrderCreateInput) {
    return prisma.productionOrder.create({ data });
  }

  async findAll() {
    return prisma.productionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
  }

  async findById(id: number) {
    return prisma.productionOrder.findUnique({
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
