import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

export const createNewWig = async (wigData: any) => {
  if (!wigData.measurements) {
    throw new AppError('חובה להזין מידות לקוחה בשלב פתיחת ההזמנה', 400);
  }
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};

/**
 * העברה לשלב הבא וניהול סיום תהליך מול מפתחת 4
 * הוספנו תמיכה ב- specificWorkerId כדי לאפשר בחירה חכמה של עובדת
 */
export const moveToNextStage = async (wigId: string, specificWorkerId?: string) => {
  console.log('moveToNextStage called with:', { wigId, specificWorkerId });
  
  const wig = await NewWig.findById(wigId);
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  console.log('Current wig stage:', wig.currentStage);
  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
  console.log('Current stage index:', currentStageIndex);

  if (currentStageIndex === -1) {
    throw new AppError('סטטוס פאה אינו תקין', 400);
  }

  // --- התיקון: הבדיקה היא אם סיימנו את שלב החפיפה ---
  // אם השלב הנוכחי הוא 'חפיפה' (העובדת סיימה לחפוף ולחצה אישור)
  if (wig.currentStage === 'חפיפה') {
    console.log('Finished Wash stage, moving to QA and creating service');
    
    // 1. מעביר את המשימה למפתחת 4 (מחלקת QA)
    await Service.create({
      customer: wig.customer,
      serviceType: 'Production QA',
      origin: 'NewWig',
      newWigReference: wig._id,
      status: 'QA',
      notes: { secretary: 'פאה חדשה מסיום ייצור (עברה חפיפה)' }
    });

    // 2. מעדכן את הפאה לשלב 'בקרה' (ומנקה את העובדת כי זה כבר ב-QA)
    return await NewWig.findByIdAndUpdate(
      wigId, 
      { 
        currentStage: 'בקרה',
        assignedWorker: null 
      }, 
      { new: true }
    ).populate('customer');
  }

  // הגנה: אם מנסים להעביר פאה שכבר נמצאת בבקרה
  if (currentStageIndex >= STAGES_FLOW.length - 2) {
      throw new AppError('הפאה כבר בשלבי סיום (בקרה) ולא ניתן להעביר אותה הלאה מפס הייצור', 400);
  }

  // --- לוגיקה רגילה לשאר השלבים (מתפירה לצבע וכו') ---
  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  console.log('Next stage:', nextStage);
  
  // בחירת העובדת לשלב הבא
  let nextWorker;
  
  if (specificWorkerId) {
    console.log('Using specific worker ID:', specificWorkerId);
    // אם המשתמשת בחרה עובדת ספציפית מהמסך - נשתמש בה
    nextWorker = await User.findById(specificWorkerId);
  } else {
    console.log('Finding worker for specialty:', getSpecialtyForStage(nextStage));
    // אחרת - נחפש באופן אוטומטי עובדת (מתאים למקרים שיש רק עובדת אחת באותו תפקיד)
    nextWorker = await User.findOne({ 
      role: 'Worker',
      specialty: getSpecialtyForStage(nextStage)
    });
  }
  
  console.log('Next worker found:', nextWorker ? nextWorker.username : 'None');
  
  if (!nextWorker) {
    throw new AppError(`לא נמצאה עובדת מתאימה לשלב הבא (${nextStage})`, 404);
  }

  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorker: nextWorker._id
    },
    { new: true }
  ).populate('customer').populate('assignedWorker');

  console.log('Wig updated successfully');
  return updatedWig;
};

const getSpecialtyForStage = (stage: string): string => {
  const specialtyMap: Record<string, string> = {
    'התאמת שיער': 'התאמת שיער',
    'תפירת פאה': 'תפירה',
    'צבע': 'צבע',
    'עבודת יד': 'עבודת יד',
    'חפיפה': 'חפיפה',
    'בקרה': 'בקרת איכות'
  };
  return specialtyMap[stage] || 'כללי';
};

export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorker: workerId }).populate('customer');
};