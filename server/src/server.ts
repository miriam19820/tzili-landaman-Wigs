import app from './app';
import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { Repair } from './Models_Service/Repairs/repairModel';

const startServer = async () => {
  await connectDB();
  
  const customer = await Customer.create({ 
    firstName: 'שרה', 
    lastName: 'כהן', 
    idNumber: '012345678', // עודכן לפי הטופס
    phoneNumber: '050-1234567', 
    email: 'sara@example.com',
    address: 'רחוב יפו 100, ירושלים' // עודכן לפי הטופס
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
  
  // פאה חדשה מעודכנת לפי הטופס במקום measurements
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
  
  console.log('כל הטבלאות נוצרו עם נתונים תואמים לטופס!');
};

startServer();