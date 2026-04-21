import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  customer: Schema.Types.ObjectId;
  serviceType: 'Wash & Style' | 'Wash Only' | 'Style Only' | 'Production QA' | 'Repair QA';
  origin: 'Service' | 'NewWig' | 'Repair';
  newWigReference?: Schema.Types.ObjectId;
  repairReference?: Schema.Types.ObjectId;
  assignedTo?: Schema.Types.ObjectId;
  styleCategory: 'חלק' | 'מוברש' | 'גלי' | 'תלתלים' | 'טבעי' | 'בייביליס' | 'ללא';
  notes: {
    secretary: string;
    worker: string;
    qa: string;
  };
  dryingStartTime?: Date;
  isUrgent: boolean;
  status: 'Pending Wash' | 'Pending Style' | 'In Progress' | 'Drying' | 'QA' | 'Ready' | 'Rejected';
  
  // --- שדות חדשים לתיעוד ויזואלי ובקרה ---
  beforeImageUrl?: string;    // תמונת הפאה/התקלה בעת הקבלה (היסטוריה "לפני")
  defectImageUrl?: string;    // צילום ספציפי של הבעיה בתיקון
  afterImageUrl?: string;     // תמונת הפיאה המוכנה לאחר אישור (הוכחת "אחרי")
  qaRejectionPhoto?: string;  // צילום של מה שלא היה תקין (לממשק העובדת)
  inspectedBy?: Schema.Types.ObjectId; // המבקרת שביצעה את הבדיקה האחרונה
  inspectedAt?: Date;         // זמן הבדיקה המדויק
}

const serviceSchema = new Schema<IService>({
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
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
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
  dryingStartTime: Date,
  isUrgent: { type: Boolean, default: false }, 
  status: { 
    type: String, 
    enum: ['Pending Wash', 'Pending Style', 'In Progress', 'Drying', 'QA', 'Ready', 'Rejected'], 
    default: 'Pending Wash' 
  },
  // הגדרת השדות החדשים ב-Schema
  beforeImageUrl: String,
  defectImageUrl: String,
  afterImageUrl: String,
  qaRejectionPhoto: String,
  inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  inspectedAt: Date
}, { timestamps: true });

export const Service = model<IService>('Service', serviceSchema);