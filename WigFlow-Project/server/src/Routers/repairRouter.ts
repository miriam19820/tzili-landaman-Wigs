import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';

const repairRouter = Router();

repairRouter.post('/', async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});


repairRouter.get('/dashboard-view', async (req, res, next) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});


repairRouter.get('/worker-load', async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/available-workers/:category', async (req, res, next) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});


repairRouter.get('/worker-tasks/:workerId', async (req, res, next) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/:id', async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});


repairRouter.patch('/:id/task/:index', async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    const updated = await repairService.updateTaskStatus(id, parseInt(index), status);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default repairRouter;