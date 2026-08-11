import prisma from '../../../config/prisma';

export class LiveFactoryRepository {
  /**
   * Returns all floors with rooms, and each room's machines with
   * their latest status event, active assignment, and active bundle.
   */
  async getSnapshot() {
    const floors = await prisma.floor.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { floorNumber: 'asc' },
      include: {
        rooms: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' },
          include: {
            machines: {
              orderBy: [{ rowIndex: 'asc' }, { positionIndex: 'asc' }],
              include: {
                machineType: true,
                assignments: {
                  where: { status: 'ACTIVE' },
                  include: { worker: true, operation: true, shift: true },
                  take: 1,
                },
                statusEvents: {
                  orderBy: { changedAt: 'desc' },
                  take: 1,
                  include: { reasonCode: true },
                },
              },
            },
          },
        },
      },
    });

    return floors;
  }

  /** Returns the last N ticker events across the factory */
  async getRecentEvents(limit = 10) {
    return prisma.machineStatusEvent.findMany({
      orderBy: { changedAt: 'desc' },
      take: limit,
      include: {
        machine: true,
        reasonCode: true,
      },
    });
  }

  /** Insert a new status event for a machine */
  async createStatusEvent(data: {
    machineId: number;
    status: string;
    reasonCodeId?: number;
    note?: string;
    reportedBy?: number;
    isSystemGenerated?: boolean;
  }) {
    // Resolve any previous open event
    await prisma.machineStatusEvent.updateMany({
      where: { machineId: data.machineId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });

    return prisma.machineStatusEvent.create({ data });
  }

  /** Seed the default reason codes if they don't exist */
  async seedReasonCodes() {
    const codes = [
      { code: 'NO_OPERATOR', label: 'No Operator', appliesToStatus: 'Offline', iconName: 'UserX' },
      { code: 'MECH_FAULT', label: 'Mechanical Fault', appliesToStatus: 'Offline', iconName: 'Wrench' },
      { code: 'NO_MATERIAL', label: 'No Material', appliesToStatus: 'Idle', iconName: 'Package' },
      { code: 'CHANGEOVER', label: 'Style Changeover', appliesToStatus: 'Idle', iconName: 'RefreshCw' },
      { code: 'BREAK', label: 'Break', appliesToStatus: 'Idle', iconName: 'Coffee' },
      { code: 'QC_HOLD', label: 'QC Hold', appliesToStatus: 'Maintenance', iconName: 'ShieldAlert' },
    ];

    for (const c of codes) {
      await prisma.statusReasonCode.upsert({
        where: { code: c.code },
        update: {},
        create: c,
      });
    }
  }
}
