import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true }
});

export const Customer = model('Customer', customerSchema);
