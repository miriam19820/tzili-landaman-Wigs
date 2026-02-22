import express from 'express';
import newWigRouter from './Routers/newWigRouter'; 

const app = express();

app.use(express.json());


app.use('/api/wigs', newWigRouter); 

export default app;