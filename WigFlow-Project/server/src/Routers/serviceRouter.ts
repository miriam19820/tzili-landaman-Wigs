import { Router } from 'express';
import * as serviceService from '../Models_Service/SalonServices/serviceService';

const serviceRouter = Router();

// 1. יצירת שירות חדש (שרה ומרים)
serviceRouter.post('/', async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 2. שליפת כל השירותים
serviceRouter.get('/', async (req, res) => {
  try {
    // כאן אפשר להוסיף פונקציה ב-serviceService אם הבנות יצרו כזו
    res.status(200).json({ message: "נתיב שליפת שירותים פעיל" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 3. פסילת שירות והחזרה לתיקון (משימת מפתחת 4 - Reject)
serviceRouter.patch('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { qaNote, returnTo } = req.body;
    
    const result = await serviceService.rejectService(id, qaNote, returnTo);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// 4. אישור שירות (מוכן למסירה)
serviceRouter.patch('/approve/:id', async (req, res) => {
  try {
    const result = await serviceService.approveService(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default serviceRouter;