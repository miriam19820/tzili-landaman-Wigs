import { Router, Request, Response, NextFunction } from 'express';
import * as repairService from '../Models_Service/Repairs/repairService.js';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware.js';
import { sendSalonUpdate } from '../Services/notificationService.js';

const repairRouter = Router();

/**
 * נתיב חדש: סימון תיקון כנמסר ושליחת התראה למנהלת
 * פותר את שגיאת ה-404 בעת לחיצה על "נמסר" בדאשבורד
 */
repairRouter.patch('/:id/deliver', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedRepair = await repairService.markRepairAsDelivered(req.params.id);
    
    // שליחת התראת וואטסאפ אוטומטית למנהלת על מסירת התיקון
    if (updatedRepair) {
      const notifyData = {
        orderCode: updatedRepair.wigCode,
        customerName: updatedRepair.customer ? `${(updatedRepair.customer as any).firstName} ${(updatedRepair.customer as any).lastName}` : 'לקוחה'
      };
      
      // שליחת ההודעה (מטופל ברקע)
      sendSalonUpdate(notifyData, 'התיקון הסתיים והפאה נמסרה ללקוחה! ✅').catch(err => 
        console.error("שגיאה בשליחת הודעת וואטסאפ על מסירה:", err)
      );
    }

    res.status(200).json({ 
      success: true, 
      message: 'התיקון עודכן כנמסר והוסר מהדאשבורד בהצלחה' 
    });
  } catch (error) {
    next(error);
  }
});

// --- שאר הנתיבים הקיימים ---

repairRouter.post('/', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newRepair = await repairService.createRepairOrder(req.body);
    res.status(201).json({ success: true, data: newRepair });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/dashboard-view', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await repairService.getDashboardView();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/worker-load', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await repairService.FullWorkloadReportOpenJobs();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/available-workers/:category', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await repairService.getAvailableWorkersByCategory(req.params.category);
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
});

repairRouter.get('/worker-tasks/:workerId', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await repairService.getTasksByWorker(req.params.workerId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

repairRouter.patch('/:id/reject-task/:index', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, index } = req.params;
    const { note } = req.body;
    
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

repairRouter.get('/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repair = await repairService.getRepairById(req.params.id);
    res.json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

repairRouter.patch('/:id/task/:index', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;

    const repair = await repairService.getRepairById(id);
    const taskIndex = parseInt(index);

    // --- התיקון הקריטי למניעת קריסות (שגיאות 404) ---
    if (!repair.tasks || !repair.tasks[taskIndex]) {
        return res.status(404).json({ message: "המשימה לא קיימת יותר או שכבר בוצעה. אנא רענני את הדף." });
    }
    // ------------------------------------------------

    const taskName = repair.tasks[taskIndex].subCategory;

    if (status === 'בוצע') {
      const workflowResult = await repairService.updateTaskAndMoveToNext(id, taskName);
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

repairRouter.delete('/:id', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode || adminCode !== process.env.ADMIN_DELETE_CODE) {
      res.status(403).json({ message: 'קוד מנהל שגוי או חסר. הפעולה נדחתה.' });
      return; 
    }

    const { id } = req.params;
    await repairService.deleteRepair(id); 

    res.status(200).json({ message: 'התיקון נמחק בהצלחה.' });
  } catch (error) {
    next(error);
  }
});

export default repairRouter;