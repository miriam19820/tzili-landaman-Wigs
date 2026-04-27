import { Router, Request, Response } from 'express';
import * as wigHistoryService from '../Models_Service/WigHistory/wigHistoryService.js';

const router = Router();

// שליפת היסטוריה לפי קוד פאה
router.get('/:wigCode', async (req: Request, res: Response) => {
  try {
    const { wigCode } = req.params;
    const history = await wigHistoryService.getFullHistoryByCode(wigCode);
    res.status(200).json({ status: 'success', data: history });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// הוספת הערה ידנית של מנהלת
router.post('/add-note', async (req: Request, res: Response) => {
  try {
    const { wigCode, note, workerName } = req.body;
    const newEntry = await wigHistoryService.addHistoryEvent({
      wigCode,
      actionType: 'הערת מנהלת',
      stage: 'הערה ידנית',
      workerName: workerName || 'מנהלת',
      description: note,
    });
    res.status(201).json({ status: 'success', data: newEntry });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;