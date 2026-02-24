import { Schema, model } from 'mongoose';

const newWigSchema = new Schema({
<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
 
=======
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderCode: { type: String, required: true, unique: true }, 
  receivedBy: { type: String }, 
  wigMakerName: { type: String }, 
  receivedDate: { type: Date, default: Date.now }, 
  targetDate: { type: Date }, 

<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
 
  measurements: {
    circumference: { type: Number, required: true }, 
    earToEar: { type: Number, required: true },      
    frontToBack: { type: Number, required: true }    
  },

=======
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts
  netSize: { 
    type: String, 
    uppercase: true,
    trim: true,     
    enum: ['XS', 'S', 'M', 'L', 'XL'] 
  },
<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
=======

<<<<<<< HEAD
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts
  hairType: { 
    type: String, 
    enum: ['חלק', 'שיער תנועתי', 'שיער גלי', 'מתולתל'] 
  },
<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
=======

=======
>>>>>>> f514276d700e85a8075a6e6e0830bc2843dc3126
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts
  napeLength: { type: String }, 

  baseColor: { type: String }, 
  highlightsWefts: { type: String }, 
  highlightsSkin: { type: String }, 

  topConstruction: { 
    type: String, 
    enum: ['סקין', 'שבלול', 'לייסטופ', 'לייס פרונט', 'דיפ לייס'] 
  },
  topNotes: { type: String }, 


  frontNotes: { type: String }, 

  imageUrl: { type: String },


  price: { type: Number }, 
  advancePayment: { type: Number },
  balancePayment: { type: Number },
  customerSignature: { type: String }, 
  specialNotes: { type: String },

  currentStage: { 
    type: String, 
    required: true,
<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
    default: 'התאמת שיער', 
    enum: [
=======
    enum: [
      'הזמנה התקבלה',     
      'אישור התאמה ורישום', 
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts
      'התאמת שיער', 
      'תפירת פאה', 
      'צבע', 
      'עבודת יד', 
      'חפיפה',            
      'בקרה'              
    ]
  },
  assignedWorker: { type: Schema.Types.ObjectId, ref: 'User', required: true }

<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/NewWigs/newWigModel.ts
}, { 
  timestamps: true 
});
=======
}, { timestamps: true });
>>>>>>> origin/miryami:server/src/Models_Service/NewWigs/newWigModel.ts

export const NewWig = model('NewWig', newWigSchema);