import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller';

const router = Router();

router.get('/overview', dashboardController.getOverview.bind(dashboardController));
router.get('/workers', dashboardController.getWorkersSummary.bind(dashboardController));
router.get('/machines', dashboardController.getMachinesSummary.bind(dashboardController));
router.get('/production', dashboardController.getProductionSummary.bind(dashboardController));
router.get('/qc', dashboardController.getQCSummary.bind(dashboardController));
router.get('/attendance', dashboardController.getAttendanceSummary.bind(dashboardController));
router.get('/live-floor', dashboardController.getLiveFloor.bind(dashboardController));
router.get('/extended-features', dashboardController.getExtendedFeatures.bind(dashboardController));

export const dashboardRoutes = router;
