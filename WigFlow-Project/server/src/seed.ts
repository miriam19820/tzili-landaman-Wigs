import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel';

const seedData = async () => {
  await connectDB();

  // 1. ניקוי הנתונים הישנים
  await Customer.deleteMany({});
  await User.deleteMany({});
  await Service.deleteMany({});
  await NewWig.deleteMany({});

  // 2. יצירת לקוחה
  const customer = await Customer.create({
    firstName: 'שרה',
    lastName: 'כהן',
    idNumber: '012345678',
    phoneNumber: '050-1234567',
    email: 'sara@example.com',
    address: 'רחוב יפו 100, ירושלים'
  });

  // 3. יצירת צוות עובדות מדויק לפי מסמך מפתחת 2
  const worker1 = await User.create({ username: 'הני', role: 'Worker', specialty: 'התאמת שיער' });
  const worker2 = await User.create({ username: 'טעמא', role: 'Worker', specialty: 'תפירה' });
  const worker3 = await User.create({ username: 'הודיה', role: 'Worker', specialty: 'צבע' });
  const worker4 = await User.create({ username: 'מירי', role: 'Worker', specialty: 'עבודת יד' });
  const worker5 = await User.create({ username: 'מרים', role: 'Worker', specialty: 'חפיפה' });
  const worker6 = await User.create({ username: 'תהילה', role: 'Worker', specialty: 'בקרת איכות' });

  // 4. יצירת הזמנת פאה חדשה - מתחילה ישר אצל הני בהתאמת שיער
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
    
    // הפאה מתחילה מיד בשלב הראשון לפי האפיון
    currentStage: 'התאמת שיער',
    assignedWorker: worker1._id
  });

  console.log('✅ הנתונים עודכנו בהצלחה לפי מסמך האפיון של מפתחת 2!');
  process.exit(0);
};

seedData();