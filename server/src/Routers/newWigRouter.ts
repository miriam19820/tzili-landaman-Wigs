import { Router, Request, Response, NextFunction } from 'express';
import { 
  createNewWig, 
  moveToNextStage, 
  getWigsByWorker,
  getNewWigById 
} from '../Models_Service/NewWigs/newWigService';

const newWigRouter = Router();

/**
 * @route   
 * @desc    
 */
newWigRouter.post('/new', async (req: Request, res: Response, next: NextFunction) => {
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
 * @route   
 * @desc    
 * @body    
 */
newWigRouter.patch('/:id/next-step', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigId = req.params.id;
    const { nextWorkerId } = req.body;

    if (!nextWorkerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'חובה לספק את מזהה העובדת הבאה (nextWorkerId)' 
      });
    }

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
 * @route   
 * @desc   
 */
newWigRouter.get('/work-station/:workerId', async (req: Request, res: Response, next: NextFunction) => {
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
 * @route 
 * @desc   
 */
newWigRouter.get('/status/:id', async (req: Request, res: Response, next: NextFunction) => {
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