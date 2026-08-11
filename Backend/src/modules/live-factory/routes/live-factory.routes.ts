import { Router } from 'express';
import { LiveFactoryController } from '../controller/live-factory.controller';

const router = Router();
const controller = new LiveFactoryController();

router.get('/snapshot', controller.getSnapshot);
router.get('/ticker', controller.getTicker);
router.post('/machines/:id/status', controller.setMachineStatus);
router.post('/seed-reason-codes', controller.seedReasonCodes);

export default router;
