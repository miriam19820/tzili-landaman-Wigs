import { Schema, model } from 'mongoose';

const newWigSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderCode: { type: String }, 
  receivedBy: { type: String }, 
  wigMakerName: { type: String }, 
  receivedDate: { type: Date, default: Date.now }, 
  targetDate: { type: Date }, 

  netSize: { 
    type: String, 
    uppercase: true,
    trim: true,     
    enum: ['XS', 'S', 'M', 'L', 'XL'] 
  },

<<<<<<< HEAD
  hairType: { 
    type: String, 
    enum: ['חלק', 'שיער תנועתי', 'שיער גלי', 'מתולתל'] 
  },

=======
>>>>>>> f514276d700e85a8075a6e6e0830bc2843dc3126
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

  price: { type: Number }, 
  advancePayment: { type: Number },
  balancePayment: { type: Number },

  customerSignature: { type: String },
  specialNotes: { type: String },

  currentStage: { 
    type: String, 
    required: true,
    enum: [
      'הזמנה התקבלה',     
      'אישור התאמה ורישום', 
      'התאמת שיער', 
      'תפירת פאה', 
      'צבע', 
      'עבודת יד', 
      'חפיפה',            
      'בקרה'              
    ]
  },
  assignedWorker: { type: Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });

export const NewWig = model('NewWig', newWigSchema);