import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String }, // נוסף: ת.ז.
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String } // נוסף: כתובת
});

export const Customer = model('Customer', customerSchema);