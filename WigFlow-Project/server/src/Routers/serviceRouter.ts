import { Router } from 'express';
import * as serviceService from '../Models_Service/SalonServices/serviceService'; 
import { verifyToken, verifyAdmin, verifyWorker, verifyQC } from '../Middlewares/authMiddleware';

const serviceRouter = Router();

// 1. יצירת שירות חדש (רק מנהלת/מזכירה)
serviceRouter.post('/', verifyAdmin, async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 2. שליפת שירות לפי ID
serviceRouter.get('/:id', verifyToken, async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.status(200).json(service);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- פעולות של עובדות (חפיפה/סירוק/ייבוש) ---

serviceRouter.patch('/:id/start-drying', verifyWorker, async (req, res) => {
  try {
    const result = await serviceService.moveToDrying(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

serviceRouter.patch('/:id/finish-drying', verifyWorker, async (req, res) => {
  try {
    const result = await serviceService.finishDrying(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

serviceRouter.patch('/:id/finish-styling', verifyWorker, async (req, res) => {
  try {
    const updatedService = await serviceService.finishStyling(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- פעולות בקרת איכות (QA) - משימת מפתחת 4 ---

serviceRouter.patch('/:id/approve', verifyQC, async (req, res) => {
  try {
    const approvedService = await serviceService.approveService(req.params.id);
    res.status(200).json({ message: 'הפאה אושרה ומוכנה למסירה!', service: approvedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

serviceRouter.patch('/:id/reject', verifyQC, async (req, res) => {
  try {
    const { qaNote, returnTo, repairTaskId } = req.body; 
    const rejectedService = await serviceService.rejectService(
      req.params.id, 
      qaNote, 
      returnTo, 
      repairTaskId
    );
    res.status(200).json({ message: 'הפאה הוחזרה לתיקון', service: rejectedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default serviceRouter;