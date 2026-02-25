import { connectDB } from './Utils/connectDB';
import { User } from './Models_Service/User/userModel';

const seedDatabase = async () => {
  try {
    await connectDB();
    
    await User.deleteMany({});
    
    await User.create({
      username: 'מרים',
      password: '123456',
      role: 'Worker',
      specialty: 'אישור התאמה'
    });

    console.log('✅ נתונים ראשוניים נוצרו בהצלחה!');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  }
};

seedDatabase();
