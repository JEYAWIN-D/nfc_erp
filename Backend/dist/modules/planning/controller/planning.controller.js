"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planningController = exports.PlanningController = void 0;
const planning_service_1 = require("../service/planning.service");
const planning_dto_1 = require("../dto/planning.dto");
class PlanningController {
    async getDashboardMetrics(req, res) {
        try {
            const metrics = await planning_service_1.planningService.getDashboardMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getAllTasks(req, res) {
        try {
            const tasks = await planning_service_1.planningService.getAllTasks();
            res.json(tasks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getTaskById(req, res) {
        try {
            const task = await planning_service_1.planningService.getTaskById(Number(req.params.id));
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            res.json(task);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createTask(req, res) {
        try {
            const parsedData = planning_dto_1.CreateTaskSchema.parse(req.body);
            const task = await planning_service_1.planningService.createTask(parsedData);
            res.status(201).json(task);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateTask(req, res) {
        try {
            const parsedData = planning_dto_1.UpdateTaskSchema.parse(req.body);
            const task = await planning_service_1.planningService.updateTask(Number(req.params.id), parsedData);
            res.json(task);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getResourceAvailability(req, res) {
        try {
            const resources = await planning_service_1.planningService.getResourceAvailability();
            res.json(resources);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async runAutoScheduler(req, res) {
        try {
            const result = await planning_service_1.planningService.runAutoScheduler(Number(req.params.id));
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async publishPlan(req, res) {
        try {
            const parsedData = planning_dto_1.PublishPlanSchema.parse(req.body);
            const result = await planning_service_1.planningService.publishPlan(parsedData);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getHistory(req, res) {
        try {
            const result = await planning_service_1.planningService.getHistory();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.PlanningController = PlanningController;
exports.planningController = new PlanningController();
