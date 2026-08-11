import { Router } from "express";

import departmentRoutes from "../modules/department/routes/department.routes";
import workerRoutes from "../modules/worker/routes/worker.routes";
import machineRoutes from "../modules/machine/routes/machine.routes";
import { machineTypeRoutes } from "../modules/machine-type/routes/machine-type.routes";
import operationRoutes from "../modules/operation/routes/operation.routes";
import shiftRoutes from "../modules/shift/routes/shift.routes";
import assignmentRoutes from "../modules/assignment/routes/assignment.routes";
import terminalRoutes from "../modules/terminal/routes/terminal.routes";
import attendanceRoutes from "../modules/attendance/routes/attendance.routes";
import productionOrderRoutes from "../modules/production-order/routes/production-order.routes";
import bundleRoutes from "../modules/bundle/routes/bundle.routes";
import floorRoutes from "../modules/floor/routes/floor.routes";
import roomRoutes from "../modules/room/routes/room.routes";

import { dashboardRoutes } from "../modules/dashboard/routes/dashboard.routes";
import { reportsRoutes } from "../modules/reports/routes/reports.routes";
import { planningRoutes } from "../modules/planning/routes/planning.routes";
import tagRoutes from "../modules/tag/routes/tag.routes";
import stageLogRoutes from "../modules/stage-log/routes/stage-log.routes";
import qcCheckRoutes from "../modules/qc-check/routes/qc-check.routes";
import iotRoutes from "../modules/iot/routes/iot.routes";
import liveFactoryRoutes from "../modules/live-factory/routes/live-factory.routes";

const router = Router();

router.use("/departments", departmentRoutes);
router.use("/workers", workerRoutes);
router.use("/machines", machineRoutes);
router.use("/machine-types", machineTypeRoutes);
router.use("/operations", operationRoutes);
router.use("/shifts", shiftRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/terminals", terminalRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/production-orders", productionOrderRoutes);
router.use("/bundles", bundleRoutes);
router.use("/floors", floorRoutes);
router.use("/rooms", roomRoutes);

router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportsRoutes);
router.use("/planning", planningRoutes);
router.use("/tags", tagRoutes);
router.use("/stage-logs", stageLogRoutes);
router.use("/qc-checks", qcCheckRoutes);
router.use("/iot", iotRoutes);
router.use("/live-factory", liveFactoryRoutes);

export default router;