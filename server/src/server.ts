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
    phoneNumber: '050-1234567', 
    email: 'sara@example.com' 
  });
  
  const user = await User.create({ 
    username: 'מרים', 
    role: 'Admin', 
    specialty: 'סרוק' 
  });
  
  await Service.create({ 
    customer: customer._id, 
    serviceType: 'Comb', 
    style: 'גלי', 
    assignedWorker: user._id 
  });
  
  await NewWig.create({ 
    customer: customer._id, 
    wigType: 'פאה אירופאית', 
    length: '50 ס"מ', 
    color: 'חום', 
    measurements: { head: 56 }, 
    currentStage: 'תפירה', 
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
};

startServer();
