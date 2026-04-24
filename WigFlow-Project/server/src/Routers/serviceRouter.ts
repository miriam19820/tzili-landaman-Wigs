import { Router } from 'express';
<<<<<<< HEAD
import * as serviceService from '../Models_Service/SalonServices/serviceService';

const serviceRouter = Router();

// 1. יצירת שירות חדש (שרה ומרים)
serviceRouter.post('/', async (req, res) => {
=======
import * as serviceService from '../Models_Service/SalonServices/serviceService'; 
import { verifyToken, verifyAdmin, verifyWorker, verifyQC } from '../Middlewares/authMiddleware';

const serviceRouter = Router();

// הזמנת שירות חדש (רק מנהלת/מזכירה)
serviceRouter.post('/', verifyAdmin, async (req, res) => {
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

<<<<<<< HEAD
// 2. שליפת כל השירותים
serviceRouter.get('/', async (req, res) => {
=======
// שליפת נתוני פאה בשירות (כל משתמש מחובר)
serviceRouter.get('/:id', verifyToken, async (req, res) => {
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  try {
    // כאן אפשר להוסיף פונקציה ב-serviceService אם הבנות יצרו כזו
    res.status(200).json({ message: "נתיב שליפת שירותים פעיל" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< HEAD
// 3. פסילת שירות והחזרה לתיקון (משימת מפתחת 4 - Reject)
serviceRouter.patch('/reject/:id', async (req, res) => {
=======
// --- פעולות של עובדות ייצור ---
serviceRouter.patch('/:id/start-drying', verifyWorker, async (req, res) => {
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  try {
    const { id } = req.params;
    const { qaNote, returnTo } = req.body;
    
    const result = await serviceService.rejectService(id, qaNote, returnTo);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

<<<<<<< HEAD
// 4. אישור שירות (מוכן למסירה)
serviceRouter.patch('/approve/:id', async (req, res) => {
=======
serviceRouter.patch('/:id/finish-drying', verifyWorker, async (req, res) => {
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  try {
    const result = await serviceService.approveService(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

<<<<<<< HEAD
=======
serviceRouter.patch('/:id/finish-styling', verifyWorker, async (req, res) => {
  try {
    const updatedService = await serviceService.finishStyling(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// --- פעולות בקרת איכות (QA) - רק מחלקת QC או מנהלת ---
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

>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
export default serviceRouter;