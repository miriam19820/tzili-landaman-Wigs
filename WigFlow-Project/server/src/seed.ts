import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { Repair } from './Models_Service/Repairs/repairModel';

const seedData = async () => {
  await connectDB();


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
    role: 'Worker',
    specialty: 'סרוק'
  });

  // 3. יצירת שירות כללי (חפיפה/סירוק)
  await Service.create({
    customer: customer._id,
    serviceType: 'Comb',
    style: 'גלי',
    assignedWorker: user._id
  });

  // 4. יצירת הזמנת פאה חדשה - מותאם במלואו לטופס הפיזי
  await NewWig.create({
    customer: customer._id,
    orderCode: 'ORD-9876',
    receivedBy: 'חני',
    wigMakerName: 'רחלי',
    
    // סעיף 1: רשת
    netSize: 'xs', 
    
    // סעיף 2: סוג שיער
    hairType: 'שיער גלי',
    
    // סעיף 3: אורך
    napeLength: 'ארוך',
    topLayering: 'עדין',
    
    // סעיף 4: צבע
    baseColor: 'חום כהה',
    highlightsWefts: 'בלונד עדין',
    highlightsSkin: 'ללא',
    
    // סעיף 5: סקין/טופ
    topConstruction: 'לייס פרונט',
    topNotes: 'להקפיד על שביל טבעי',
    
    // סעיף 6: פרונט
    frontStyle: 'בייבי הייר קל',
    frontNotes: 'לא צפוף מדי',
    
    // מחירים ותשלום
    price: 9500,
    advancePayment: 3000,
    
    // ניהול תהליך עבודה
    currentStage: 'הזמנה התקבלה',
    assignedWorker: user._id
  });

  console.log('נתונים נוצרו בהצלחה! (כולל לקוחה מעודכנת והזמנת פאה מלאה)');
  process.exit(0);
};

seedData();