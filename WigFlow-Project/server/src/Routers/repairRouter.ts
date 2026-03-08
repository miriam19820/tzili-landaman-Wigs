import { Router } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService';

const repairRouter = Router();

// 1. פתיחת כרטיס תיקון חדש (על ידי המזכירה)
repairRouter.post('/', async (req, res, next) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

// 2. שליפת נתונים מרוכזים למסך המזכירה
repairRouter.get('/dashboard-view', async (req, res, next) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// 3. שליפת דוח עומסי עבודה של הצוות
repairRouter.get('/worker-load', async (req, res, next) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// 4. שליפת עובדות פנויות לפי קטגוריית תיקון (לטופס הדיאגנוזה)
repairRouter.get('/available-workers/:category', async (req, res, next) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

// ---> תוספת 1: שליפת הרשימה האישית של המשימות לעובדת המחוברת <---
repairRouter.get('/worker-tasks/:workerId', async (req, res, next) => {
  try {
    const tasks = await repairService.getTasksForWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// 5. שליפת תיקון בודד לפי ה-ID שלו
repairRouter.get('/:id', async (req, res, next) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

// ---> תוספת 2: עדכון סטטוס המשימה ובדיקה האם התיקון כולו הסתיים <---
repairRouter.patch('/:id/task/:index', async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    
    // מעדכנים קודם כל את המשימה הספציפית ל"בוצע"
    const updatedRepair = await repairService.updateTaskStatus(id, parseInt(index), status);
    
    // לוגיקה חכמה: בודקים אם עכשיו הפאה סיימה את *כל* התיקונים שלה
    const isComplete = await repairService.checkRepairCompletion(updatedRepair.wigCode);
    
    if (isComplete) {
      // כאן הפאה מוכנה למעבר לשלב הבא (חפיפה ובקרה - מפתחת 4)
      console.log(`✅ כל התיקונים של פאה ${updatedRepair.wigCode} הסתיימו בהצלחה! מועברת להמשך טיפול.`);
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