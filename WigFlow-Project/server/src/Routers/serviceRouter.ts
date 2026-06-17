import { Router, Request, Response, NextFunction } from 'express';
import * as serviceService from '../Models_Service/SalonServices/serviceService.js';
import { verifyToken, verifyAdmin, verifyWorker, verifyQC } from '../Middlewares/authMiddleware.js';
import { Service } from '../Models_Service/SalonServices/serviceModel.js';
const serviceRouter = Router();

// שליפת כל משימות QA
serviceRouter.get('/qa-tasks', verifyQC, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await serviceService.getQATasks();
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// הזמנת שירות חדש
serviceRouter.post('/', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת השירות', error: error.message });
  }
});

// שליפת שירות לפי ID
serviceRouter.get('/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id).populate('customer');
    if (!service) return res.status(404).json({ message: 'שירות לא נמצא' });
    res.status(200).json(service);
  } catch (error: any) {
    res.status(500).json({ message: 'שגיאה בשליפת הנתונים', error: error.message });
  }
});

// אישור QA
serviceRouter.patch('/:id/approve', verifyQC, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inspectorId, photoUrl } = req.body;
    const approvedService = await serviceService.approveService(req.params.id, inspectorId, photoUrl);
    res.status(200).json({ message: 'הפאה אושרה ומוכנה למסירה!', service: approvedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// פסילת QA
serviceRouter.patch('/:id/reject', verifyQC, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qaNote, photoUrl, returnStages } = req.body;
    const rejectedService = await serviceService.rejectService(req.params.id, qaNote, photoUrl, returnStages);
    res.status(200).json({ message: 'הפאה הוחזרה לתיקון', service: rejectedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

serviceRouter.patch('/:id/start-drying', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedService = await serviceService.moveToDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

serviceRouter.patch('/:id/finish-drying', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedService = await serviceService.finishDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

serviceRouter.patch('/:id/finish-styling', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedService = await serviceService.finishStyling(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default serviceRouter;
