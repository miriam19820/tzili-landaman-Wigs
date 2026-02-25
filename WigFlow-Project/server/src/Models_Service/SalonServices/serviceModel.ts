
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
  // קישור ללקוחה
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

  // סוג השירות המבוקש [cite: 139, 120]
  serviceType: { 
    type: String, 
     enum: ['חפיפה וסירוק', 'חפיפה בלבד', 'סירוק בלבד', 'בקרת ייצור', 'בקרת תיקון'],
    required: true 
  },

  // מקור המשימה - זהו השדה הקריטי שמאפשר לקבל משימות ממפתחת 2 ומפתחת 3 
  origin: { 
    type: String, 
    enum: ['Service', 'NewWig', 'Repair'], 
    default: 'Service',
    required: true
  },

  // קישורים טכניים למזהים של המפתחות האחרות (כדי שתוכלי למשוך את פרטי הפאה שלהן) 
  newWigReference: { type: Schema.Types.ObjectId, ref: 'NewWig' },
  repairReference: { type: Schema.Types.ObjectId, ref: 'Repair' },

  // סגנון הסירוק [cite: 141, 121]
  styleCategory: { 
    type: String, 
    enum: ['חלק', 'מוברש', 'גלי', 'תלתלים', 'טבעי', 'בייביליס', 'ללא'],
    default: 'ללא'
  },

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