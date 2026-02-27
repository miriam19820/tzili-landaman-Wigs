import { Router, Request, Response, NextFunction } from 'express';
// ייבוא ה-Middlewares
import { verifyToken, verifyAdmin, verifyWorker, verifyQC } from '../Middlewares/authMiddleware';
import { 
  createNewWig, 
  moveToNextStage, 
  getWigsByWorker,
  getNewWigById 
} from '../Models_Service/NewWigs/newWigService';

const newWigRouter = Router();

/**
 * @route   POST /api/wigs/new
 * @desc    יצירת הזמנת פאה חדשה - רק מזכירה/מנהלת יכולה ליצור הזמנה חדשה
 */
newWigRouter.post('/new', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newWig = await createNewWig(req.body);
    res.status(201).json({
      success: true,
      message: 'הזמנת פאה חדשה נוצרה בהצלחה',
      data: newWig
    });
  } catch (error) {
    next(error); 
  }
});

/**
 * @route   PATCH /api/wigs/:id/next-step
 * @desc    העברת הפאה לשלב הבא - מותר לעובדת או למנהלת
 */
newWigRouter.patch('/:id/next-step', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigId = req.params.id;
    const { nextWorkerId } = req.body; 
    
    const updatedWig = await moveToNextStage(wigId, nextWorkerId);
    
    res.status(200).json({
      success: true,
      message: 'הפאה הועברה לשלב הבא בהצלחה',
      data: updatedWig
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /work-station/:workerId
 * @desc    קבלת רשימת עבודה לעובדת - כאן נכנס המיון של ה"דחוף"
 */
newWigRouter.get('/work-station/:workerId', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req.params.workerId;
    
    /* שימי לב: כדי שזה יעבוד, פונקציית getWigsByWorker ב-Service 
       צריכה להשתמש ב: .sort({ isUrgent: -1, createdAt: 1 })
    */
    const wigs = await getWigsByWorker(workerId);
    
    res.status(200).json({
      success: true,
      count: wigs.length,
      data: wigs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /status/:id
 * @desc    בדיקת סטטוס פאה (פתוח לכולן עם טוקן)
 */
newWigRouter.get('/status/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigId = req.params.id;
    const wig = await getNewWigById(wigId); 
    
    if (!wig) {
      return res.status(404).json({ success: false, message: 'הפאה לא נמצאה' });
    }

    res.status(200).json({
      success: true,
      data: {
        currentStage: wig.currentStage,
        assignedWorker: wig.assignedWorker,
        isUrgent: wig.isUrgent // הוספנו כדי שהעובדת תראה שזה דחוף
      }
    });
  } catch (error) {
    next(error);
  }
});

export default newWigRouter;