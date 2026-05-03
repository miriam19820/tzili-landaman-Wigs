import { Router } from 'express';
import { Customer } from '../Models_Service/Customer/customerModel.js';
import * as customerService from '../Models_Service/Customer/customerService.js'; 
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware.js';

const customerRouter = Router();


customerRouter.get('/search/:query', verifyToken, async (req, res) => {
  try {
    const { query } = req.params;
    
    const isId = /^\d+$/.test(query);

    let customer;

    if (isId) {
      customer = await Customer.findOne({ idNumber: query });
    } else {
      const nameParts = query.trim().split(/\s+/);
      
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' '); 
        customer = await Customer.findOne({ 
          firstName: new RegExp('^' + firstName + '$', 'i'),
          lastName: new RegExp('^' + lastName + '$', 'i') 
        });
      } else {
        customer = await Customer.findOne({ 
          $or: [
            { firstName: new RegExp('^' + query + '$', 'i') },
            { lastName: new RegExp('^' + query + '$', 'i') }
          ]
        });
      }
    }

    if (customer) {
      res.json({ exists: true, customer });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בחיפוש לקוחה' });
  }
});

customerRouter.post('/', verifyToken, async (req, res) => {
  try {
    const newCustomer = await customerService.createCustomer(req.body);
    res.status(201).json(newCustomer);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: 'שגיאה ביצירת לקוחה', error: error.message });
  }
});


customerRouter.get('/', verifyAdmin, async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת לקוחות' });
  }
});


customerRouter.post('/:id/notes', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, context } = req.body;

    const author = (req as any).user?.username || 'עובדת מערכת';

    const updatedCustomer = await customerService.addInternalNote(id, {
      content,
      author,
      context 
    });

    res.status(200).json({ 
      success: true, 
      message: 'ההערה נוספה בהצלחה ליומן הלקוחה',
      notes: updatedCustomer.internalNotes 
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ 
      message: 'שגיאה בהוספת הערה ליומן', 
      error: error.message 
    });
  }
});
customerRouter.delete('/:id/notes/:noteId', verifyToken, async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const updatedCustomer = await customerService.deleteInternalNote(id, noteId);
    
    res.status(200).json({ 
      success: true, 
      message: 'ההערה נמחקה בהצלחה',
      notes: updatedCustomer.internalNotes 
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ 
      message: 'שגיאה במחיקת הערה', 
      error: error.message 
    });
  }
});

export default customerRouter;