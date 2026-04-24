import { connectDB } from './Utils/connectDB';
import { User } from './Models_Service/User/userModel';
import { Customer } from './Models_Service/Customer/customerModel';
import { NewWig } from './Models_Service/NewWigs/newWigModel'; // ייבוא מודל הפאות

const debug = async () => {
  try {
    await connectDB();
    
    console.log('\n=== IDs מעודכנים עבור פוסטמן ===');
    
    // שליפת פאות - עבור הנתיבים של מפתחת 2 ו-4
    const wigs = await NewWig.find({});
    console.log('\n--- פאות (להעתקה עבור ה-URL בפוסטמן) ---');
    if (wigs.length === 0) console.log('לא נמצאו פאות במערכת.');
    wigs.forEach(w => {
      console.log(`פאה ${w.orderCode}: ${w._id}`);
    });

    // שליפת לקוחות
    const customers = await Customer.find({});
    console.log('\n--- לקוחות (עבור שדה customerId) ---');
    if (customers.length === 0) console.log('לא נמצאו לקוחות במערכת.');
    customers.forEach(c => {
      console.log(`${c.firstName} ${c.lastName}: ${c._id}`);
    });
    
    // שליפת עובדות
    const users = await User.find({});
    console.log('\n--- עובדות (עבור שדות washerId / adminId / assignedTo / nextWorkerId) ---');
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