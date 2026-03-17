<<<<<<< HEAD
import { Router } from 'express';
import * as newWigService from '../Models_Service/NewWigs/newWigService';

const newWigRouter = Router();

// 1. פתיחת הזמנה לפאה חדשה (הותאם כדי שה-React יקבל את ה-id ישירות לשמירת הברקוד)
newWigRouter.post('/new', async (req, res, next) => {
=======
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
>>>>>>> miriam
  try {
    const newWig = await newWigService.createNewWig(req.body);
    res.status(201).json(newWig); 
  } catch (error) {
    next(error); 
  }
});

<<<<<<< HEAD
// 2. שליפת כל הפאות (עם פרטי העובדות המשובצות) - מיועד לדשבורד המזכירה
newWigRouter.get('/', async (req, res, next) => {
=======
/**
 * העברת פאה לשלב הבא (רק עובדת או מנהלת)
 */
newWigRouter.patch('/:id/next-step', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
>>>>>>> miriam
  try {
    const wigs = await newWigService.getAllWigsWithWorkers();
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

<<<<<<< HEAD
// 3. שליפת פאות המשובצות לעובדת ספציפית - הותאם במדויק לבקשת ה-Front-End
newWigRouter.get('/work-station/:workerId', async (req, res, next) => {
=======
/**
 * משיכת רשימת הפאות לעמדת העבודה (רק עובדת או מנהלת)
 */
newWigRouter.get('/work-station/:workerId', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
>>>>>>> miriam
  try {
    const wigs = await newWigService.getWigsByWorker(req.params.workerId);
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

<<<<<<< HEAD
// 4. שליפת פאה ספציפית לפי ה-ID שלה
newWigRouter.get('/:id', async (req, res, next) => {
=======
/**
 * בדיקת סטטוס של פאה (כל משתמש מחובר)
 */
newWigRouter.get('/status/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
>>>>>>> miriam
  try {
    const wig = await newWigService.getNewWigById(req.params.id);
    if (!wig) {
      return res.status(404).json({ success: false, message: 'הפאה לא נמצאה' });
    }
    res.status(200).json({ success: true, data: wig });
  } catch (error) {
    next(error);
  }
});

// 5. העברת הפאה לשלב הבא (קריטי ללוגיקת פס הייצור - הותאם במדויק למסך העובדת)
newWigRouter.patch('/:id/next-step', async (req, res, next) => {
  try {
    // ב-React נשלח השדה nextWorkerId כשהעובדת בוחרת למי להעביר
    const { nextWorkerId } = req.body; 
    const updatedWig = await newWigService.moveToNextStage(req.params.id, nextWorkerId);
    
    // מוחזר כפי שה-React מצפה לקבל
    res.status(200).json(updatedWig); 
  } catch (error) {
    next(error);
  }
});

// 6. עדכון סטטוס "דחיפות" לפאה (מזכירה)
newWigRouter.patch('/:id/urgency', async (req, res, next) => {
  try {
    const { isUrgent } = req.body;
    const updatedWig = await newWigService.updateWigUrgency(req.params.id, isUrgent);
    res.status(200).json(updatedWig);
  } catch (error) {
    next(error);
  }
});

export default newWigRouter;