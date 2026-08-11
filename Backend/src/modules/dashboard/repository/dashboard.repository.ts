import prisma from "../../../config/prisma";

export class DashboardRepository {
  private getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async getOverviewData() {
    const startOfToday = this.getStartOfToday();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalWorkers,
      presentWorkersRecords,
      activeAssignments,
      totalMachines,
      offlineTerminals,
      productionOrders,
      todaysTransactions,
      bundlesGrouped,
      qcAggregate
    ] = await prisma.$transaction([
      // Worker summary metrics
      prisma.worker.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.groupBy({
        by: ['workerId'],
        where: { tapTime: { gte: startOfToday } },
        orderBy: { workerId: 'asc' }
      }),
      // Shared active metrics (running machines = active assignments)
      prisma.assignment.count({ where: { status: 'ACTIVE' } }),
      
      // Machine summary metrics
      prisma.machine.count({ where: { status: 'ACTIVE' } }),
      prisma.terminal.count({
        where: {
          OR: [
            { lastHeartbeat: null },
            { lastHeartbeat: { lt: fiveMinsAgo } }
          ]
        }
      }),

      // Production summary metrics
      prisma.productionOrder.findMany({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } }
      }),
      prisma.bundleStageLog.count({
        where: { outTime: { gte: startOfToday } }
      }),

      // Bundle summary metrics
      prisma.bundle.groupBy({
        by: ['status'],
        _count: { id: true },
        orderBy: { status: 'asc' }
      }),

      // QC summary metrics
      prisma.qCCheckLog.aggregate({
        _sum: { passQuantity: true, rejectQuantity: true, reworkQuantity: true },
        where: { checkedAt: { gte: startOfToday } }
      })
    ]);

    return {
      totalWorkers,
      presentWorkersCount: presentWorkersRecords.length,
      activeAssignments,
      totalMachines,
      offlineTerminals,
      productionOrders,
      todaysCompletedQuantity: todaysTransactions,
      bundlesGrouped,
      qcAggregate
    };
  }

  async getMachinesWithLiveContext() {
    return prisma.machine.findMany({
      where: { status: 'ACTIVE' },
      include: {
        terminal: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            worker: {
              include: {
                attendances: {
                  where: { tapTime: { gte: this.getStartOfToday() } },
                  orderBy: { tapTime: 'desc' },
                  take: 1
                }
              }
            },
            operation: true,
            shift: true
          }
        },
        bundles: {
          where: { status: 'IN_PROGRESS' },
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { machineCode: 'asc' }
    });
  }

  async getAttendanceSummary() {
    const startOfToday = this.getStartOfToday();
    return prisma.attendance.findMany({
      where: { tapTime: { gte: startOfToday } },
      include: {
        worker: true,
        shift: true,
        machine: true
      },
      orderBy: { tapTime: 'desc' }
    });
  }
}
