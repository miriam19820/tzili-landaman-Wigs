import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 הערה: ודאי ש-MongoDB רץ מקומית או התקיני אותו מ: https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
};
