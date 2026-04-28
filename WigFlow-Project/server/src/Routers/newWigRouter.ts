import { Router, Request, Response, NextFunction } from 'express';
import * as newWigService from '../Models_Service/NewWigs/newWigService.js';
import { verifyToken, verifyAdmin, verifyWorker } from '../Middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';
import { sendSalonUpdate } from '../Services/notificationService.js';

const newWigRouter = Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

newWigRouter.post('/send-summary-email', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wigData, pdfBase64 } = req.body;
    const attachments: any[] = [];
    
    if (pdfBase64) {
      const base64DataClean = pdfBase64.split(",")[1];
      attachments.push({
        filename: `Deal-Summary-${wigData.orderCode}.pdf`,
        content: base64DataClean,
        encoding: 'base64',
        contentType: 'application/pdf'
      });
    }

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; font-size: 16px;">
        <h2>היי! הזמנה חדשה נסגרה 🎉</h2>
        <p>לקוחה: <strong>${wigData.customerName}</strong></p>
        <p>קוד פאה: <strong>${wigData.orderCode}</strong></p>
        <p>מצורף למייל זה קובץ PDF רשמי ומסודר עם כל פרטי העסקה.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"WigFlow System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `מסמך עסקת פאה נסגרה! - פאה ${wigData.orderCode}`,
      html: htmlContent,
      attachments: attachments
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

// --- שאר הנתיבים ---
newWigRouter.post('/new', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newWig = await newWigService.createNewWig(req.body);
    res.status(201).json({ success: true, data: newWig }); 
  } catch (error) {
    next(error); 
  }
});

newWigRouter.get('/', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigs = await newWigService.getAllWigsWithWorkers();
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

newWigRouter.get('/work-station/:workerId', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wigs = await newWigService.getWigsByWorker(req.params.workerId);
    res.status(200).json({ success: true, data: wigs });
  } catch (error) {
    next(error);
  }
});

newWigRouter.get('/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wig = await newWigService.getNewWigById(req.params.id);
    res.status(200).json({ success: true, data: wig });
  } catch (error) {
    next(error);
  }
});

newWigRouter.patch('/:id/next-step', verifyWorker, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nextWorkerId, nextWorkerIds } = req.body; 
    const workerIds = nextWorkerIds || (nextWorkerId ? [nextWorkerId] : []);
    const updatedWig = await newWigService.moveToNextStage(req.params.id, workerIds);
    res.status(200).json(updatedWig); 
  } catch (error) {
    next(error);
  }
});

newWigRouter.patch('/:id/urgency', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isUrgent } = req.body;
    const updatedWig = await newWigService.updateWigUrgency(req.params.id, isUrgent);
    res.status(200).json(updatedWig);
  } catch (error) {
    next(error);
  }
});

newWigRouter.get('/history/:barcode', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await newWigService.getWigHistoryByBarcode(req.params.barcode);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

newWigRouter.delete('/:id', verifyAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode || adminCode !== process.env.ADMIN_DELETE_CODE) {
      res.status(403).json({ message: 'קוד מנהל שגוי או חסר. הפעולה נדחתה.' });
      return; 
    }

    const { id } = req.params;
    await newWigService.deleteWig(id); 

    res.status(200).json({ message: 'הפאה נמחקה בהצלחה.' });
  } catch (error) {
    next(error);
  }
});

newWigRouter.patch('/:id/special-notes', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    const updatedWig = await newWigService.updateSpecialNotes(req.params.id, notes);
    res.status(200).json({ success: true, data: updatedWig });
  } catch (error) {
    next(error);
  }
});


newWigRouter.patch('/:id/deliver', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedWig = await newWigService.markWigAsDelivered(req.params.id);
  
    if (updatedWig) {
      sendSalonUpdate(updatedWig, 'נמסר ללקוחה (העסקה הושלמה!)').catch((err: any) => 
        console.error(`Failed to send WhatsApp delivery notification: ${err.message}`)
      );
    }

    res.status(200).json({ success: true, message: 'הפאה עודכנה כנמסרה, נשלח וואטסאפ, והיא הוסרה מהדאשבורד', data: updatedWig });
  } catch (error) {
    next(error);
  }
});

export default newWigRouter;