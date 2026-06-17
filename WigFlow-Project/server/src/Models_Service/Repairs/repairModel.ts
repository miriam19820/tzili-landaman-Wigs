import { Schema, model, Document } from 'mongoose';

// מיפוי קטגוריות ותתי-שירותים - נשמר ללא שינוי לבקשתך
const CATEGORY_MAP: Record<string, string[]> = {
  'צבע': ['גוונים', 'שורש', 'שטיפה לעש', 'הבהרה לבלונד'],
  'מכונה': [
    'העברת רשת', 'תיקון רשת', 'התקנת לייס', 'התקנת ריבן', 
    'התקנת סקין', 'השטחת סקין', 'הארכת פאה', 'דילול טרסים', 
    'מילוי טרסים', 'קיצור פאה'
  ],
  'עבודת יד': ['מילוי לייס', 'מילוי ריבן', 'בייביהייר', 'ע"י ישנה', 'גובה בקודקוד'],
  'חפיפה': ['חלק', 'מוברש', 'גלי', 'תלתלים', 'ייבוש טבעי', 'בייביליס'],
  'בקרה': ['בדיקה סופית']
};

export interface IRepair extends Document {
  wigCode: string; 
  wigType: string; 
  customer: Schema.Types.ObjectId;
  isUrgent: boolean;
  overallStatus: 'בתיקון' | 'בחפיפה' | 'בבקרה' | 'מוכן';
  
  // משימות התיקון
  tasks: {
    category: string;
    subCategory: string; 
    assignedTo: Schema.Types.ObjectId; 
    status: 'ממתין' | 'בוצע';
    notes?: string;
    deadline?: Date;
    completedAt?: Date; 
  }[];

  // --- שדות צילום ותיעוד (התוספת החדשה) ---
  
  // צילום הפיאה והתקלה בעת ההגעה לסלון (לפני)
  beforeImageUrl?: string; 
  defectImageUrl?: string; // צילום ספציפי של התקלה
  
  // צילום הפיאה המוכנה לאחר אישור המבקרת (אחרי)
  afterImageUrl?: string; 
  
  // נתוני המבקרת שאישרה את התיקון
  inspectedBy?: Schema.Types.ObjectId; // קישור למשתמש מסוג Inspector/Admin
  inspectedAt?: Date; // תאריך ושעת האישור הסופי
  
  // במקרה של פסילה בבקרת איכות
  qaRejectionPhoto?: string; // צילום הבעיה שהמבקרת מצאה (יוצג לעובדת)
  qaNote?: string; // הערה מילולית מהמבקרת על מה שדורש תיקון חוזר
  
  images?: string[]; // גלריה כללית של תמונות נוספות
  internalNote?: string; 
}

const taskSchema = new Schema({
  category: { type: String, required: true, enum: Object.keys(CATEGORY_MAP) },
  subCategory: { 
    type: String, 
    required: true,
    validate: {
      validator: function(this: any, value: string) {
        const category = this.category;
        return CATEGORY_MAP[category] && CATEGORY_MAP[category].includes(value);
      },
      message: (props: any) => `${props.value} אינו תת-תיקון תקין עבור הקטגוריה שנבחרה`
    }
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['ממתין', 'בוצע'], default: 'ממתין' },
  notes: { type: String, default: "" },
  deadline: { type: Date },
  completedAt: { type: Date } 
});

const repairSchema = new Schema<IRepair>({
  wigCode: { type: String, required: true },
  wigType: { type: String, default: 'פאה אירופאית' }, 
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  isUrgent: { type: Boolean, default: false },
  overallStatus: { 
    type: String, 
    enum: ['בתיקון', 'בחפיפה', 'בבקרה', 'מוכן'], 
    default: 'בתיקון' 
  },
  tasks: [taskSchema],

  // הגדרת השדות החדשים ב-Schema
  beforeImageUrl: { type: String },
  defectImageUrl: { type: String },
  afterImageUrl: { type: String },
  
  inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  inspectedAt: { type: Date },
  
  qaRejectionPhoto: { type: String },
  qaNote: { type: String },

  images: [{ type: String }], 
  internalNote: { type: String },
}, { timestamps: true }); // timestamps מוסיף אוטומטית createdAt ו-updatedAt

export const Repair = model<IRepair>('Repair', repairSchema);