import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';

const repairRouter = Router();

<<<<<<< HEAD:WigFlow-Project/server/src/Routers/repairRouter.ts
=======
// 1. יצירת תיקון חדש
repairRouter.post('/', async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json(newRepair);
  } catch (error) {
    next(error);
  }
});

// 2. שליפת תיקון לפי ID
repairRouter.get('/:id', async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json(repair);
  } catch (error) {
    next(error);
  }
});

// 3. שליפת כל התיקונים (Dashboard)
repairRouter.get('/dashboard/view', async (req, res, next) => {
  try {
    const repairs = await repairService.getDashboardView();
    res.json(repairs);
  } catch (error) {
    next(error);
  }
});

// 4. עדכון סטטוס משימה לפי index
repairRouter.patch('/:repairId/task/:taskIndex/status', async (req, res, next) => {
  try {
    const { repairId, taskIndex } = req.params;
    const { status } = req.body;
    
    const updatedRepair = await repairService.updateTaskStatus(
      repairId, 
      Number(taskIndex),
      status
    );
    
    res.json(updatedRepair);
  } catch (error) {
    next(error);
  }
});

// 5. שליפת עומס עובדת - משימות פתוחות
repairRouter.get('/worker/:workerId/load/open', async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const openTasksCount = await repairService.getWorkerLoadOpen(workerId);
    
    res.json({ 
      workerId, 
      openTasks: openTasksCount 
    });
  } catch (error) {
    next(error);
  }
});

// 6. שליפת עומס עובדת - משימות סגורות
repairRouter.get('/worker/:workerId/load/closed', async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const closedTasksCount = await repairService.getWorkerLoadClose(workerId);
    
    res.json({ 
      workerId, 
      closedTasks: closedTasksCount 
    });
  } catch (error) {
    next(error);
  }
});

// 7. דוח עומס מלא - משימות פתוחות
repairRouter.get('/reports/workload/open', async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// 8. דוח עומס מלא - משימות סגורות
repairRouter.get('/reports/workload/closed', async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportCloseJobs();
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// 9. שליפת עובדות לפי קטגוריה
repairRouter.get('/workers/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const workers = await repairService.getAvailableWorkersByCategory(category);
    res.json(workers);
  } catch (error) {
    next(error);
  }
});

// 10. סיום משימה ומעבר להבאה
repairRouter.patch('/wig/:wigCode/complete-task', async (req, res, next) => {
  try {
    const { wigCode } = req.params;
    const { subCategoryName } = req.body;
    
    const result = await repairService.updateTaskAndMoveToNext(wigCode, subCategoryName);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 11. הוספת הערה למשימה
repairRouter.post('/wig/:wigCode/note', async (req, res, next) => {
  try {
    const { wigCode } = req.params;
    const { category, note } = req.body;
    
    const updatedRepair = await repairService.addNoteByWigAndCategory(wigCode, category, note);
    res.json(updatedRepair);
  } catch (error) {
    next(error);
  }
});

// 12. בדיקת השלמת תיקון
repairRouter.get('/wig/:wigCode/completion', async (req, res, next) => {
  try {
    const { wigCode } = req.params;
    const isComplete = await repairService.checkRepairCompletion(wigCode);
    res.json({ wigCode, isComplete });
  } catch (error) {
    next(error);
  }
});

// 13. סימון כל המשימות כבוצעו
repairRouter.patch('/wig/:wigCode/complete-all', async (req, res, next) => {
  try {
    const { wigCode } = req.params;
    const updatedRepair = await repairService.updateWigStatusToDone(wigCode);
    res.json(updatedRepair);
  } catch (error) {
    next(error);
  }
});
>>>>>>> origin/miryami:server/src/Routers/repairRouter.ts

export default repairRouter;


