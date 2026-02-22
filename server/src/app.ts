import express from 'express';
import cors from 'cors'; // כדאי להוסיף כדי שהריאקט יוכל לדבר עם השרת
import userRouter from './Routers/userRouter'; // שימי לב לנתיב המדויק אצלך


const app = express();

// Middlewares - הגדרות בסיסיות
app.use(cors()); 
app.use(express.json());

// Routes - חיבור הנתיבים
// כאן את אומרת לשרת: "כל מה שמתחיל ב- /api/users, תשלח ל-userRouter"
app.use('/api/users', userRouter);

export default app;