import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Repair } from './Models_Service/Repairs/repairModel';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    await connectDB();
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Repair.deleteMany({}); 

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. יצירת הלקוחה שרה כהן עם הת"ז שמופיעה בשגיאה שלך
    const customer = await Customer.create({
      firstName: 'שרה',
      lastName: 'כהן',
      idNumber: '329520449', 
      phoneNumber: '050-1234567',
      email: 'sara@example.com',
      address: 'רחוב יפו 100, ירושלים'
    });

    // 2. יצירת צוות - עובדת אחת לכל קטגוריה שקיימת בטופס שלך
    // חשוב: כולן role: 'Worker' כדי שהחיפוש בשרת ימצא אותן!
    await User.create({ username: 'hodaya', fullName: 'הודיה (צבע)', password: hashedPassword, role: 'Worker', specialty: 'צבע' });
    await User.create({ username: 'lifshi', fullName: 'ליפשי (מכונה)', password: hashedPassword, role: 'Worker', specialty: 'מכונה' });
    await User.create({ username: 'miri', fullName: 'מירי (עבודת יד)', password: hashedPassword, role: 'Worker', specialty: 'עבודת יד' });
    await User.create({ username: 'miriam', fullName: 'מרים (חפיפה)', password: hashedPassword, role: 'Worker', specialty: 'חפיפה' });
    
    // הפתרון לרשימת ה-QA הריקה:
    await User.create({ username: 'racheli', fullName: 'רחלי (בקרה)', password: hashedPassword, role: 'Worker', specialty: 'בקרה' });

    console.log('✅ הנתונים עודכנו! כל העובדות והמחלקות מאוישות.');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  }
};
seedData();