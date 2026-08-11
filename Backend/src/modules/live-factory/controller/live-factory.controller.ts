import { Request, Response, NextFunction } from 'express';
import { LiveFactoryService } from '../service/live-factory.service';
import { websocketService, WEBSOCKET_EVENTS } from '../../websocket';

export class LiveFactoryController {
  private service = new LiveFactoryService();

  /** GET /api/v1/live-factory/snapshot */
  getSnapshot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await this.service.getSnapshot();
      res.json({ success: true, data: snapshot });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/live-factory/ticker */
  getTicker = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const events = await this.service.getRecentTickerEvents(limit);
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/live-factory/machines/:id/status */
  setMachineStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const machineId = Number(req.params.id);
      const { status, reasonCodeId, note, reportedBy } = req.body;

      const event = await this.service.setMachineStatus({
        machineId,
        status,
        reasonCodeId,
        note,
        reportedBy,
        isSystemGenerated: false,
      });

      // Broadcast to all connected factory clients
      websocketService.publish(WEBSOCKET_EVENTS.MACHINE_STATUS_CHANGED, {
        machineId,
        status,
        reasonCodeId,
        changedAt: event.changedAt,
      });
      websocketService.publish(WEBSOCKET_EVENTS.FACTORY_TICKER_EVENT, {
        machineId,
        status,
        note,
        changedAt: event.changedAt,
      });

      res.json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/live-factory/seed-reason-codes */
  seedReasonCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.seedReasonCodes();
      res.json({ success: true, message: 'Reason codes seeded' });
    } catch (err) {
      next(err);
    }
  };
}
