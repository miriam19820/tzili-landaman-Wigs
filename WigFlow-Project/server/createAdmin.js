const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/wigflow')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      fullName: String,
      role: String,
      specialty: String
    }));

    await User.deleteOne({ username: 'admin' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'מנהל המערכת',
      role: 'Admin',
      specialty: 'ניהול'
    });
    
    console.log('✅ Admin created: admin / password123');
    process.exit(0);
  });
