import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String }, 
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  city: { type: String } 
});

export const Customer = model('Customer', customerSchema);