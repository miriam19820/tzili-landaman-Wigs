import { Schema, model, Document } from 'mongoose';

export interface IWigHistory extends Document {
  wigCode: string;          // קוד הפאה (למשל WIG-1234)
  actionType: 'יצור' | 'תיקון' | 'סירוק' | 'הערת מנהלת'; 
  stage: string;            // השלב (למשל: התאמת שיער, בקרת איכות)
  workerName: string;       // מי ביצעה את הפעולה
  description: string;      // תיאור חופשי של מה שקרה
  beforeImageUrl?: string;  // תמונה לפני
  afterImageUrl?: string;   // תמונה אחרי
  notes?: string;           // הערה ספציפית של מנהלת
  createdAt: Date;
}

const wigHistorySchema = new Schema<IWigHistory>({
  wigCode: { type: String, required: true, index: true },
  actionType: { type: String, required: true },
  stage: String,
  workerName: String,
  description: String,
  beforeImageUrl: String,
  afterImageUrl: String,
  notes: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const WigHistory = model<IWigHistory>('WigHistory', wigHistorySchema);