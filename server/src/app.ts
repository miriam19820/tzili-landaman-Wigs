import express from 'express';
import cors from 'cors';
import newWigRouter from './Routers/newWigRouter';
import serviceRouter from './Models_Service/SalonServices/serviceRoutes';
import userRouter from './Routers/userRouter';

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());

// Routes
app.use('/api/wigs', newWigRouter);
app.use('/api/services', serviceRouter);
app.use('/api/users', userRouter);

export default app;
