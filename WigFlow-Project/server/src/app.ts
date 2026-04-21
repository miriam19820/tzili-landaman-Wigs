import express from 'express';
import cors from 'cors';

import userRouter from './Routers/userRouter.js';
import customerRouter from './Routers/customerRouter.js'; 
import newWigRouter from './Routers/newWigRouter.js';
import repairRouter from './Routers/repairRouter.js';
import serviceRouter from './Routers/serviceRouter.js';

const app = express();

app.use(cors());

// --- התיקון עבור שגיאה 413: הגדלת מגבלת הגודל של הבקשות ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/users', userRouter);
app.use('/api/customers', customerRouter);
app.use('/api/wigs', newWigRouter);
app.use('/api/repairs', repairRouter);
app.use('/api/services', serviceRouter);

// Middleware לטיפול בשגיאות
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'שגיאה פנימית בשרת'
  });
});

export default app;