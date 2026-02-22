import app from './app';
import { connectDB } from './Utils/connectDB';
import './Models_Service/Customer/customerModel';
import './Models_Service/User/userModel';
import './Models_Service/NewWigs/newWigModel';

const PORT = 3000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`-----------------------------------------`);
      console.log(`🚀 השרת פועל בהצלחה בפורט: ${PORT}`);
      console.log(`✅ כעת ניתן לשלוח בקשות מ-Postman`);
      console.log(`-----------------------------------------`);
    });

  } catch (error) {
    console.error('שגיאה בהפעלת השרת:', error);
    process.exit(1);
  }
};

startServer();