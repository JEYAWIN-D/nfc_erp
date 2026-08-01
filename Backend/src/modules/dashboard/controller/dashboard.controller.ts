import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../service/dashboard.service';

export class DashboardController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await dashboardService.getOverview();
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  }

  async getWorkersSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getWorkersSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getMachinesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getMachinesSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getProductionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getProductionSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getQCSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getQCSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getLiveFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const liveFloor = await dashboardService.getLiveFloor();
      res.status(200).json(liveFloor);
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getAttendanceSummary();
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getExtendedFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const extended = await dashboardService.getExtendedFeatures();
      res.status(200).json(extended);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
