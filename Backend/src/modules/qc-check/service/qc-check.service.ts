import { QCCheckRepository } from '../repository/qc-check.repository';
import { CreateQCCheckDTO } from '../dto/qc-check.dto';
import prisma from '../../../config/prisma';
import { QCTier, QCCheckStatus } from '@prisma/client';

const repo = new QCCheckRepository();

export class QCCheckService {
  async getAll(filters?: { bundleId?: number; qcTier?: QCTier; status?: QCCheckStatus }) {
    return repo.findAll(filters);
  }

  async getById(id: number) {
    const check = await repo.findById(id);
    if (!check) throw new Error('QC check not found');
    return check;
  }

  async getByBundle(bundleId: number) {
    return repo.findByBundle(bundleId);
  }

  async getAccountabilityTrail(bundleId: number) {
    return repo.getAccountabilityTrail(bundleId);
  }

  async scanTagForQC(tagCode: string, qcPersonCardId: string) {
    const qcPerson = await prisma.worker.findUnique({ where: { nfcCardId: qcPersonCardId } });
    if (!qcPerson) throw new Error("QC Inspector ID card not recognized");

    const tag = await prisma.bundleTagAssignment.findUnique({
      where: { tagCode },
      include: { bundle: { include: { productionOrder: true } } }
    });
    
    if (!tag || !tag.bundle) throw new Error("Invalid Tag or Tag not assigned to an active bundle");
    
    const trail = await this.getAccountabilityTrail(tag.bundle.id);
    
    return {
      qcPerson: { id: qcPerson.id, name: qcPerson.firstName },
      bundle: tag.bundle,
      tag: { id: tag.id, tagCode: tag.tagCode },
      accountabilityTrail: trail
    };
  }

  async create(dto: CreateQCCheckDTO) {
    return prisma.$transaction(async (tx) => {
      const [bundle, qcPerson] = await Promise.all([
        tx.bundle.findUnique({ where: { id: dto.bundleId } }),
        tx.worker.findUnique({ where: { id: dto.qcPersonId } }),
      ]);
      if (!bundle) throw new Error('Bundle not found');
      if (!qcPerson) throw new Error('QC person (worker) not found');

      // Idempotency guard for double-counting
      if (dto.qcTier === 'FINAL_QC' && dto.status === 'PASS' && bundle.status === 'QC_COMPLETED') {
        throw new Error('Bundle already QC completed — duplicate scan ignored');
      }

      if (dto.operationId) {
        const op = await tx.operation.findUnique({ where: { id: dto.operationId } });
        if (!op) throw new Error('Operation not found');
      }
      if (dto.workerId) {
        const w = await tx.worker.findUnique({ where: { id: dto.workerId } });
        if (!w) throw new Error('Worker being audited not found');
      }

      const check = await tx.qCCheckLog.create({
        data: {
          bundleId: dto.bundleId,
          tagId: dto.tagId,
          qcPersonId: dto.qcPersonId,
          qcTier: dto.qcTier as QCTier,
          operationId: dto.operationId,
          workerId: dto.workerId,
          status: dto.status as QCCheckStatus,
          passQuantity: dto.passQuantity,
          rejectQuantity: dto.rejectQuantity,
          reworkQuantity: dto.reworkQuantity,
          defectNotes: dto.defectNotes,
        },
        include: {
          bundle: { include: { productionOrder: true } },
          tag: true,
          qcPerson: true,
          operation: true,
          worker: true,
        }
      });

      // If final QC passed, mark bundle as QC_COMPLETED and auto-release the tag
      if (dto.qcTier === 'FINAL_QC' && dto.status === 'PASS') {
        await tx.bundle.update({ 
          where: { id: dto.bundleId }, 
          data: { 
            status: 'QC_COMPLETED',
            completedQuantity: { increment: dto.passQuantity || bundle.quantity }
          } 
        });
        
        if (dto.tagId) {
          await tx.bundleTagAssignment.update({
            where: { id: dto.tagId },
            data: {
              bundleId: null,
              status: 'AVAILABLE',
              releasedAt: new Date()
            }
          });
        }

        // Roll up completed quantity to production order
        const passQty = dto.passQuantity || bundle.quantity;
        const order = await tx.productionOrder.update({
          where: { id: bundle.productionOrderId },
          data: { completedQuantity: { increment: passQty } }
        });

        // Complete order if target is reached
        if (order.completedQuantity >= order.plannedQuantity) {
          await tx.productionOrder.update({ 
            where: { id: order.id }, 
            data: { status: 'COMPLETED' } 
          });
        }
      } else if (dto.status === 'REWORK' || dto.status === 'FAIL') {
        await tx.bundle.update({
          where: { id: dto.bundleId },
          data: { status: 'REWORK' }
        });
      }

      return check;
    });
  }
}
