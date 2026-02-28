import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Worker', 'QC'], 
    required: true 
  },
  specialty: { type: String, required: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// השדה הוירטואלי - מעודכן לפי NewWig
userSchema.virtual('workload', {
  ref: 'NewWig',          // השם המדויק מהמודל של הפאות
  localField: '_id',      // ה-ID של המשתמשת
  foreignField: 'assignedWorker', // השדה ב-NewWig שמחזיק את ה-ID של העובדת
  count: true             // פשוט לספור כמה כאלו יש
});

export const User = model('User', userSchema);