import express from 'express';
import cors from 'cors';
import newWigRouter from './Routers/newWigRouter';
import serviceRouter from './Routers/serviceRouter';
import userRouter from './Routers/userRouter';
import repairRouter from './Routers/repairRouter';
import { errorHandler } from './Middlewares/errorHandling';

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/wigs', newWigRouter);
app.use('/api/services', serviceRouter);
app.use('/api/users', userRouter);
app.use('/api/repairs', repairRouter);

// Error Handler - חייב להיות אחרון!
app.use(errorHandler);

export default app;
