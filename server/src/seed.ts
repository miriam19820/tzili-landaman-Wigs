import { connectDB } from './config/database';
import { Customer } from './models/Customer';
import { User } from './models/User';
import { Service } from './models/Service';
import { NewWig } from './models/NewWig';
import { Repair } from './models/Repair';

const seedData = async () => {
  await connectDB();

  const customer = await Customer.create({
    firstName: 'שרה',
    lastName: 'כהן',
    phoneNumber: '050-1234567',
    email: 'sara@example.com'
  });

  const user = await User.create({
    username: 'מרים',
    role: 'Worker',
    specialty: 'סרוק'
  });

  await Service.create({
    customer: customer._id,
    serviceType: 'Comb',
    style: 'גלי',
    assignedWorker: user._id
  });

  console.log('נתונים נוצרו בהצלחה!');
  process.exit(0);
};

seedData();
