// import { Schema, model } from 'mongoose';

// const serviceSchema = new Schema({
//   customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
//   serviceType: { type: String, enum: ['Comb', 'Wash'], required: true },
//   style: { type: String, required: true },
//   assignedWorker: { type: Schema.Types.ObjectId, ref: 'User', required: true }
// });

// export const Service = model('Service', serviceSchema);

// import { Schema, model } from 'mongoose';

// const serviceSchema = new Schema({
//   customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
//   // סוג השירות המבוקש [cite: 139, 120]
//   serviceType: { 
//     type: String, 
//     enum: ['Wash & Style', 'Wash Only', 'Style Only'], 
//     required: true 
//   },
//   // סגנון הסירוק [cite: 141, 121]
//   styleCategory: { 
//     type: String, 
//     enum: ['חלק', 'מוברש', 'גלי', 'תלתלים', ' יבוש טבעי', 'ביביליס'],
//     required: true
//   },
//   // שדות הערות דינמיים [cite: 142, 159]
//   notes: {
//     secretary: String,
//     worker: String,
//     qa: String
//   },
//   // ניהול זמני ייבוש [cite: 150, 123]
  // dryingStartTime: Date,
//   isUrgent: { type: Boolean, default: false }, // לטובת סנכרון דחיפות [cite: 164, 126]
//   status: { 
//     type: String, 
//     enum: ['Pending', 'In Progress', 'Drying', 'QA', 'Ready'], 
//     default: 'Pending' 
//   }
// }, { timestamps: true });

// export const Service = model('Service', serviceSchema);

import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  // קישור ללקוחה
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

  // סוג השירות המבוקש [cite: 139, 120]
  serviceType: { 
    type: String, 
    enum: ['Wash & Style', 'Wash Only', 'Style Only', 'Production QA', 'Repair QA'], 
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
    enum: ['חלק', 'מוברש', 'גלי', 'תלתלים', ' טבעי', 'בייביליס', 'ללא'],
    default: 'None'
  },

  // שדות הערות דינמיים המשותפים למזכירה, לעובדת ולמבקרת [cite: 142, 159]
  notes: {
    secretary: String,
    worker: String,
    qa: String
  },

  // ניהול זמני ייבוש לצורך התראות [cite: 150, 123]
  dryingStartTime: Date,

  // לטובת סנכרון דחיפות והקפצה לראש התור [cite: 164, 126]
  isUrgent: { type: Boolean, default: false }, 

  // ניהול סטטוס המשימה עד למסירה [cite: 131, 157]
status: { 
    type: String, 
    enum: ['Pending Wash', 'Pending Style', 'In Progress', 'Drying', 'QA', 'Ready'], 
    default: 'Pending Wash' 
  }
}, { timestamps: true });

export const Service = model('Service', serviceSchema);