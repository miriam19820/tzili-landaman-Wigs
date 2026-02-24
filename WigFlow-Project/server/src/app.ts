import express from 'express';
import cors from 'cors';

// ייבוא הראוטרים מתיקיית Routers
import userRouter from './Routers/userRouter';
import customerRouter from './Routers/customerRouter'; // הראוטר החדש שיצרנו
import newWigRouter from './Routers/newWigRouter';
import repairRouter from './Routers/repairRouter';
import serviceRouter from './Routers/serviceRouter';

const app = express();

// הגדרות בסיס (Middlewares)
app.use(cors());
app.use(express.json());

// --- חיבור כל הראוטרים למערכת ---

// ניהול המשתמשים (צוות העובדות והמזכירה)
app.use('/api/users', userRouter);

// ניהול הלקוחות (חיפוש לפי ת"ז, רישום לקוחה חדשה ורשימת לקוחות)
app.use('/api/customers', customerRouter);

// מפתחת 2: פאות חדשות (פס ייצור והזמנות)
app.use('/api/wigs', newWigRouter);

// מפתחת 3: תיקונים
app.use('/api/repairs', repairRouter);

// מפתחת 4: שירותי סלון (חפיפה/סירוק) ובקרת איכות (QA)
app.use('/api/services', serviceRouter);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'שגיאה פנימית בשרת'
  });
});

export default app;