const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/wigflow')
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      fullName: String,
      role: String,
      specialty: String
    }));

    const user = await User.findOne({ username: 'admin' });
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('Username:', user.username);
      console.log('Role:', user.role);
      
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password match:', isMatch ? 'YES ✅' : 'NO ❌');
    }
    
    process.exit(0);
  });
