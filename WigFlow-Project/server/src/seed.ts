import { connectDB } from './Utils/connectDB.js';
import { Customer } from './Models_Service/Customer/customerModel.js';
import { User } from './Models_Service/User/userModel.js';
import { Repair } from './Models_Service/Repairs/repairModel.js';
import { NewWig } from './Models_Service/NewWigs/newWigModel.js';
import { Service } from './Models_Service/SalonServices/serviceModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
   
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Repair.deleteMany({});
    await NewWig.deleteMany({});
    await Service.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    console.log('🔑 פרטי כניסה לבדיקה:');
    console.log('👤 משתמש: admin | סיסמה: password123');

    // 1. יצירת לקוחה לדוגמה
    await Customer.create({
      firstName: 'מרים',
      lastName: 'גליק',
      idNumber: '329520449', 
      phoneNumber: '0583241344',
      email: 'miriamm41344@gmail.com',
      address: 'ישעיהו הנביא 1, בית שמש'
    });

    await User.create({ 
        username: 'שרה', 
        fullName: 'שרה (התאמת שיער)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'התאמת שיער' 
    });

    // עובדת לשלב 2: תפירת פאה (בשרת מוגדר כ'תפירה')
    await User.create({ 
        username: 'ליפשי', 
        fullName: 'ליפשי (תפירה)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'תפירה' 
    });

    // עובדת לשלב 3: צבע
    await User.create({ 
        username: 'הודיה', 
        fullName: 'הודיה (צבע)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'צבע' 
    });

    // עובדת לשלב 4: עבודת יד
    await User.create({ 
        username: 'מירי', 
        fullName: 'מירי (עבודת יד)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'עבודת יד' 
    });

    // עובדת לשלב 5: חפיפה
    await User.create({ 
        username: 'תמי', 
        fullName: 'תמי (חפיפה)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'חפיפה' 
    });
    
    // עובדת לשלב 6: בקרה (בשרת מוגדר כ'בקרת איכות')
    await User.create({ 
        username: 'רחלי', 
        fullName: 'רחלי (בקרה)', 
        password: hashedPassword, 
        role: 'Worker', 
        specialty: 'בקרת איכות' 
    });

    // 3. יצירת מנהל מערכת
    await User.create({ 
        username: 'admin', 
        fullName: 'מנהל המערכת', 
        password: hashedPassword, 
        role: 'Admin', 
        specialty: 'ניהול' 
    });
    if (process.env.NODE_ENV === 'production') {
    console.log("סכנה: אי אפשר להריץ Seed על השרת האמיתי!");
    process.exit(1);
}

    console.log('\n✅ הנתונים עודכנו בהצלחה!');
    console.log('🚀 כעת ניתן לפתוח הזמנות חדשות ולהעביר אותן בכל שלבי הייצור.');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה בהרצת ה-Seed:', error);
    process.exit(1);
  }
};

seedData();