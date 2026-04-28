import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware';

const repairRouter = Router();

repairRouter.post('/', verifyAdmin, async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/dashboard-view', verifyAdmin, async (req, res, next) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/worker-load', verifyAdmin, async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/available-workers/:category', verifyToken, async (req, res, next) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/worker-tasks/:workerId', verifyWorker, async (req, res, next) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

repairRouter.patch('/:id/task/:index', verifyWorker, async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    
    const updatedRepair = await repairService.updateTaskStatus(id, parseInt(index), status);
    
    const isComplete = updatedRepair.tasks.every(task => task.status === "בוצע");
    
    if (isComplete) {
      console.log(`✅ כל התיקונים של פאה ${updatedRepair.wigCode} הסתיימו בהצלחה!`);
    }

    res.json({ 
      success: true, 
      data: updatedRepair, 
      message: isComplete ? 'המשימה והתיקונים כולם הסתיימו!' : 'המשימה עודכנה בהצלחה'
    });
  } catch (error) {
    next(error);
  }
});
repairRouter.patch('/update-status/:id', verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const updatedRepair = await repairService.updateOverallStatus(id, status);

    res.json({ 
      success: true, 
      message: `סטטוס הפאה עודכן ל-${status} בהצלחה`, 
      data: updatedRepair 
    });
  } catch (error) {
    next(error);
  }
});

export default repairRouter;