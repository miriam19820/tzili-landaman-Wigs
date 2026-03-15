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
    console.log('🔑 סיסמה: password123');
    console.log('🔐 סיסמה מוצפנת:', hashedPassword);

    
    const customer = await Customer.create({
      firstName: 'מרים',
      lastName: 'גליק',
      idNumber: '329520449', 
      phoneNumber: '0583241344',
      email: 'miriamm41344@gmail.com',
      address: 'ישעיהו הנביא 1, בית שמש'
    });

    // 2. יצירת צוות - עובדת אחת לכל קטגוריה שקיימת בטופס שלך
    // חשוב: כולן role: 'Worker' כדי שהחיפוש בשרת ימצא אותן!
    await User.create({ username: 'הודיה', fullName: 'הודיה (צבע)', password: hashedPassword, role: 'Worker', specialty: 'צבע' });
    await User.create({ username: 'ליפשי', fullName: 'ליפשי (מכונה)', password: hashedPassword, role: 'Worker', specialty: 'מכונה' });
    await User.create({ username: 'מירי', fullName: 'מירי (עבודת יד)', password: hashedPassword, role: 'Worker', specialty: 'עבודת יד' });
    await User.create({ username: 'מרים', fullName: 'מרים (חפיפה)', password: hashedPassword, role: 'Worker', specialty: 'חפיפה' });
    
    // הפתרון לרשימת ה-QA הריקה:
    await User.create({ username: 'רחלי', fullName: 'רחלי (בקרה)', password: hashedPassword, role: 'Worker', specialty: 'בקרה' });

    // משתמש מנהל
    await User.create({ username: 'admin', fullName: 'מנהל המערכת', password: hashedPassword, role: 'Admin', specialty: 'ניהול' });

    console.log('✅ הנתונים עודכנו! כל העובדות והמחלקות מאוישות.');
    console.log('👤 כניסה כמנהל: admin / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  }
};
seedData();