import { LiveFactoryRepository } from '../repository/live-factory.repository';

// Row label map: rowIndex → letter
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export class LiveFactoryService {
  private repo = new LiveFactoryRepository();

  async getSnapshot() {
    const floors = await this.repo.getSnapshot();

    // Transform raw DB data into the drill-down snapshot shape
    const result = floors.map((floor) => {
      const rooms = floor.rooms.map((room) => {
        // Group machines by rowIndex
        const rowMap = new Map<number, typeof room.machines>();
        for (const machine of room.machines) {
          const rIdx = machine.rowIndex ?? 0;
          if (!rowMap.has(rIdx)) rowMap.set(rIdx, []);
          rowMap.get(rIdx)!.push(machine);
        }

        const rows = Array.from(rowMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([rowIdx, machines]) => {
            const rowLabel = ROW_LABELS[rowIdx] ?? `R${rowIdx}`;
            return {
              id: `row-${room.id}-${rowIdx}`,
              name: `Row ${rowLabel}`,
              label: rowLabel,
              sortOrder: rowIdx,
              machineCount: machines.length,
              machines: machines.map((m) => {
                const posIdx = m.positionIndex ?? 0;
                const machineLabel = `${rowLabel}${posIdx}`;
                const side: 'top' | 'bottom' = posIdx % 2 === 0 ? 'top' : 'bottom';

                const activeAssignment = m.assignments[0] ?? null;
                const latestEvent = m.statusEvents[0] ?? null;

                // Derive status: event > assignment > default
                let status = 'no_worker';
                if (latestEvent && latestEvent.resolvedAt === null) {
                  const s = latestEvent.status.toLowerCase();
                  status = s;
                } else if (activeAssignment) {
                  status = 'running';
                } else {
                  status = 'no_worker';
                }

                const durationMs = latestEvent
                  ? Date.now() - new Date(latestEvent.changedAt).getTime()
                  : null;

                return {
                  id: String(m.id),
                  machineCode: m.machineCode,
                  machineName: m.machineName,
                  machineLabel,  // e.g. "A14"
                  side,
                  positionIndex: posIdx,
                  status,
                  machineType: m.machineType?.name ?? 'Unknown',
                  worker: activeAssignment?.worker
                    ? {
                        id: activeAssignment.worker.id,
                        name: `${activeAssignment.worker.firstName} ${activeAssignment.worker.lastName}`,
                        employeeCode: activeAssignment.worker.employeeCode,
                      }
                    : null,
                  operation: activeAssignment?.operation?.operationName ?? null,
                  shift: activeAssignment?.shift?.shiftName ?? null,
                  currentEvent: latestEvent
                    ? {
                        status: latestEvent.status,
                        reasonCode: latestEvent.reasonCode?.code ?? null,
                        reasonLabel: latestEvent.reasonCode?.label ?? null,
                        reasonIcon: latestEvent.reasonCode?.iconName ?? null,
                        note: latestEvent.note,
                        changedAt: latestEvent.changedAt,
                        durationMs,
                        isSystemGenerated: latestEvent.isSystemGenerated,
                      }
                    : null,
                };
              }),
            };
          });

        const machineCount = room.machines.length;
        const runningCount = rows
          .flatMap((r) => r.machines)
          .filter((m) => m.status === 'running').length;

        return {
          id: `room-${room.id}`,
          dbId: room.id,
          name: room.name,
          roomType: room.roomType ?? 'stitching',
          rowCount: rows.length,
          machineCount,
          runningCount,
          utilizationPct: machineCount > 0 ? Math.round((runningCount / machineCount) * 100) : 0,
          rows,
        };
      });

      return {
        id: `floor-${floor.id}`,
        dbId: floor.id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        roomCount: rooms.length,
        machineCount: rooms.reduce((s, r) => s + r.machineCount, 0),
        rooms,
      };
    });

    return { floors: result };
  }

  async getRecentTickerEvents(limit = 10) {
    return this.repo.getRecentEvents(limit);
  }

  async setMachineStatus(data: {
    machineId: number;
    status: string;
    reasonCodeId?: number;
    note?: string;
    reportedBy?: number;
    isSystemGenerated?: boolean;
  }) {
    return this.repo.createStatusEvent(data);
  }

  async seedReasonCodes() {
    return this.repo.seedReasonCodes();
  }
}
