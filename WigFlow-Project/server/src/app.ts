import express from 'express';
import cors from 'cors';

import userRouter from './Routers/userRouter';
import customerRouter from './Routers/customerRouter'; 
import newWigRouter from './Routers/newWigRouter';
import repairRouter from './Routers/repairRouter';
import serviceRouter from './Routers/serviceRouter';

const app = express();

// הגדרות שרת בסיסיות
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // מאפשר קריאת נתונים מטפסים מורכבים

// חיבור כל הראוטרים (נתיבי ה-API)
app.use('/api/users', userRouter);
app.use('/api/customers', customerRouter);
app.use('/api/wigs', newWigRouter);
app.use('/api/repairs', repairRouter);
app.use('/api/services', serviceRouter);

// תופס שגיאות גלובלי (Error Handler)
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'שגיאה פנימית בשרת'
  });
});

export default app;