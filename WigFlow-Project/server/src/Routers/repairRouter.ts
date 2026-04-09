import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware';

const repairRouter = Router();

// 1. פתיחת כרטיס תיקון חדש
repairRouter.post('/', verifyAdmin, async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

// 2. דאשבורד מרוכז למזכירה
repairRouter.get('/dashboard-view', verifyAdmin, async (req, res, next) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// 3. דוח עומסי עבודה
repairRouter.get('/worker-load', verifyAdmin, async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// 4. עובדות פנויות לפי קטגוריה
repairRouter.get('/available-workers/:category', verifyToken, async (req, res, next) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

// 5. משימות אישיות לעובדת
repairRouter.get('/worker-tasks/:workerId', verifyWorker, async (req, res, next) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// --- נתיב חדש ומתוקן: פסילת משימה ב-QA (Reject) ---
// חשוב להגדיר אותו לפני הנתיבים הגנריים עם הפרמטרים
repairRouter.patch('/:id/reject-task/:index', verifyAdmin, async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { note } = req.body;
    
    // קריאה לפונקציית הפסילה שמוסיפה הערה ומחזירה לממתין
    const updatedRepair = await repairService.rejectTask(id, parseInt(index), note);
    
    res.json({ 
      success: true, 
      message: 'הפאה הוחזרה לתיקון עם ההערה המבוקשת',
      data: updatedRepair 
    });
  } catch (error) {
    next(error);
  }
});

// 6. שליפת תיקון בודד
repairRouter.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

// 7. עדכון סטטוס משימה רגיל (סיום משימה)
repairRouter.patch('/:id/task/:index', verifyWorker, async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;

    const repair = await repairService.getRepairById(id);
    const taskIndex = parseInt(index);
    const taskName = repair.tasks[taskIndex].subCategory;
    const wigCode = repair.wigCode;

    if (status === 'בוצע') {
      // מעבר אוטומטי לשלב הבא רק כשמסמנים "בוצע"
      const workflowResult = await repairService.updateTaskAndMoveToNext(wigCode, taskName);
      const updatedRepair = await repairService.getRepairById(id);

      res.json({ 
        success: true, 
        data: updatedRepair, 
        message: workflowResult.message
      });
    } else {
      const updatedRepair = await repairService.updateTaskStatus(id, taskIndex, status);
      res.json({ success: true, data: updatedRepair });
    }
  } catch (error) {
    next(error);
  }
});

export default repairRouter;