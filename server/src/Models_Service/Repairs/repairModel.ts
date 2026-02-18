import { Schema, model } from 'mongoose';

const repairSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  isUrgent: { type: Boolean, required: true },
  tasks: [{
    taskType: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true }
  }]
});

export const Repair = model('Repair', repairSchema);
