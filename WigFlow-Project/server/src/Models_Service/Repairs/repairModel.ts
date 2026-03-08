import { Schema, model } from 'mongoose';

// הגדרת טיפוס כדי למנוע שגיאות TypeScript
const CATEGORY_MAP: Record<string, string[]> = {
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

const taskSchema = new Schema({
  category: { 
    type: String, 
    required: true, 
    enum: Object.keys(CATEGORY_MAP) 
  },
  subCategory: { 
    type: String, 
    required: true,
    validate: {
      validator: function(this: any, value: string) {
        // מוודא שהתת-קטגוריה אכן קיימת בתוך הקטגוריה שנבחרה
        const category = this.category;
        return CATEGORY_MAP[category] && CATEGORY_MAP[category].includes(value);
      },
      message: (props: any) => `${props.value} אינו תת-תיקון תקין עבור הקטגוריה שנבחרה`
    }
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

const repairSchema = new Schema({
  wigCode: { 
    type: String, 
    required: true 
    // הוסר unique: true כי לקוחה יכולה להביא את אותה הפאה לתיקון פעמים שונות בעתיד
  },
  customer: { 
    type: Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  isUrgent: { 
    type: Boolean, 
    default: false 
  },
  overallStatus: { 
    type: String, 
    enum: ['בתיקון', 'בחפיפה', 'בבקרה', 'מוכן'], 
    default: 'בתיקון' 
  },
  tasks: [taskSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Repair = model('Repair', repairSchema);