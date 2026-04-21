import { Schema, model, Document } from 'mongoose';


export interface IUser extends Document {
  username: string;
  password: string; 
  fullName: string;
  role: 'Admin' | 'Worker' | 'QC' | 'Secretary' | 'Inspector';
  specialty: string;
  workload?: number; 
}

const userSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Worker', 'QC', 'Secretary', 'Inspector'], 
    required: true 
  },
  specialty: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('workload', {
  ref: 'NewWig',        
  localField: '_id',     
 foreignField: 'assignedWorkers',
  count: true        
});


export const User = model<IUser>('User', userSchema);