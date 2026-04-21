import { Router } from 'express';

import * as serviceService from '../Models_Service/SalonServices/serviceService.js'; 

import { verifyToken, verifyAdmin, verifyWorker, verifyQC } from '../Middlewares/authMiddleware.js';

const serviceRouter = Router();

serviceRouter.post('/', verifyAdmin, async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת השירות', error: error.message });
  }
});

serviceRouter.get('/qa-tasks', verifyToken, async (req, res) => {
  try {
    const tasks = await serviceService.getQATasks();
    res.status(200).json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ message: 'שגיאה בשליפת הנתונים', error: error.message });
  }
});

serviceRouter.get('/:id', verifyToken, async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ message: 'פאה לא נמצאה' });
    res.status(200).json(service);
  } catch (error: any) {
    res.status(500).json({ message: 'שגיאה בשליפת הנתונים', error: error.message });
  }
});

serviceRouter.patch('/:id/start-drying', verifyWorker, async (req, res) => {
  try {
    const updatedService = await serviceService.moveToDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

serviceRouter.patch('/:id/finish-drying', verifyWorker, async (req, res) => {
  try {
    const updatedService = await serviceService.finishDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
  
    const { qaNote, returnStages } = req.body; 
    
    const rejectedService = await serviceService.rejectService(
      req.params.id, 
      qaNote, 
      returnStages 
    );
    res.status(200).json({ message: 'הפאה הוחזרה לתיקון בהצלחה', service: rejectedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default serviceRouter;