import express from 'express';
import serviceRouter from './Models_Service/SalonServices/serviceRoutes';
const app = express();

app.use(express.json());
app.use('/api/services', serviceRouter);
export default app;
