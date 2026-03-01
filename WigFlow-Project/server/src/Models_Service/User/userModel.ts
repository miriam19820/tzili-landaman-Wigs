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

userSchema.virtual('workload', {
  ref: 'NewWig',        
  localField: '_id',     
  foreignField: 'assignedWorker', 
  count: true        
});

export const User = model('User', userSchema);