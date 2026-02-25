import express from 'express';
import serviceRouter from './Routers/serviceRouter';
import newWigRouter from './Routers/newWigRouter'; 
const app = express();

app.use(express.json());
app.use('/api/services', serviceRouter);
app.use('/api/wigs', newWigRouter); 

export default app;

