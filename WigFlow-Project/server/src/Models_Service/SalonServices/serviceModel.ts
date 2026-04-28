import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  customer: Schema.Types.ObjectId;
  serviceType: 'חפיפה וסירוק' | 'חפיפה בלבד' | 'סירוק בלבד' | 'בקרת ייצור' | 'בקרת תיקון';
  origin: 'Service' | 'NewWig' | 'Repair';
  newWigReference?: Schema.Types.ObjectId;
  repairReference?: Schema.Types.ObjectId;
  styleCategory: 'חלק' | 'מוברש' | 'גלי' | 'תלתלים' | 'טבעי' | 'בייביליס' | 'ללא';
  notes?: {
    secretary?: string;
    worker?: string;
    qa?: string;
  };
  dryingStartTime?: Date;
  isUrgent: boolean;
  status: 'ממתין לחפיפה' | 'ממתין לסירוק' | 'בביצוע' | 'בייבוש' | 'בבדיקה' | 'מוכן' | 'תיקון';
  price: number;
}

const serviceSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

  serviceType: { 
    type: String, 
    enum: ['חפיפה וסירוק', 'חפיפה בלבד', 'סירוק בלבד', 'בקרת ייצור', 'בקרת תיקון'],
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
    secretary: { type: String, default: "" },
    worker: { type: String, default: "" },
    qa: { type: String, default: "" } 
  },

  status: { 
    type: String, 
    enum: ['ממתין לחפיפה', 'ממתין לסירוק', 'בביצוע', 'בייבוש', 'בבדיקה', 'מוכן', 'תיקון'], 
    default: 'ממתין לחפיפה' 
  },

  price: { type: Number, default: 0 },
  isUrgent: { type: Boolean, default: false }

}, { timestamps: true });

export const Service = model<IService>('Service', serviceSchema);