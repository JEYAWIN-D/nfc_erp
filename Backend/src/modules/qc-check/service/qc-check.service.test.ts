import { QCCheckService } from './qc-check.service';
import prisma from '../../../config/prisma';

jest.mock('../../../config/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn((callback) => callback(prisma)),
    bundle: { findUnique: jest.fn(), update: jest.fn() },
    worker: { findUnique: jest.fn() },
    qCCheckLog: { create: jest.fn() },
    bundleTagAssignment: { update: jest.fn() },
    productionOrder: { update: jest.fn() },
  },
}));

describe('QCCheckService', () => {
  let qcCheckService: QCCheckService;

  beforeEach(() => {
    qcCheckService = new QCCheckService();
    jest.clearAllMocks();
  });

  describe('create (FINAL_QC)', () => {
    const mockDto = {
      bundleId: 1,
      tagId: 2,
      qcPersonId: 3,
      qcTier: 'FINAL_QC',
      status: 'PASS',
      passQuantity: 50,
      rejectQuantity: 0,
      reworkQuantity: 0,
    };

    const baseBundle = { id: 1, status: 'COMPLETED', quantity: 50, productionOrderId: 10 };
    const baseWorker = { id: 3 };

    it('should throw an error for duplicate scan of a QC_COMPLETED bundle', async () => {
      (prisma.bundle.findUnique as jest.Mock).mockResolvedValue({ ...baseBundle, status: 'QC_COMPLETED' });
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);

      await expect(qcCheckService.create(mockDto as any))
        .rejects.toThrow('Bundle already QC completed — duplicate scan ignored');
    });

    it('should process a PASS and update bundle to QC_COMPLETED', async () => {
      (prisma.bundle.findUnique as jest.Mock).mockResolvedValue(baseBundle);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.qCCheckLog.create as jest.Mock).mockResolvedValue({ id: 100 });
      (prisma.productionOrder.update as jest.Mock).mockResolvedValue({ id: 10, completedQuantity: 50, plannedQuantity: 100 });

      await qcCheckService.create(mockDto as any);

      expect(prisma.bundle.update).toHaveBeenCalledWith({
        where: { id: mockDto.bundleId },
        data: { status: 'QC_COMPLETED', completedQuantity: { increment: 50 } }
      });
      expect(prisma.bundleTagAssignment.update).toHaveBeenCalledWith({
        where: { id: mockDto.tagId },
        data: expect.objectContaining({ bundleId: null, status: 'AVAILABLE' })
      });
      expect(prisma.productionOrder.update).toHaveBeenCalledWith({
        where: { id: baseBundle.productionOrderId },
        data: { completedQuantity: { increment: 50 } }
      });
    });

    it('should process a FAIL and update bundle to REWORK without order rollup', async () => {
      const failDto = { ...mockDto, status: 'FAIL', passQuantity: 0, rejectQuantity: 50 };
      (prisma.bundle.findUnique as jest.Mock).mockResolvedValue(baseBundle);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.qCCheckLog.create as jest.Mock).mockResolvedValue({ id: 100 });

      await qcCheckService.create(failDto as any);

      expect(prisma.bundle.update).toHaveBeenCalledWith({
        where: { id: failDto.bundleId },
        data: { status: 'REWORK' }
      });
      expect(prisma.productionOrder.update).not.toHaveBeenCalled();
    });

    it('should mark production order as COMPLETED if target reached', async () => {
      (prisma.bundle.findUnique as jest.Mock).mockResolvedValue(baseBundle);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.qCCheckLog.create as jest.Mock).mockResolvedValue({ id: 100 });
      // completedQuantity meets plannedQuantity
      (prisma.productionOrder.update as jest.Mock).mockResolvedValue({ id: 10, completedQuantity: 100, plannedQuantity: 100 });

      await qcCheckService.create(mockDto as any);

      expect(prisma.productionOrder.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'COMPLETED' }
      });
    });
  });
});
