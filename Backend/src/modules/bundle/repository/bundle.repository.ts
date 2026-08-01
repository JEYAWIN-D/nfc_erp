import prisma from "../../../config/prisma";
import { Prisma, BundleStatus } from "@prisma/client";

export class BundleRepository {
  async create(data: Prisma.BundleUncheckedCreateInput) {
    return prisma.bundle.create({ data });
  }

  async findAll() {
    return prisma.bundle.findMany({
      include: {
        productionOrder: true,
        currentOperation: true,
        currentMachine: { include: { department: true, terminal: true } },
        currentWorker: { include: { department: true } },
        stageLogs: {
          orderBy: { inTime: 'asc' },
          include: { operation: true, operator: true }
        },
        tagAssignments: {
          where: { status: 'ASSIGNED' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: number) {
    return prisma.bundle.findUnique({
      where: { id },
      include: {
        productionOrder: true,
        currentOperation: true,
        currentMachine: { include: { department: true, terminal: true } },
        currentWorker: { include: { department: true } },
        stageLogs: {
          orderBy: { inTime: 'asc' },
          include: { operation: true, operator: true }
        },
        tagAssignments: {
          where: { status: 'ASSIGNED' }
        }
      }
    });
  }

  async findByBundleNumber(bundleNumber: string) {
    return prisma.bundle.findUnique({
      where: { bundleNumber }
    });
  }

  async update(id: number, data: Prisma.BundleUncheckedUpdateInput) {
    return prisma.bundle.update({
      where: { id },
      data,
      include: {
        productionOrder: true,
        currentOperation: true,
        currentMachine: { include: { department: true, terminal: true } },
        currentWorker: { include: { department: true } },
        stageLogs: {
          orderBy: { inTime: 'asc' },
          include: { operation: true, operator: true }
        },
        tagAssignments: {
          where: { status: 'ASSIGNED' }
        }
      }
    });
  }

  async changeStatus(id: number, status: BundleStatus) {
    return prisma.bundle.update({
      where: { id },
      data: { status },
      include: {
        productionOrder: true,
        currentOperation: true,
        currentMachine: { include: { department: true, terminal: true } },
        currentWorker: { include: { department: true } },
        stageLogs: {
          orderBy: { inTime: 'asc' },
          include: { operation: true, operator: true }
        },
        tagAssignments: {
          where: { status: 'ASSIGNED' }
        }
      }
    });
  }
}
