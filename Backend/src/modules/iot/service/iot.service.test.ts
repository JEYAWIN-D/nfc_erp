import { IotService } from './iot.service';
import prisma from '../../../config/prisma';

jest.mock('../../../config/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn((callback) => callback(prisma)),
    bundleTagAssignment: { findUnique: jest.fn() },
    worker: { findUnique: jest.fn() },
    terminal: { findUnique: jest.fn() },
    assignment: { findFirst: jest.fn() },
    bundleStageLog: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    productionTask: { findFirst: jest.fn(), update: jest.fn() },
    bundle: { update: jest.fn() },
  },
}));

describe('IotService', () => {
  let iotService: IotService;

  beforeEach(() => {
    iotService = new IotService();
    jest.clearAllMocks();
  });

  describe('handleScan', () => {
    const mockTagCode = 'TAG-123';
    const mockWorkerCardId = 'W-456';
    const mockTerminalCode = 'T-789';

    const baseTag = { id: 1, status: 'ASSIGNED', bundleId: 10, bundle: { id: 10, productionOrderId: 20 } };
    const baseWorker = { id: 2, nfcCardId: mockWorkerCardId };
    const baseTerminal = { id: 3, machine: { id: 4, machineCode: 'M-1' } };
    const baseAssignment = { machineId: 4, workerId: 2, status: 'ACTIVE', operation: { id: 5, displayOrder: 1 } };

    it('should throw an error if tag is invalid', async () => {
      (prisma.bundleTagAssignment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(iotService.handleScan(mockTagCode, mockWorkerCardId, mockTerminalCode))
        .rejects.toThrow("Invalid tag or tag not assigned to an active bundle.");
    });

    it('should perform Scan In (create new log) if no open log exists', async () => {
      (prisma.bundleTagAssignment.findUnique as jest.Mock).mockResolvedValue(baseTag);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.terminal.findUnique as jest.Mock).mockResolvedValue(baseTerminal);
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);
      
      // No open log
      (prisma.bundleStageLog.findFirst as jest.Mock).mockResolvedValue(null);
      
      const createdLog = { id: 100 };
      (prisma.bundleStageLog.create as jest.Mock).mockResolvedValue(createdLog);

      const result = await iotService.handleScan(mockTagCode, mockWorkerCardId, mockTerminalCode);

      expect(prisma.bundleStageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bundleId: baseTag.bundle.id,
          tagId: baseTag.id,
          operationId: baseAssignment.operation.id,
          operatorId: baseWorker.id,
          inTime: expect.any(Date)
        })
      });
      expect(result).toMatchObject({ action: "SCAN_IN" });
    });

    it('should perform Scan Out and mark IN_PROGRESS if an open log exists (not final op)', async () => {
      (prisma.bundleTagAssignment.findUnique as jest.Mock).mockResolvedValue(baseTag);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.terminal.findUnique as jest.Mock).mockResolvedValue(baseTerminal);
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);
      
      const openLog = { id: 100 };
      (prisma.bundleStageLog.findFirst as jest.Mock).mockResolvedValue(openLog);
      
      // Not the final operation (max order is 2, current is 1)
      (prisma.productionTask.findFirst as jest.Mock).mockResolvedValue({ operationId: 99 });
      (prisma.bundleStageLog.update as jest.Mock).mockResolvedValue({ id: 100, outTime: new Date() });
      (prisma.bundle.update as jest.Mock).mockResolvedValue({});

      const result = await iotService.handleScan(mockTagCode, mockWorkerCardId, mockTerminalCode);

      expect(prisma.bundleStageLog.update).toHaveBeenCalledWith({
        where: { id: openLog.id },
        data: { outTime: expect.any(Date) }
      });
      expect(prisma.bundle.update).toHaveBeenCalledWith({
        where: { id: baseTag.bundle.id },
        data: { status: "IN_PROGRESS" }
      });
      expect(result).toMatchObject({ action: "SCAN_OUT" });
    });

    it('should perform Scan Out and mark COMPLETED if an open log exists (final op)', async () => {
      (prisma.bundleTagAssignment.findUnique as jest.Mock).mockResolvedValue(baseTag);
      (prisma.worker.findUnique as jest.Mock).mockResolvedValue(baseWorker);
      (prisma.terminal.findUnique as jest.Mock).mockResolvedValue(baseTerminal);
      (prisma.assignment.findFirst as jest.Mock).mockResolvedValue(baseAssignment);
      
      const openLog = { id: 100 };
      (prisma.bundleStageLog.findFirst as jest.Mock).mockResolvedValue(openLog);
      
      // Final operation match
      (prisma.productionTask.findFirst as jest.Mock).mockResolvedValue({ operationId: baseAssignment.operation.id });
      (prisma.bundleStageLog.update as jest.Mock).mockResolvedValue({ id: 100, outTime: new Date() });
      (prisma.bundle.update as jest.Mock).mockResolvedValue({});

      const result = await iotService.handleScan(mockTagCode, mockWorkerCardId, mockTerminalCode);

      expect(prisma.bundle.update).toHaveBeenCalledWith({
        where: { id: baseTag.bundle.id },
        data: { status: "COMPLETED" }
      });
      expect(result).toMatchObject({ action: "SCAN_OUT" });
    });
  });
});
