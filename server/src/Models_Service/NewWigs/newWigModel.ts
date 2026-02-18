import { Schema, model } from 'mongoose';

const newWigSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  wigType: { type: String, required: true },
  length: { type: String, required: true },
  color: { type: String, required: true },
  measurements: { type: Object, required: true },
  currentStage: { type: String, required: true },
  assignedWorker: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const NewWig = model('NewWig', newWigSchema);
