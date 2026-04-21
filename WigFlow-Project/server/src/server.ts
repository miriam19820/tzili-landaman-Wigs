// 1. טעינת משתני הסביבה (חייב להיות ראשון)
import 'dotenv/config'; 

import app from './app.js'; 
// 2. התיקון: הוספנו סוגריים מסולסלים סביב connectDB
import { connectDB } from './Utils/connectDB.js'; 

// ייבוא המודלים
import './Models_Service/Customer/customerModel.js';
import './Models_Service/User/userModel.js';
import './Models_Service/NewWigs/newWigModel.js';
import './Models_Service/SalonServices/serviceModel.js';
import './Models_Service/Repairs/repairModel.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // חיבור למסד הנתונים
    await connectDB();
    console.log('✅ Connected to MongoDB Successfully');
    
    // בדיקת הגדרות מייל בטרמינל
    console.log(`-----------------------------------------`);
    console.log(`📧 בדיקת הגדרות מייל: ${process.env.EMAIL_USER ? '✅ נטען' : '❌ חסר'}`);
    console.log(`-----------------------------------------`);

    app.listen(PORT, () => {
      console.log(`🚀 השרת פועל בהצלחה בפורט: ${PORT}`);
      console.log(`🔗 Waiting for you at: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ שגיאה קריטית בהפעלת השרת:', error);
    process.exit(1);
  }
};

startServer();