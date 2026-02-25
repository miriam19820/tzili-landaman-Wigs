import { connectDB } from './Utils/connectDB';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { User } from './Models_Service/User/userModel';

const updateWig = async () => {
  await connectDB();
  
  // מוצא את הפאה עם קוד 12
  const wig = await NewWig.findOne({ orderCode: '12' });
  if (wig) {
    // מוצא עובדת התאמת שיער
    const worker = await User.findOne({ specialty: 'התאמת שיער' });
    
    if (worker) {
      await NewWig.updateOne(
        { orderCode: '12' },
        { 
          currentStage: 'התאמת שיער',
          assignedWorker: worker._id
        }
      );
      console.log('הפאה עודכנה בהצלחה לשלב התאמת שיער');
    }
  }
  
  process.exit(0);
};

updateWig();