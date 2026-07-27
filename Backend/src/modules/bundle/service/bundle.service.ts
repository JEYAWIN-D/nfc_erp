import { BundleRepository } from "../repository/bundle.repository";
import prisma from "../../../config/prisma";
import { BundleStatus } from "@prisma/client";
import { websocketService, WEBSOCKET_EVENTS } from "../../websocket";
import { BundleRules } from "../shared/bundle-rules";

export class BundleService {
  private repository: BundleRepository;

  constructor() {
    this.repository = new BundleRepository();
  }

  async create(data: { bundleNumber: string, productionOrderId: number, quantity: number }) {
    const existing = await this.repository.findByBundleNumber(data.bundleNumber);
    if (existing) {
      throw new Error(`Bundle with bundle number ${data.bundleNumber} already exists`);
    }

    const order = await prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: { bundles: true }
    });
    
    if (!order) {
      throw new Error("Production order not found");
    }

    const currentTotalQuantity = order.bundles.reduce((acc, bundle) => acc + bundle.quantity, 0);
    if (currentTotalQuantity + data.quantity > order.plannedQuantity) {
      throw new Error("Total bundle quantity cannot exceed production order planned quantity");
    }

    const bundle = await this.repository.create({
      bundleNumber: data.bundleNumber,
      productionOrderId: data.productionOrderId,
      quantity: data.quantity,
    });
    
    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_CREATED, bundle);
    return bundle;
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: number) {
    const bundle = await this.repository.findById(id);
    if (!bundle) {
      throw new Error("Bundle not found");
    }
    return bundle;
  }

  async update(id: number, data: any) {
    const bundle = await this.findById(id);

    BundleRules.validateUnassignment(bundle.status, data);

    if (data.currentWorkerId) {
      const worker = await prisma.worker.findUnique({ where: { id: data.currentWorkerId } });
      if (!worker) throw new Error("Worker not found");
    }
    if (data.currentMachineId) {
      const machine = await prisma.machine.findUnique({ where: { id: data.currentMachineId } });
      if (!machine) throw new Error("Machine not found");
    }
    if (data.currentOperationId) {
      const operation = await prisma.operation.findUnique({ where: { id: data.currentOperationId } });
      if (!operation) throw new Error("Operation not found");
    }

    const updated = await this.repository.update(id, data);
    websocketService.publish(WEBSOCKET_EVENTS.BUNDLE_UPDATED, updated);
    return updated;
  }

  async changeStatus(id: number, status: BundleStatus) {
    const bundle = await this.findById(id);

    if (status === BundleStatus.IN_PROGRESS) {
      await BundleRules.validateInProgressTransition(
        id,
        bundle.productionOrderId,
        bundle.currentWorkerId,
        bundle.currentMachineId
      );
    }

    const updated = await this.repository.changeStatus(id, status);
    
    let eventName = WEBSOCKET_EVENTS.BUNDLE_UPDATED;
    if (status === BundleStatus.IN_PROGRESS) eventName = WEBSOCKET_EVENTS.BUNDLE_STARTED;
    if (status === BundleStatus.COMPLETED) eventName = WEBSOCKET_EVENTS.BUNDLE_COMPLETED;
    
    websocketService.publish(eventName, updated);
    return updated;
  }
}
