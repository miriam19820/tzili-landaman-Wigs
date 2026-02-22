import { Schema, model } from 'mongoose';

// ריכוז כל הנתונים של הסלון במקום אחד לניהול קל
const CATEGORY_MAP = {
  'צבע': ['גוונים', 'שורש', 'שטיפה לעש', 'הבהרה לבלונד'],
  'מכונה': [
    'העברת רשת', 'תיקון רשת', 'התקנת לייס', 'התקנת ריבן', 
    'התקנת סקין', 'להשטיח סקין', 'הארכת פאה', 'דילול טרסים', 
    'מילוי טרסים', 'קיצור פאה'
  ],
  'עבודת יד': ['מילוי לייס', 'מילוי ריבן', 'בייביהייר', 'ע"י ישנה', 'גובה בקודקוד'],
  'חפיפה': ['חלק', 'מוברש', 'גלי', 'תלתלים', 'ייבוש טבעי', 'בייביליס'],
  'בקרה': ['בדיקה סופית']
};

// סכימה עבור משימה בודדת (משימה אחת בתוך רשימת תיקונים)
const taskSchema = new Schema({
  category: { 
    type: String, 
    required: true, 
    enum: Object.keys(CATEGORY_MAP) 
  },
subCategory: { 
  type: String, 
  required: true
},
assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['ממתין', 'בוצע'], 
    default: 'ממתין' 
  },
  notes: { 
    type: String, 
    default: "" 
  }
});

// הסכימה הראשית של התיקונים
const repairSchema = new Schema({
  wigCode: { type: String, required: true, unique: true },
  customer: { 
    type: Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  isUrgent: { 
    type: Boolean, 
    default: false 
  },overallStatus: { 
    type: String, 
    enum: ['בתיקון', 'בחפיפה', 'בבקרה', 'מוכן'], 
    default: 'בתיקון' 
  },
  // רשימה משתנה של משימות עבור פאה אחת
  tasks: [taskSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Repair = model('Repair', repairSchema);