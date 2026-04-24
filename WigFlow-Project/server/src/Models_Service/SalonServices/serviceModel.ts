
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
  status: 'ממתין לחפיפה' | 'ממתין לסירוק' | 'בביצוע' | 'בייבוש' | 'בבדיקה' | 'מוכן';
}

const serviceSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

<<<<<<< HEAD
  // סוג השירות המבוקש [cite: 139, 120]
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
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

<<<<<<< HEAD
  // סגנון הסירוק [cite: 141, 121]
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  styleCategory: { 
    type: String, 
    enum: ['חלק', 'מוברש', 'גלי', 'תלתלים', 'טבעי', 'בייביליס', 'ללא'],
    default: 'ללא'
  },

<<<<<<< HEAD
// חפשי את האזור הזה בתוך ה-new Schema({ ... })
notes: {
  secretary: { type: String, default: "" },
  worker: { type: String, default: "" },
  qa: { type: String, default: "" } // כאן נשמרת הערת הפסילה שלך
},

// ומיד מתחת לזה, ודאי שגם הסטטוס מעודכן:
status: { 
  type: String, 
  enum: ['ממתין לחפיפה', 'ממתין לסירוק', 'בביצוע', 'בייבוש', 'בבדיקה', 'מוכן', 'תיקון'], 
  default: 'ממתין לחפיפה' 
},

// ואפשר להוסיף גם את המחיר לסיום שבוע 2/תחילת 3:
price: { type: Number, default: 0 }
},
 { timestamps: true });

export const Service = model<IService>('Service', serviceSchema);
=======
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
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
