import prisma from "../../../config/prisma";
import { BundleStatus } from "@prisma/client";

export class BundleRules {
  /**
   * Validates if a bundle can be transitioned to IN_PROGRESS status.
   * Checks for sequential gating (only 1 in-progress bundle per order) and
   * enforces worker & machine assignment prior to starting.
   */
  static async validateInProgressTransition(
    bundleId: number,
    productionOrderId: number,
    workerId?: number | null,
    machineId?: number | null
  ) {
    // 1. Sequential Gating Check: Only one bundle IN_PROGRESS per order at a time
    const activeBundle = await prisma.bundle.findFirst({
      where: {
        productionOrderId,
        status: BundleStatus.IN_PROGRESS,
        id: { not: bundleId },
      },
    });

    if (activeBundle) {
      throw new Error(
        `Cannot start this bundle — bundle ${activeBundle.bundleNumber} is already in progress for this order.`
      );
    }

    // 2. Must have a worker and machine assigned before starting
    if (!workerId || !machineId) {
      throw new Error(
        `Cannot mark bundle as IN_PROGRESS — assign a worker and machine first.`
      );
    }
  }

  /**
   * Validates if worker or machine can be unassigned from a bundle while in progress.
   */
  static validateUnassignment(
    bundleStatus: BundleStatus,
    data: { currentWorkerId?: number | null; currentMachineId?: number | null }
  ) {
    if (bundleStatus === BundleStatus.IN_PROGRESS) {
      if (data.currentWorkerId === null || data.currentMachineId === null) {
        throw new Error("Cannot unassign worker/machine while bundle is IN_PROGRESS.");
      }
    }
  }
}
