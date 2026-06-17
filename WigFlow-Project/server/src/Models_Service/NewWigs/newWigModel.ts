import { Schema, model, Document } from 'mongoose';

export interface INewWig extends Document {
  customer: Schema.Types.ObjectId;
  orderCode: string;
  wigType: string;
  hairType: string;
  currentStage: string;
  assignedWorkers: Schema.Types.ObjectId[];
  history: {            
    stage: string;
    date: Date;
    worker?: string;
  }[];
  measurements: {
    circumference: number;
    earToEar: number;
    frontToBack: number;
  };
  isUrgent: boolean;
  receivedBy: string;
  wigMakerName: string;
  receivedDate: Date;
  targetDate: Date;
  stageAssignments: Map<string, string[]>;
  stageDeadlines: Map<string, Date>;
  netSize: string;
  napeLength: string;
  topLayering: string;
  baseColor: string;
  highlightsWefts: string;
  highlightsSkin: string;
  topConstruction: string;
  topNotes: string;
  frontNotes: string;
  frontStyle: string[];
  imageUrl: string;
  price: number;
  advancePayment: number;
  balancePayment: number;
  customerSignature: string;
  specialNotes: string;
  qaNote?: string;
  pendingRepairStages?: string[];
}

const newWigSchema = new Schema<INewWig>({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderCode: { type: String, required: true, unique: true },
  wigType: { type: String, default: 'פאה אירופאית' }, 
  receivedBy: { type: String },
  wigMakerName: { type: String },
  receivedDate: { type: Date, default: Date.now },
  targetDate: { type: Date },

  isUrgent: { type: Boolean, default: false },

  history: [{
    stage: String,
    date: { type: Date, default: Date.now },
    worker: String
  }],

 
  measurements: {
    circumference: { type: Number },
    earToEar: { type: Number },
    frontToBack: { type: Number }
  },

  stageAssignments: {
    type: Map,
    of: [{ type: String }]
  },

  stageDeadlines: {
    type: Map,
    of: Date
  },

  netSize: {
    type: String,
    uppercase: true,
    trim: true,
    enum: ['XS', 'S', 'M', 'L', 'XL']
  },

  hairType: {
    type: String,
    enum: ['חלק', 'שיער תנועתי', 'שיער גלי', 'מתולתל']
  },

  napeLength: { type: String },
  topLayering: { type: String },
  baseColor: { type: String },
  highlightsWefts: { type: String },
  highlightsSkin: { type: String },

  topConstruction: {
    type: String,
    enum: ['סקין', 'שבלול', 'לייסטופ', 'לייס פרונט', 'דיפ לייס']
  },
  topNotes: { type: String },

  frontNotes: { type: String },
  frontStyle: [{ type: String }],

  imageUrl: { type: String },

  price: { type: Number },
  advancePayment: { type: Number },
  balancePayment: { type: Number },
  customerSignature: { type: String },
  specialNotes: { type: String },

  currentStage: {
    type: String,
    required: true,
    default: 'התאמת שיער',
    enum: [
      'התאמת שיער',
      'תפירת פאה',
      'צבע',
      'עבודת יד',
      'חפיפה',
      'בקרה',
      'מוכנה למסירה'
    ]
  },

  assignedWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  qaNote: { type: String, default: '' },
  pendingRepairStages: [{ type: String }]

}, {
  timestamps: true
});

export const NewWig = model<INewWig>('NewWig', newWigSchema);