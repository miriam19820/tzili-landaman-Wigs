import { Router } from 'express';
import { Customer } from '../Models_Service/Customer/customerModel';
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';

const customerRouter = Router();

// חיפוש לקוחה לפי תעודת זהות (כל משתמש מחובר, כי גם עובדות צריכות לחפש בתיקונים)
customerRouter.get('/search/:idNumber', verifyToken, async (req, res) => {
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

// יצירת לקוחה חדשה (כל משתמש מחובר, בשביל "רישום מהיר" מעמדת העובדת)
customerRouter.post('/', verifyToken, async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת לקוחה', error: error.message });
  }
});

// שליפת כל הלקוחות למסך הניהול (רק מנהלת!)
customerRouter.get('/', verifyAdmin, async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת לקוחות' });
  }
});

export default customerRouter;