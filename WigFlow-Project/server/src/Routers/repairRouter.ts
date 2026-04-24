import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware';

const repairRouter = Router();

// 1. פתיחת כרטיס תיקון חדש (רק מנהלת/מזכירה)
repairRouter.post('/', verifyAdmin, async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

// 2. שליפת נתונים מרוכזים למסך המזכירה (רק מנהלת)
repairRouter.get('/dashboard-view', verifyAdmin, async (req, res, next) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// 3. שליפת דוח עומסי עבודה של הצוות (רק מנהלת)
repairRouter.get('/worker-load', verifyAdmin, async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// 4. שליפת עובדות פנויות לפי קטגוריית תיקון (מחוברים בלבד)
repairRouter.get('/available-workers/:category', verifyToken, async (req, res, next) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

// 5. שליפת הרשימה האישית של המשימות לעובדת המחוברת (עובדת ומנהלת)
repairRouter.get('/worker-tasks/:workerId', verifyWorker, async (req, res, next) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// 6. שליפת תיקון בודד לפי ה-ID שלו (מחוברים בלבד)
repairRouter.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

// 7. עדכון סטטוס המשימה ובדיקה האם התיקון כולו הסתיים (עובדת ומנהלת)
repairRouter.patch('/:id/task/:index', verifyWorker, async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    
    // מעדכנים את המשימה הספציפית ל"בוצע"
    const updatedRepair = await repairService.updateTaskStatus(id, parseInt(index), status);
    
    // בודקים אם עכשיו הפאה סיימה את *כל* התיקונים שלה (תוקן הבאג שהיה כאן בעבר!)
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

export default repairRouter;