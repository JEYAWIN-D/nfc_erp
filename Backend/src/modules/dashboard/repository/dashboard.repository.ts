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

    // 1. Get all attendances today to determine truly present workers
    const todaysAttendances = await prisma.attendance.findMany({
      where: { tapTime: { gte: startOfToday } },
      orderBy: { tapTime: 'desc' },
      select: { workerId: true, attendanceType: true }
    });
    
    const latestTapByWorker = new Map<number, string>();
    for (const a of todaysAttendances) {
      if (!latestTapByWorker.has(a.workerId)) {
        latestTapByWorker.set(a.workerId, a.attendanceType);
      }
    }
    
    const presentWorkerIds = Array.from(latestTapByWorker.entries())
      .filter(([_, type]) => type === 'IN')
      .map(([id, _]) => id);

    // 2. Query the rest of the metrics
    const [
      totalWorkers,
      activeWorkersCount,
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
      prisma.assignment.count({ 
        where: { 
          status: 'ACTIVE',
          workerId: { in: presentWorkerIds }
        } 
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
      prisma.qCCheckLog.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { checkedAt: { gte: startOfToday } },
        orderBy: { status: 'asc' }
      })
    ]);

    return {
      totalWorkers,
      presentWorkersCount: presentWorkerIds.length,
      activeWorkersCount,
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

  async getExtendedData() {
    const startOfToday = this.getStartOfToday();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      terminals,
      workers,
      productionOrders,
      departments,
      shifts,
      qcLogs,
      quarantineLogs
    ] = await Promise.all([
      prisma.terminal.findMany({
        orderBy: { terminalCode: 'asc' }
      }),
      prisma.worker.findMany({
        where: { status: 'ACTIVE' },
        take: 10
      }),
      prisma.productionOrder.findMany({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
        take: 5
      }),
      prisma.department.findMany({
        include: {
          machines: {
            where: { status: 'ACTIVE' },
            include: { terminal: true, assignments: { where: { status: 'ACTIVE' } } }
          }
        }
      }),
      prisma.shift.findMany({
        where: { status: 'ACTIVE' }
      }),
      prisma.qCCheckLog.findMany({
        where: { checkedAt: { gte: startOfToday } },
        select: { status: true, defectNotes: true }
      }),
      prisma.qCCheckLog.findMany({
        where: { status: 'FAIL' },
        include: { bundle: true, operation: true },
        take: 5,
        orderBy: { checkedAt: 'desc' }
      })
    ]);

    return {
      terminals,
      workers,
      productionOrders,
      departments,
      shifts,
      qcLogs,
      quarantineLogs,
      fiveMinsAgo
    };
  }
}
