import app from './app';
import 'dotenv/config';
import { connectDB } from './Utils/connectDB';

// ייבוא המודלים (חשוב מאוד לרישום הסכמות ב-Mongoose)
import './Models_Service/Customer/customerModel';
import './Models_Service/User/userModel';
import './Models_Service/NewWigs/newWigModel';
import './Models_Service/SalonServices/serviceModel';

// פורט 5000 עדיף כדי לא להתנגש עם ה-React
const PORT = 5000;

const startServer = async () => {
  try {
    // 1. התחברות למסד הנתונים
    await connectDB();
    console.log('✅ Connected to MongoDB Successfully');
    
    // 2. הפעלת השרת
    app.listen(PORT, () => {
      console.log(`-----------------------------------------`);
      console.log(`🚀 השרת פועל בהצלחה בפורט: ${PORT}`);
      console.log(`🔗 Waiting for you at: http://localhost:${PORT}`);
      console.log(`✅ כעת ניתן לשלוח בקשות מ-Postman`);
      console.log(`-----------------------------------------`);
    });

  } catch (error) {
    console.error('❌ שגיאה קריטית בהפעלת השרת:', error);
    process.exit(1);
  }
};

startServer();