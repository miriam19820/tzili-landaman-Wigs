import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 


const STAGES_FLOW = [
  'הזמנה התקבלה',
  'אישור התאמה ורישום',
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

export const createNewWig = async (wigData: any) => {
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};

export const moveToNextStage = async (wigId: string, nextWorkerId: string) => {
  const wig = await NewWig.findById(wigId);
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);

  if (currentStageIndex === -1 || currentStageIndex === STAGES_FLOW.length - 1) {
    throw new AppError('הפאה כבר נמצאת בשלב האחרון או שהסטטוס אינו תקין', 400);
  }

  const nextStage = STAGES_FLOW[currentStageIndex + 1];

  const nextWorker = await User.findById(nextWorkerId);
  if (!nextWorker) {
    throw new AppError('העובדת הבאה לא נמצאה במערכת', 404);
  }

 

  if (nextStage === 'התאמת שיער') {
  
    if (nextWorker.specialty !== 'התאמת שיער' && nextWorker.specialty !== 'תפירה') {
      throw new AppError('שגיאת ניתוב: משימות התאמת שיער חייבות לעבור לעובדת מורשית', 400);
    }
  }

  if (nextStage === 'תפירת פאה') {
    if (nextWorker.specialty !== 'תפירה') {
      throw new AppError('שגיאת ניתוב: משימות תפירה חייבות לעבור לעובדת עם התמחות "תפירה"', 400);
    }
  }

  if (nextStage === 'צבע') {
    if (nextWorker.specialty !== 'צבע') {
      throw new AppError('שגיאת ניתוב: משימות צבע חייבות לעבור לעובדת עם התמחות "צבע"', 400);
    }
  }

  if (nextStage === 'עבודת יד') {
    if (nextWorker.specialty !== 'עבודת יד') {
      throw new AppError('שגיאת ניתוב: משימות עבודת יד חייבות לעבור לעובדת עם התמחות "עבודת יד"', 400);
    }
  }

  if (nextStage === 'חפיפה') {
    if (nextWorker.specialty !== 'חפיפה') {
      throw new AppError('שגיאת ניתוב: משימות חפיפה חייבות לעבור לעובדת עם התמחות "חפיפה"', 400);
    }
  }

  if (nextStage === 'בקרה') {
  
    if (nextWorker.specialty !== 'בקרה' && nextWorker.specialty !== 'QA') {
      throw new AppError('שגיאת ניתוב: משימות בקרה חייבות לעבור למבקרת איכות (QA)', 400);
    }
  }
  
  
  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorker: nextWorkerId
    },
    { new: true }
  ).populate('customer').populate('assignedWorker');

  return updatedWig;
};
export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorker: workerId })
         .populate('customer');
};
