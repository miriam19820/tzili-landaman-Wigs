import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 
import { sendCustomerUpdate } from '../../Services/notificationService';
import mongoose from 'mongoose'; 
import logger from '../../Utils/logger'; 

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

/**
 * יצירת הזמנת פאה חדשה
 */
export const createNewWig = async (wigData: any) => {
  // 1. וולידציה: בדיקה שכל המידות קיימות (נדרש לפי המודל)
  if (!wigData.measurements || 
      !wigData.measurements.circumference || 
      !wigData.measurements.earToEar || 
      !wigData.measurements.frontToBack) {
    throw new AppError('חובה להזין את כל מידות הלקוחה (היקף, אוזן לאוזן, ומצח לעורף)', 400);
  }

  // 2. ייצור קוד הזמנה אוטומטי במידה ולא סופק (הלוגיקה שחיפשת!)
  if (!wigData.orderCode) {
    wigData.orderCode = `WIG-${Math.floor(1000 + Math.random() * 9999)}`;
  }

  // 3. שיבוץ עובדת התחלתית (שלב התאמת שיער)
  if (!wigData.assignedWorker) {
    const initialSpecialty = getSpecialtyForStage('התאמת שיער');
    const firstWorker = await User.findOne({ role: 'Worker', specialty: initialSpecialty });
    
    if (!firstWorker) {
      throw new AppError(`לא ניתן לפתוח הזמנה: לא נמצאה עובדת זמינה להתמחות ${initialSpecialty}`, 404);
    }
    wigData.assignedWorker = firstWorker._id;
  }

  logger.info(`Creating new wig order: ${wigData.orderCode} for customer: ${wigData.customer}`);
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};

/**
 * העברת פאה לשלב הבא בייצור
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

  // טיפול במעבר לשלב בקרה - יצירת שירות QA במערכת הסלון
  if (wig.currentStage === 'חפיפה') {
    await Service.create({
      customer: wig.customer,
      serviceType: 'Production QA',
      origin: 'NewWig',
      newWigReference: wig._id,
      status: 'QA',
      notes: { secretary: 'פאה חדשה מסיום ייצור (עברה חפיפה)' }
    });

    return await NewWig.findByIdAndUpdate(
      wigId, 
      { 
        currentStage: 'בקרה',
        assignedWorker: null 
      }, 
      { new: true }
    ).populate('customer');
  }

  if (currentStageIndex >= STAGES_FLOW.length - 1) {
      throw new AppError('הפאה כבר בשלב סופי', 400);
  }

  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  let nextWorkerIdToAssign;

  if (specificWorkerId) {
    nextWorkerIdToAssign = specificWorkerId;
  } else if (wig.stageAssignments && (wig.stageAssignments as any).get(nextStage)) {
    nextWorkerIdToAssign = (wig.stageAssignments as any).get(nextStage);
  }
  
  let nextWorker;
  if (nextWorkerIdToAssign) {
    nextWorker = await User.findById(nextWorkerIdToAssign);
  } else {
    const specialty = getSpecialtyForStage(nextStage);
    nextWorker = await User.findOne({ role: 'Worker', specialty: specialty });
  }
  
  if (!nextWorker) {
    throw new AppError(`לא נמצאה עובדת זמינה להתמחות ${getSpecialtyForStage(nextStage)} עבור שלב ${nextStage}`, 404);
  }

  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorker: nextWorker._id
    },
    { new: true }
  ).populate('customer').populate('assignedWorker');

  if (updatedWig && updatedWig.customer) {
    sendCustomerUpdate(updatedWig.customer, nextStage).catch(err => 
        logger.error(`Failed to send notification: ${err.message}`)
    );
  }

  return updatedWig;
};

/**
 * מיפוי שלבים להתמחויות
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

export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorker: workerId }).populate('customer');
};

/**
 * שליפת כל הפאות עם חיבור שם העובדת (עבור הדאשבורד)
 */
export const getAllWigsWithWorkers = async () => {
  return await NewWig.aggregate([
    {
      $lookup: {
        from: 'users', 
        localField: 'assignedWorker', 
        foreignField: '_id', 
        as: 'workerDetails'
      }
    },
    {
      $addFields: {
        workerName: { $arrayElemAt: ['$workerDetails.fullName', 0] } 
      }
    }
  ]);
};

/**
 * עדכון דחיפות לפאה
 */
export const updateWigUrgency = async (id: string, isUrgent: boolean) => {
  return await NewWig.findByIdAndUpdate(
    id, 
    { $set: { isUrgent: isUrgent } },
    { new: true }
  );
};