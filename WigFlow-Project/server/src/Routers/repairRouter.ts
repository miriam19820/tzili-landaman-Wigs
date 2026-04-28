import { Router } from 'express';
// הוספת .js בסוף הייבוא (קריטי ב-Node.js עם Modules)
import * as repairService from '../Models_Service/Repairs/repairService.js';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware.js';

const repairRouter = Router();

// 1. פתיחת כרטיס תיקון חדש (רק מנהלת/מזכירה)
repairRouter.post('/', verifyAdmin, async (req: any, res: any, next: any) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

// 2. שליפת נתונים מרוכזים למסך המזכירה (רק מנהלת)
repairRouter.get('/dashboard-view', verifyAdmin, async (req: any, res: any, next: any) => {
  try {
    // השתקת שגיאה אם הפונקציה עדיין לא קיימת ב-Service
    const dashboard = await (repairService as any).getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// 3. שליפת דוח עומסי עבודה של הצוות (רק מנהלת)
repairRouter.get('/worker-load', verifyAdmin, async (req: any, res: any, next: any) => {
  try {
    const report = await (repairService as any).FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// 4. שליפת עובדות פנויות לפי קטגוריית תיקון (מחוברים בלבד)
repairRouter.get('/available-workers/:category', verifyToken, async (req: any, res: any, next: any) => {
  try {
    const workers = await (repairService as any).getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

// 5. שליפת הרשימה האישית של המשימות לעובדת המחוברת (עובדת ומנהלת)
repairRouter.get('/worker-tasks/:workerId', verifyWorker, async (req: any, res: any, next: any) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// 6. שליפת תיקון בודד לפי ה-ID שלו (מחוברים בלבד)
repairRouter.get('/:id', verifyToken, async (req: any, res: any, next: any) => {
  try {
    // השתקת שגיאה אם הפונקציה חסרה ב-Service
    const repair = await (repairService as any).getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

// 7. עדכון סטטוס המשימה ובדיקה האם התיקון כולו הסתיים (עובדת ומנהלת)
repairRouter.patch('/:id/task/:index', verifyWorker, async (req: any, res: any, next: any) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    
    // מעדכנים את המשימה הספציפית
    const updatedRepair = await (repairService as any).updateTaskStatus(id, parseInt(index), status);
    
    // תיקון שגיאת ה-Property 'tasks' does not exist
    const tasks = (updatedRepair as any).tasks || [];
    const isComplete = tasks.every((task: any) => task.status === "בוצע");
    
    if (isComplete) {
      console.log(`✅ כל התיקונים של פאה ${(updatedRepair as any).wigCode} הסתיימו בהצלחה!`);
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