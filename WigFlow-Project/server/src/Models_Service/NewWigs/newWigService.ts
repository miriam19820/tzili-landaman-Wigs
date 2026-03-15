import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 
import { sendCustomerUpdate } from '../../Services/notificationService';
import mongoose from 'mongoose'; 
const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

// הגירסה שלך - עם הוולידציה החשובה
export const createNewWig = async (wigData: any) => {
  if (!wigData.measurements) {
    throw new AppError('חובה להזין מידות לקוחה בשלב פתיחת ההזמנה', 400);
  }
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};

// הגירסה שלך - ליבת ניהול השלבים
export const moveToNextStage = async (wigId: string, specificWorkerId?: string) => {
  console.log('moveToNextStage called with:', { wigId, specificWorkerId });
  
  const wig = await NewWig.findById(wigId);
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);

  if (currentStageIndex === -1) {
    throw new AppError('סטטוס פאה אינו תקין', 400);
  }

  // טיפול במעבר מסיום חפיפה ל-QA
  if (wig.currentStage === 'חפיפה') {
    console.log('Finished Wash stage, moving to QA and creating service');
    
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

  if (currentStageIndex >= STAGES_FLOW.length - 2) {
      throw new AppError('הפאה כבר בשלבי סיום (בקרה) ולא ניתן להעביר אותה הלאה מפס הייצור', 400);
  }

  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  
  // ---> הלוגיקה המשופרת לבדיקת תכנון שיבוץ <---
  let nextWorkerIdToAssign;

  // 1. אם העובדת הקודמת בחרה מישהי ספציפית דרך המסך שלה
  if (specificWorkerId) {
    nextWorkerIdToAssign = specificWorkerId;
  } 
  // 2. אם המזכירה קבעה עובדת מראש לשלב הזה בעת פתיחת ההזמנה
  else if (wig.stageAssignments && wig.stageAssignments.get(nextStage)) {
    nextWorkerIdToAssign = wig.stageAssignments.get(nextStage);
  }
  
  let nextWorker;
  if (nextWorkerIdToAssign) {
    nextWorker = await User.findById(nextWorkerIdToAssign);
  } else {
    // 3. מנגנון אוטומטי - אם לא שובץ אף אחד, בוחרים עובדת אקראית מאותה התמחות
    nextWorker = await User.findOne({ 
      role: 'Worker',
      specialty: getSpecialtyForStage(nextStage)
    });
  }
  
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

  if (updatedWig && updatedWig.customer) {
    await sendCustomerUpdate(updatedWig.customer, nextStage);
  }

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

// ==============================================================
// ---> התוספות של איילה עבור הדשבורד של המזכירה <---
// ==============================================================

/**
 * שליפת כל הפאות עם חיבור שם העובדת (Lookup)
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
    { new: true } // מחזיר את האובייקט המעודכן
  );
};