import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  serviceType: { type: String, enum: ['Comb', 'Wash'], required: true },
  style: { type: String, required: true },
  assignedWorker: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Service = model('Service', serviceSchema);
