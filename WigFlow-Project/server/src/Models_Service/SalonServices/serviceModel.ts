import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

  serviceType: { 
    type: String, 
    enum: ['Wash & Style', 'Wash Only', 'Style Only', 'Production QA', 'Repair QA'], 
    required: true 
  },

  origin: { 
    type: String, 
    enum: ['Service', 'NewWig', 'Repair'], 
    default: 'Service',
    required: true
  },

  newWigReference: { type: Schema.Types.ObjectId, ref: 'NewWig' },
  repairReference: { type: Schema.Types.ObjectId, ref: 'Repair' },

  styleCategory: { 
    type: String, 
    enum: ['חלק', 'מוברש', 'גלי', 'תלתלים', 'טבעי', 'בייביליס', 'ללא'],
    default: 'ללא'
  },

  notes: {
    secretary: String,
    worker: String,
    qa: String
  },

  dryingStartTime: Date,

  isUrgent: { type: Boolean, default: false }, 

  status: { 
    type: String, 
    enum: ['Pending Wash', 'Pending Style', 'In Progress', 'Drying', 'QA', 'Ready'], 
    default: 'Pending Wash' 
  }
}, { timestamps: true });

export const Service = model('Service', serviceSchema);
