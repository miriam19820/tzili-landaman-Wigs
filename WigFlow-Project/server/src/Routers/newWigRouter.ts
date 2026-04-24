import { Router, Request, Response, NextFunction } from 'express';
import { 
  createNewWig, 
  moveToNextStage, 
  getWigsByWorker,
  getNewWigById 
} from '../Models_Service/NewWigs/newWigService';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware';

const newWigRouter = Router();

/**
 * פתיחת הזמנת פאה חדשה (רק מנהלת/מזכירה)
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
 * העברת פאה לשלב הבא (רק עובדת או מנהלת)
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
 * משיכת רשימת הפאות לעמדת העבודה (רק עובדת או מנהלת)
 */
newWigRouter.get('/work-station/:workerId', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workerId = req.params.workerId;
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
 * בדיקת סטטוס של פאה (כל משתמש מחובר)
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
        assignedWorker: wig.assignedWorker
      }
    });
  } catch (error) {
    next(error);
  }
});

export default newWigRouter;