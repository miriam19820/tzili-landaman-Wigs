import { Router } from 'express';
// ייבוא הקובץ של הלוגיקה שעשינו קודם (שימי לב שהנתיב תואם לתיקייה שלך)
import * as serviceService from './serviceService'; 

const serviceRouter = Router();

// 1. פתיחת הזמנת שירות חדשה (הדילוג האוטומטי שלנו)
serviceRouter.post('/', async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);
    res.status(201).json(newService);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת השירות', error: error.message });
  }
});

// 2. שליפת פרטי פאה ספציפית לפי ID
serviceRouter.get('/:id', async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) return res.status(404).json({ message: 'פאה לא נמצאה' });
    res.status(200).json(service);
  } catch (error: any) {
    res.status(500).json({ message: 'שגיאה בשליפת הנתונים', error: error.message });
  }
});

// 3. תחילת ייבוש - שומר זמן להתראות
serviceRouter.patch('/:id/start-drying', async (req, res) => {
  try {
    const updatedService = await serviceService.moveToDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. סיום ייבוש - הניתוב החכם לסורקת או ל-QA
serviceRouter.patch('/:id/finish-drying', async (req, res) => {
  try {
    const updatedService = await serviceService.finishDrying(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5. סיום סירוק
serviceRouter.patch('/:id/finish-styling', async (req, res) => {
  try {
    const updatedService = await serviceService.finishStyling(req.params.id);
    res.status(200).json(updatedService);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- אזור מבקרת האיכות (QA) ---

// 6. אישור סופי של המבקרת
serviceRouter.patch('/:id/approve', async (req, res) => {
  try {
    const approvedService = await serviceService.approveService(req.params.id);
    res.status(200).json({ message: 'הפאה אושרה ומוכנה למסירה!', service: approvedService });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 7. החזרה לתיקון (פסילה)
serviceRouter.patch('/:id/reject', async (req, res) => {
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