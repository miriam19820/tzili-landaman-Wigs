import { Router, Request, Response, NextFunction } from 'express';
import * as newWigService from '../Models_Service/NewWigs/newWigService';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware';

const newWigRouter = Router();

/**
 * פתיחת הזמנת פאה חדשה (רק מנהלת/מזכירה)
 */
newWigRouter.post('/new', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newWig = await newWigService.createNewWig(req.body);
    res.status(201).json({ success: true, data: newWig }); 
  } catch (error) {
    next(error); 
  }
});

/**
 * שליפת כל הפאות לדשבורד
 */
newWigRouter.get('/', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigs = await newWigService.getAllWigsWithWorkers();
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

/**
 * שליפת פאות לפי עובדת
 */
newWigRouter.get('/work-station/:workerId', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigs = await newWigService.getWigsByWorker(req.params.workerId);
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

/**
 * העברת פאה לשלב הבא
 */
newWigRouter.patch('/:id/next-step', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nextWorkerId } = req.body; 
    const updatedWig = await newWigService.moveToNextStage(req.params.id, nextWorkerId);
    res.status(200).json(updatedWig); 
  } catch (error) {
    next(error);
  }
});

/**
 * עדכון דחיפות
 */
newWigRouter.patch('/:id/urgency', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isUrgent } = req.body;
    const updatedWig = await newWigService.updateWigUrgency(req.params.id, isUrgent);
    res.status(200).json(updatedWig);
  } catch (error) {
    next(error);
  }
});

export default newWigRouter;