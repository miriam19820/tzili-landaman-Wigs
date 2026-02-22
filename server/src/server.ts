import app from './app';
import { connectDB } from './Utils/connectDB';
import './Models_Service/Customer/customerModel';
import './Models_Service/User/userModel';
import './Models_Service/NewWigs/newWigModel';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { Repair } from './Models_Service/Repairs/repairModel';

const PORT = 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    // נתוני דמו מחני
    const customer = await Customer.create({ 
      firstName: 'שרה', 
      lastName: 'כהן', 
      idNumber: '012345678',
      phoneNumber: '050-1234567', 
      email: 'sara@example.com',
      address: 'רחוב יפו 100, ירושלים'
    });
    
    const user = await User.create({ 
      username: 'מרים', 
      role: 'Admin', 
      specialty: 'סרוק' 
    });
    
    await Service.create({ 
      customer: customer._id, 
      serviceType: 'Style Only', 
      styleCategory: 'גלי',
      assignedWorker: user._id 
    });
    
    await NewWig.create({ 
      customer: customer._id,
      orderCode: 'ORD-1234',
      netSize: 'M',
      hairType: 'שיער תנועתי',
      napeLength: 'ארוך',
      baseColor: 'שטני',
      topConstruction: 'לייס פרונט',
      frontStyle: 'בייבי הייר קל',
      price: 8500,
      advancePayment: 2000,
      currentStage: 'הזמנה התקבלה', 
      assignedWorker: user._id 
    });
    
    await Repair.create({ 
      customer: customer._id, 
      isUrgent: true, 
      tasks: [{ 
        taskType: 'תיקון תפרים', 
        assignedTo: user._id, 
        status: 'בתהליך' 
      }] 
    });
    
    console.log('כל הטבלאות נוצרו עם נתונים!');
    
    app.listen(PORT, () => {
      console.log(`-----------------------------------------`);
      console.log(`🚀 השרת פועל בהצלחה בפורט: ${PORT}`);
      console.log(`✅ כעת ניתן לשלוח בקשות מ-Postman`);
      console.log(`-----------------------------------------`);
    });

  } catch (error) {
    console.error('שגיאה בהפעלת השרת:', error);
    process.exit(1);
  }
};

startServer();