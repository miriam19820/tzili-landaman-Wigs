import { connectDB } from './Utils/connectDB';
import { User } from './Models_Service/User/userModel';
import { Customer } from './Models_Service/Customer/customerModel';

const debug = async () => {
  try {
    await connectDB();
    
    console.log('\n=== העתיקי את ה-IDs עבור פוסטמן ===');
    
    const customers = await Customer.find({});
    console.log('\n--- לקוחות (עבור שדה customerId) ---');
    if (customers.length === 0) console.log('לא נמצאו לקוחות במערכת.');
    customers.forEach(c => {
      console.log(`${c.firstName} ${c.lastName}: ${c._id}`);
    });
    
    const users = await User.find({});
    console.log('\n--- עובדות (עבור שדות washerId / adminId / assignedTo) ---');
    if (users.length === 0) console.log('לא נמצאו עובדות במערכת.');
    users.forEach(u => {
      console.log(`${u.username} (${u.specialty}): ${u._id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('שגיאה בהרצת הדיבאג:', error);
    process.exit(1);
  }
};

debug();