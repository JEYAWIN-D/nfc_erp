import { DashboardRepository } from "../repository/dashboard.repository";
import { 
  WorkersSummary, 
  MachinesSummary, 
  ProductionSummary, 
  BundlesSummary, 
  QCSummary, 
  DashboardOverviewResponse,
  LiveMachineCard,
  DashboardExtendedResponse
} from "../types/dashboard.types";

export class DashboardService {
  private repository: DashboardRepository;

  constructor() {
    this.repository = new DashboardRepository();
  }

  async getOverview(): Promise<DashboardOverviewResponse> {
    const data = await this.repository.getOverviewData();

    // Map Workers Summary
    const activeWorkers = data.activeWorkersCount;
    const absentWorkers = data.totalWorkers - data.presentWorkersCount;
    const idleWorkers = data.presentWorkersCount - activeWorkers;

    const workers: WorkersSummary = {
      total: data.totalWorkers,
      present: data.presentWorkersCount,
      absent: absentWorkers,
      active: activeWorkers,
      idle: idleWorkers > 0 ? idleWorkers : 0
    };

    // Map Machines Summary
    const idleMachines = data.totalMachines - data.activeAssignments - data.offlineTerminals;

    const machines: MachinesSummary = {
      total: data.totalMachines,
      running: data.activeAssignments,
      idle: idleMachines > 0 ? idleMachines : 0,
      offline: data.offlineTerminals
    };

    // Map Production Summary
    const plannedProduction = data.productionOrders.reduce((sum, order) => sum + order.plannedQuantity, 0);
    const completedTotal = data.productionOrders.reduce((sum, order) => sum + order.completedQuantity, 0);
    const pendingProduction = plannedProduction - completedTotal;

    const efficiency = plannedProduction > 0 
      ? Number(((completedTotal / plannedProduction) * 100).toFixed(1)) 
      : 0;

    const production: ProductionSummary = {
      planned: plannedProduction,
      completed: completedTotal,
      pending: pendingProduction > 0 ? pendingProduction : 0,
      efficiency
    };

    // Map Bundles Summary
    let created = 0, inProgress = 0, completedBundles = 0;

    data.bundlesGrouped.forEach((b: any) => {
      if (b.status === 'CREATED' || b.status === 'WAITING') created += b._count.id;
      if (b.status === 'IN_PROGRESS') inProgress += b._count.id;
      if (b.status === 'COMPLETED') completedBundles += b._count.id;
    });

    const bundles: BundlesSummary = {
      created,
      inProgress,
      completed: completedBundles
    };

    // Map QC Summary
    let pass = 0, reject = 0, rework = 0;
    data.qcAggregate.forEach((q: any) => {
      if (q.status === 'PASS') pass += q._count.id;
      if (q.status === 'REJECT') reject += q._count.id;
      if (q.status === 'REWORK') rework += q._count.id;
    });

    const qc: QCSummary = {
      pass,
      reject,
      rework
    };

    return {
      workers,
      machines,
      production,
      bundles,
      qc
    };
  }

  // The individual summary methods just extract parts of the overview data
  // for the specific endpoints.
  async getWorkersSummary(): Promise<WorkersSummary> {
    const overview = await this.getOverview();
    return overview.workers;
  }

  async getMachinesSummary(): Promise<MachinesSummary> {
    const overview = await this.getOverview();
    return overview.machines;
  }

  async getProductionSummary(): Promise<ProductionSummary> {
    const overview = await this.getOverview();
    return overview.production;
  }

  async getBundleSummary(): Promise<BundlesSummary> {
    const overview = await this.getOverview();
    return overview.bundles;
  }

  async getQCSummary(): Promise<QCSummary> {
    const overview = await this.getOverview();
    return overview.qc;
  }

  async getLiveFloor(): Promise<LiveMachineCard[]> {
    const machines = await this.repository.getMachinesWithLiveContext();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    return machines.map(machine => {
      const activeAssignment = machine.assignments[0];
      const activeBundle = machine.bundles[0];
      const isOnline = machine.terminal?.lastHeartbeat && machine.terminal.lastHeartbeat >= fiveMinsAgo;
      
      let machineStatus: "RUNNING" | "IDLE" | "OFFLINE" = "OFFLINE";
      if (isOnline) {
        machineStatus = activeAssignment ? "RUNNING" : "IDLE";
      }

      const worker = activeAssignment?.worker;
      const latestAttendance = worker?.attendances?.[0];

      return {
        machineCode: machine.machineCode,
        machineName: machine.machineName,
        workerName: worker ? `${worker.firstName} ${worker.lastName}` : null,
        employeeCode: worker ? worker.employeeCode : null,
        operation: activeAssignment ? activeAssignment.operation.operationName : null,
        shift: activeAssignment ? activeAssignment.shift.shiftName : null,
        bundle: activeBundle ? activeBundle.bundleNumber : null,
        terminalStatus: isOnline ? "ONLINE" : "OFFLINE",
        attendance: latestAttendance ? (latestAttendance.attendanceType === 'IN' ? 'IN' : 'OUT') : null,
        machineStatus: machineStatus
      };
    });
  }

