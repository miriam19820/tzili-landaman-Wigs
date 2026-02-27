import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 

// הגדרת סדר השלבים בפס הייצור
const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

/**
 * 1. יצירת הזמנת פאה חדשה
 */
export const createNewWig = async (wigData: any) => {
  if (!wigData.measurements) {
    throw new AppError('חובה להזין מידות לקוחה בשלב פתיחת ההזמנה', 400);
  }
  // יצירת הפאה - כולל שדה isUrgent אם נשלח מהקליינט
  return await NewWig.create(wigData);
};

/**
 * 2. שליפת פאה ספציפית לפי ID
 */
export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};

/**
 * 3. שליפת כל הפאות של עובדת מסוימת - כולל לוגיקת דחוף
 */
export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorker: workerId })
    .populate('customer')
    // מיון: קודם כל דחוף (true יופיע ראשון), ואז לפי סדר כרונולוגי
    .sort({ isUrgent: -1, createdAt: 1 });
};

/**
 * 4. העברה לשלב הבא בייצור וניהול הרשאות/עובדות
 */
export const moveToNextStage = async (wigId: string, specificWorkerId?: string) => {
  const wig = await NewWig.findById(wigId);
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);

  if (currentStageIndex === -1) {
    throw new AppError('סטטוס פאה אינו תקין', 400);
  }

  // בדיקה אם הגענו לשלב האחרון (בקרה) - יצירת שירות QA
  if (currentStageIndex === STAGES_FLOW.length - 1) {
    await Service.create({
      customer: wig.customer,
      serviceType: 'Production QA',
      origin: 'NewWig',
      newWigReference: wig._id,
      status: 'QA',
      notes: { secretary: 'פאה חדשה מסיום ייצור' }
    });

    return await NewWig.findByIdAndUpdate(wigId, { currentStage: 'בקרה' }, { new: true });
  }

  // הגדרת השלב הבא
  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  let nextWorker;
  
  // אם נבחרה עובדת ספציפית (למשל על ידי המזכירה)
  if (specificWorkerId) {
    nextWorker = await User.findById(specificWorkerId);
  } else {
    // חיפוש אוטומטי של עובדת לפי המומחיות שמתאימה לשלב הבא
    nextWorker = await User.findOne({ 
      role: 'Worker',
      specialty: getSpecialtyForStage(nextStage)
    });
  }
  
  if (!nextWorker) {
    throw new AppError(`לא נמצאה עובדת פנויה עם מומחיות ב${getSpecialtyForStage(nextStage)}`, 404);
  }

  // עדכון הפאה לשלב הבא והצמדת העובדת החדשה
  return await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorker: nextWorker._id
    },
    { new: true }
  ).populate('customer').populate('assignedWorker');
};

/**
 * פונקציית עזר לתרגום שלב בייצור למומחיות הנדרשת מהעובדת
 */
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