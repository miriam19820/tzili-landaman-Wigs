import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { Repair } from './Models_Service/Repairs/repairModel';
import bcrypt from 'bcryptjs'; // <-- הוספנו את ספריית ההצפנה!

const seedData = async () => {
  try {
    await connectDB();

    await Customer.deleteMany({});
    await User.deleteMany({});
    await Service.deleteMany({});
    await NewWig.deleteMany({});
    await Repair.deleteMany({}); 

    // 2. יצירת לקוחה לדוגמה
    const customer = await Customer.create({
      firstName: 'שרה',
      lastName: 'כהן',
      idNumber: '012345678',
      phoneNumber: '050-1234567',
      email: 'sara@example.com',
      address: 'רחוב יפו 100, ירושלים'
    });

    // 3. הצפנת הסיסמה לפני השמירה (זה מה שהיה חסר!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const worker1 = await User.create({ 
      username: 'הני', 
      fullName: 'הני כהן', 
      password: hashedPassword, 
      role: 'Worker', 
      specialty: 'התאמת שיער' 
    });
    
    const worker2 = await User.create({ 
      username: 'טעמא', 
      fullName: 'טעמא לוי', 
      password: hashedPassword, 
      role: 'Worker', 
      specialty: 'תפירה' 
    });
    
    const worker3 = await User.create({ 
      username: 'הודיה', 
      fullName: 'הודיה אברהם', 
      password: hashedPassword, 
      role: 'Worker', 
      specialty: 'צבע' 
    });
    
    const worker4 = await User.create({ 
      username: 'מירי', 
      fullName: 'מירי שטרן', 
      password: hashedPassword, 
      role: 'Worker', 
      specialty: 'עבודת יד' 
    });
    
    const worker5 = await User.create({ 
      username: 'מרים', 
      fullName: 'מרים וייס', 
      password: hashedPassword, 
      role: 'Worker', 
      specialty: 'חפיפה' 
    });
    
    const worker6 = await User.create({ 
      username: 'תהילה', 
      fullName: 'תהילה מנהלת', 
      password: hashedPassword, 
      role: 'QC', 
      specialty: 'בקרת איכות' 
    });
    const adminUser = await User.create({ 
      username: 'admin', 
      fullName: 'מזכירה ראשית', 
      password: hashedPassword, 
      role: 'Admin', 
      specialty: 'כללי' 
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

    console.log('✅ הנתונים עודכנו בהצלחה כולל סיסמאות מוצפנות!');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה במהלך הרצת ה-Seed:', error);
    process.exit(1);
  }
};

seedData();