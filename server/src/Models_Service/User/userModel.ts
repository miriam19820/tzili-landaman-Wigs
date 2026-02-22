import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Worker'], required: true },
  specialty: { type: String, required: true }
});

export const User = model('User', userSchema);