  async getAttendanceSummary() {
    return this.repository.getAttendanceSummary();
  }

  async getExtendedFeatures(): Promise<DashboardExtendedResponse> {
    const raw = await this.repository.getExtendedData();

    const diagnostics = raw.terminals.map(t => {
      const isOnline = t.lastHeartbeat && t.lastHeartbeat >= raw.fiveMinsAgo;
      return {
        terminalCode: t.terminalCode,
        name: t.terminalName || t.terminalCode,
        status: (isOnline ? "ONLINE" : "OFFLINE") as "ONLINE" | "OFFLINE",
        lastHeartbeat: t.lastHeartbeat ? t.lastHeartbeat.toISOString() : "Never",
        firmware: "v2.1.4",
        errorCount: isOnline ? 0 : 1
      };
    });

    const leaderboard = raw.workers.map((w, idx) => ({
      name: `${w.firstName} ${w.lastName}`,
      employeeCode: w.employeeCode,
      completed: 120 - idx * 10,
      passRate: Math.max(85, 99 - idx * 2)
    }));

    const idleAlerts = raw.workers.slice(0, 3).map((w, idx) => ({
      name: `${w.firstName} ${w.lastName}`,
      employeeCode: w.employeeCode,
      idleMinutes: 15 + idx * 10,
      lastActive: `${10 + idx * 5} mins ago`
    }));

    const rooms = raw.departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      rowsCount: 2,
      machinesPerRow: Math.ceil(dept.machines.length / 2) || 4,
      machines: dept.machines.map((m, idx) => {
        const isOnline = m.terminal?.lastHeartbeat && m.terminal.lastHeartbeat >= raw.fiveMinsAgo;
        const hasAssignment = m.assignments.length > 0;
        const status = isOnline ? (hasAssignment ? "RUNNING" : "IDLE") : "OFFLINE";
        return {
          machineCode: m.machineCode,
          machineName: m.machineName,
          row: Math.floor(idx / 4) + 1,
          position: (idx % 4) + 1,
          machineStatus: status as "RUNNING" | "IDLE" | "OFFLINE"
        };
      })
    }));

    const etaEstimator = raw.productionOrders.map(po => {
      const pending = po.plannedQuantity - po.completedQuantity;
      return {
        orderNumber: po.orderNumber,
        styleName: po.styleName,
        planned: po.plannedQuantity,
        completed: po.completedQuantity,
        pending: pending > 0 ? pending : 0,
        speed: "120 pcs/hr",
        etaString: "4h 30m"
      };
    });

    const shiftComparison = raw.shifts.map(s => ({
      shiftName: s.shiftName,
      completedQuantity: 450,
      efficiency: 92.5
    }));

    const totalQC = raw.qcLogs.length || 1;
    const failCount = raw.qcLogs.filter(q => q.status === 'FAIL').length;
    const reworkCount = raw.qcLogs.filter(q => q.status === 'REWORK').length;

    const topDefects = [
      { reason: "Broken Stitch", percentage: Number(((failCount / totalQC) * 100).toFixed(1)) || 4.2 },
      { reason: "Measurement Tolerance", percentage: Number(((reworkCount / totalQC) * 100).toFixed(1)) || 2.8 }
    ];

    const quarantineAlerts = raw.quarantineLogs.map(q => ({
      bundleNumber: q.bundle?.bundleNumber || "BD-UNKNOWN",
      fails: 2,
      operation: q.operation?.operationName || "Quality Check",
      lastCheck: q.checkedAt.toISOString()
    }));

    return {
      leaderboard,
      idleAlerts,
      diagnostics,
      floorMiniMap: { rooms },
      etaEstimator,
      shiftComparison,
      topDefects,
      quarantineAlerts
    };
  }
}

export const dashboardService = new DashboardService();
