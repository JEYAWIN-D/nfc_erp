import { DashboardRepository } from "../repository/dashboard.repository";
import { 
  WorkersSummary, 
  MachinesSummary, 
  ProductionSummary, 
  BundlesSummary, 
  QCSummary, 
  DashboardOverviewResponse,
  LiveMachineCard
} from "../types/dashboard.types";

export class DashboardService {
  private repository: DashboardRepository;

  constructor() {
    this.repository = new DashboardRepository();
  }

  async getOverview(): Promise<DashboardOverviewResponse> {
    const data = await this.repository.getOverviewData();

    // Map Workers Summary
    const activeWorkers = Math.min(data.activeAssignments, data.presentWorkersCount);
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
    let created = 0, inProgress = 0, completedBundles = 0, qcPending = 0;

    data.bundlesGrouped.forEach((b: any) => {
      if (b.status === 'CREATED' || b.status === 'WAITING') created += b._count.id;
      if (b.status === 'IN_PROGRESS') inProgress += b._count.id;
      if (b.status === 'COMPLETED') completedBundles += b._count.id;
    });

    const bundles: BundlesSummary = {
      created,
      inProgress,
      completed: completedBundles,
      qcPending: 0
    };

    // Map QC Summary
    const qc: QCSummary = {
      pass: data.qcAggregate._sum.passQuantity || 0,
      reject: data.qcAggregate._sum.rejectQuantity || 0,
      rework: data.qcAggregate._sum.reworkQuantity || 0
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
}

export const dashboardService = new DashboardService();
