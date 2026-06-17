import { Schema, model } from 'mongoose';

const customerSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String }, 
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  imageUrl: { type: String },
  

  internalNotes: [{
    content: { type: String, required: true },    
    createdAt: { type: Date, default: Date.now },
    author: { type: String },                     
    context: { type: String }                     
  }]
}, { timestamps: true });

export const Customer = model('Customer', customerSchema);