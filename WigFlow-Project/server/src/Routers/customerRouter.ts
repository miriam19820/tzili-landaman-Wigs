import { Router } from 'express';
import { Customer } from '../Models_Service/Customer/customerModel';

const customerRouter = Router();

customerRouter.get('/search/:idNumber', async (req, res) => {
  try {
    const { idNumber } = req.params;
    const customer = await Customer.findOne({ idNumber });
    if (customer) {
      res.json({ exists: true, customer });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בחיפוש לקוחה' });
  }
});

customerRouter.post('/', async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת לקוחה', error: error.message });
  }
});


customerRouter.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת לקוחות' });
  }
});

export default customerRouter;