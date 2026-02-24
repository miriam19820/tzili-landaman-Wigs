import { connectDB } from './Utils/connectDB';
import { NewWig } from './Models_Service/NewWigs/newWigModel';
import { User } from './Models_Service/User/userModel';
import { Customer } from './Models_Service/Customer/customerModel';

const debug = async () => {
  await connectDB();
  
  console.log('=== בדיקת נתונים ===');
  
  const wigs = await NewWig.find({}).populate('customer').populate('assignedWorker');
  console.log('פאות במערכת:', wigs.length);
  wigs.forEach(wig => {
    console.log(`- ${wig.orderCode}: ${wig.currentStage} (${(wig.customer as any)?.firstName} ${(wig.customer as any)?.lastName})`);
  });
  
  const users = await User.find({});
  console.log('\nעובדות במערכת:', users.length);
  users.forEach(user => {
    console.log(`- ${user.username}: ${user.specialty} (${user.role})`);
  });
  
  const customers = await Customer.find({});
  console.log('\nלקוחות במערכת:', customers.length);
  
  process.exit(0);
};

debug();