import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { Repair } from './Models_Service/Repairs/repairModel';

const seedData = async () => {
  try {
    await connectDB();

    // 1. ניקוי הנתונים הישנים מכל הטבלאות
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await NewWig.deleteMany({});
    await Repair.deleteMany({}); // ניקוי תיקונים ישנים

    // 2. יצירת לקוחה לדוגמה
    const customer = await Customer.create({
      firstName: 'שרה',
      lastName: 'כהן',
      idNumber: '012345678',
      phoneNumber: '050-1234567',
      email: 'sara@example.com',
      address: 'רחוב יפו 100, ירושלים'
    });

    // 3. יצירת צוות עובדות עם שדות חובה (fullName ו-password)
    const commonPassword = 'password123';

    const worker1 = await User.create({ 
      username: 'הני', 
      fullName: 'הני כהן', 
      password: commonPassword, 
      role: 'Worker', 
      specialty: 'התאמת שיער' 
    });
    
    const worker2 = await User.create({ 
      username: 'טעמא', 
      fullName: 'טעמא לוי', 
      password: commonPassword, 
      role: 'Worker', 
      specialty: 'תפירה' 
    });
    
    const worker3 = await User.create({ 
      username: 'הודיה', 
      fullName: 'הודיה אברהם', 
      password: commonPassword, 
      role: 'Worker', 
      specialty: 'צבע' 
    });
    
    const worker4 = await User.create({ 
      username: 'מירי', 
      fullName: 'מירי שטרן', 
      password: commonPassword, 
      role: 'Worker', 
      specialty: 'עבודת יד' 
    });
    
    const worker5 = await User.create({ 
      username: 'מרים', 
      fullName: 'מרים וייס', 
      password: commonPassword, 
      role: 'Worker', 
      specialty: 'חפיפה' 
    });
    
    const worker6 = await User.create({ 
      username: 'תהילה', 
      fullName: 'תהילה מנהלת', 
      password: commonPassword, 
      role: 'QC', // תפקיד בקרת איכות
      specialty: 'בקרת איכות' 
    });

    // 4. יצירת הזמנת פאה חדשה לדוגמה
    await NewWig.create({
      customer: customer._id,
      orderCode: 'ORD-9876',
      receivedBy: 'המזכירה',
      wigMakerName: 'הני',
      measurements: { circumference: 54, earToEar: 30, frontToBack: 35 },
      netSize: 'XS', 
      hairType: 'שיער גלי',
      napeLength: 'ארוך',
      baseColor: 'חום כהה',
      highlightsWefts: 'בלונד עדין',
      highlightsSkin: 'ללא',
      topConstruction: 'לייס פרונט',
      topNotes: 'להקפיד על שביל טבעי',
      frontStyle: 'בייבי הייר קל',
      frontNotes: 'לא צפוף מדי',
      price: 9500,
      advancePayment: 3000,
      currentStage: 'התאמת שיער',
      assignedWorker: worker1._id
    });

    console.log('✅ הנתונים עודכנו בהצלחה כולל שדות חובה וניקוי תיקונים!');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה במהלך הרצת ה-Seed:', error);
    process.exit(1);
  }
};

seedData();