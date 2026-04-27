<<<<<<< Updated upstream
import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 
import { sendCustomerUpdate } from '../../Services/notificationService';
import mongoose from 'mongoose'; 
import logger from '../../Utils/logger'; 

=======
// src/Models_Service/NewWigs/newWigService.ts
import { NewWig } from './newWigModel.js';
import { User } from '../User/userModel.js';
import { AppError } from '../../Utils/AppError.js';
import { Customer } from '../Customer/customerModel.js';
import { Service } from '../SalonServices/serviceModel.js';
import { Repair } from '../Repairs/repairModel.js';
import { sendSalonUpdate } from '../../Services/notificationService.js';
import logger from '../../Utils/logger.js';
import { addHistoryEvent } from '../WigHistory/wigHistoryService.js';
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // 2. ייצור קוד הזמנה אוטומטי במידה ולא סופק (הלוגיקה שחיפשת!)
  if (!wigData.orderCode) {
    wigData.orderCode = `WIG-${Math.floor(1000 + Math.random() * 9999)}`;
  }
=======
export const getWigHistoryByBarcode = async (barcode: string) => {
  const wig = await NewWig.findOne({ orderCode: barcode.trim() }).populate('customer');
  if (!wig) throw new AppError('לא נמצאה פאה עם קוד זה', 404);
>>>>>>> Stashed changes

  // 3. שיבוץ עובדת התחלתית (שלב התאמת שיער)
  if (!wigData.assignedWorker) {
    const initialSpecialty = getSpecialtyForStage('התאמת שיער');
    const firstWorker = await User.findOne({ role: 'Worker', specialty: initialSpecialty });
    
    if (!firstWorker) {
      throw new AppError(`לא ניתן לפתוח הזמנה: לא נמצאה עובדת זמינה להתמחות ${initialSpecialty}`, 404);
    }
    wigData.assignedWorker = firstWorker._id;
  }

<<<<<<< Updated upstream
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
=======
  const repairs = await Repair.find({ wigCode: wig.orderCode })
    .populate('tasks.assignedTo', 'username fullName')
    .sort({ createdAt: -1 });

  return {
    wigDetails: {
      ...wig.toObject(),

      images: (wig as any).images || [wig.imageUrl].filter(Boolean)
    },
    repairHistory: repairs,
    productionHistory: (wig as any).history || [],
    serviceHistory: await Service.find({ newWigReference: wig._id })
      .populate('assignedTo', 'username fullName')
      .sort({ createdAt: -1 })
  };
};
export const moveToNextStage = async (wigId: string, specificWorkerIds?: string[]) => {
  const wig = await NewWig.findById(wigId).populate('assignedWorkers');
>>>>>>> Stashed changes
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

<<<<<<< Updated upstream
  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
  if (currentStageIndex === -1) {
    throw new AppError('סטטוס פאה אינו תקין', 400);
  }

  // טיפול במעבר לשלב בקרה - יצירת שירות QA במערכת הסלון
  if (wig.currentStage === 'חפיפה') {
=======
  const workersWhoFinished = wig.assignedWorkers.map((w: any) => w.fullName || w.username).join(', ');
  
  // השארנו את ה-historyEntry הישן למקרה שהמערכת עדיין מסתמכת עליו
  const historyEntry = {
    stage: wig.currentStage,
    date: new Date(),
    worker: workersWhoFinished || 'לא ידוע'
  };

  let nextStage = '';
  let isReturningToQA = false;
  let remainingRepairStages = (wig as any).pendingRepairStages || [];

  if (remainingRepairStages && remainingRepairStages.length > 0) {
    const currentRepairIdx = remainingRepairStages.indexOf(wig.currentStage);
    if (currentRepairIdx !== -1 && currentRepairIdx < remainingRepairStages.length - 1) {
      nextStage = remainingRepairStages[currentRepairIdx + 1];
    } else {
      nextStage = 'בקרה';
      isReturningToQA = true;
      remainingRepairStages = [];
    }
  } else {
    const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
    if (currentStageIndex === -1) throw new AppError('סטטוס פאה אינו תקין', 400);

    if (wig.currentStage === 'חפיפה') {
      nextStage = 'בקרה';
      isReturningToQA = true;
    } else if (currentStageIndex >= STAGES_FLOW.length - 1) {
      throw new AppError('הפאה כבר בשלב סופי', 400);
    } else {
      nextStage = STAGES_FLOW[currentStageIndex + 1];
    }
  }

  if (isReturningToQA) {
>>>>>>> Stashed changes
    await Service.create({
      customer: wig.customer,
      serviceType: 'Production QA',
      origin: 'NewWig',
      newWigReference: wig._id,
      status: 'QA',
      notes: { secretary: 'פאה חדשה מסיום ייצור (עברה חפיפה)' }
    });

    const updatedWig = await NewWig.findByIdAndUpdate(
      wigId,
      {
        currentStage: 'בקרה',
<<<<<<< Updated upstream
        assignedWorker: null 
      }, 
=======
        assignedWorkers: [],
        pendingRepairStages: [],
        qaNote: '',
        $push: { history: historyEntry }
      },
>>>>>>> Stashed changes
      { new: true }
    ).populate('customer');

<<<<<<< Updated upstream
  if (currentStageIndex >= STAGES_FLOW.length - 1) {
      throw new AppError('הפאה כבר בשלב סופי', 400);
=======
    // רישום להיסטוריה המרכזית החדשה
    if (updatedWig) {
      await addHistoryEvent({
        wigCode: updatedWig.orderCode,
        actionType: 'יצור',
        stage: 'בקרה',
        workerName: workersWhoFinished || 'מערכת',
        description: `הפאה סיימה שלב ${wig.currentStage} ועברה לבקרת איכות`,
      }).catch(err => console.error("History Error:", err));
    }

    return updatedWig;
>>>>>>> Stashed changes
  }

  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  let nextWorkerIdToAssign;

  if (specificWorkerId) {
    nextWorkerIdToAssign = specificWorkerId;
  } else if (wig.stageAssignments && (wig.stageAssignments as any).get(nextStage)) {
    nextWorkerIdToAssign = (wig.stageAssignments as any).get(nextStage);
  }
<<<<<<< Updated upstream
  
  let nextWorker;
  if (nextWorkerIdToAssign) {
    nextWorker = await User.findById(nextWorkerIdToAssign);
  } else {
=======

  if (nextWorkerIdsToAssign.length === 0) {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      assignedWorker: nextWorker._id
=======
      assignedWorkers: nextWorkerIdsToAssign,
      pendingRepairStages: remainingRepairStages,
      $push: { history: historyEntry }
>>>>>>> Stashed changes
    },
    { new: true }
  ).populate('customer').populate('assignedWorker');

<<<<<<< Updated upstream
  if (updatedWig && updatedWig.customer) {
    sendCustomerUpdate(updatedWig.customer, nextStage).catch(err => 
        logger.error(`Failed to send notification: ${err.message}`)
=======
  if (updatedWig) {
    // שליחת נוטיפיקציה
    sendSalonUpdate(updatedWig, nextStage).catch((err: any) =>
      logger.error(`Failed to send notification: ${err.message}`)
>>>>>>> Stashed changes
    );

    // רישום להיסטוריה המרכזית החדשה
    await addHistoryEvent({
      wigCode: updatedWig.orderCode,
      actionType: 'יצור',
      stage: nextStage,
      workerName: workersWhoFinished || 'מערכת',
      description: `הפאה התקדמה משלב ${wig.currentStage} לשלב ${nextStage}`,
    }).catch(err => console.error("History Error:", err));
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

<<<<<<< Updated upstream
=======
export const createNewWig = async (wigData: any) => {
  if (!wigData.orderCode) wigData.orderCode = `WIG-${Math.floor(1000 + Math.random() * 9999)}`;

  // 1. יצירת הפאה בבסיס הנתונים
  const newWig = await NewWig.create(wigData);

  // 2. רישום ראשוני בהיסטוריה (האירוע הראשון ביומן)
  await addHistoryEvent({
    wigCode: newWig.orderCode,
    actionType: 'יצור',
    stage: 'הזמנה חדשה',
    workerName: newWig.receivedBy || 'מזכירות',
    description: `נוצרה הזמנה חדשה לפאה מסוג ${newWig.wigType}`,
    beforeImageUrl: newWig.imageUrl, // התמונה המקורית של הפאה
    notes: newWig.specialNotes
  });

  return newWig;
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorkers');
};

>>>>>>> Stashed changes
export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorker: workerId }).populate('customer');
};

/**
 * שליפת כל הפאות עם חיבור שם העובדת (עבור הדאשבורד)
 */
export const getAllWigsWithWorkers = async () => {
<<<<<<< Updated upstream
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
=======
  const wigs = await NewWig.find().populate('customer').populate('assignedWorkers');
  return wigs.map((wig: any) => ({
    _id: wig._id,
    wigCode: wig.orderCode,
    customerName: wig.customer ? `${wig.customer.firstName} ${wig.customer.lastName}` : 'לא ידוע',
    overallStatus: 'בייצור (חדשה)',
    currentStation: wig.currentStage,
    assignedWorkers: wig.assignedWorkers,
    isUrgent: wig.isUrgent
  }));
>>>>>>> Stashed changes
};

/**
 * עדכון דחיפות לפאה
 */
export const updateWigUrgency = async (id: string, isUrgent: boolean) => {
<<<<<<< Updated upstream
=======
  return await NewWig.findByIdAndUpdate(id, { $set: { isUrgent } }, { new: true });
};

export const deleteWig = async (id: string) => {
  const deletedWig = await NewWig.findByIdAndDelete(id);
  if (!deletedWig) throw new AppError('הפאה לא נמצאה', 404);
  return deletedWig;
};
export const updateSpecialNotes = async (wigId: string, notes: string) => {
>>>>>>> Stashed changes
  return await NewWig.findByIdAndUpdate(
    id, 
    { $set: { isUrgent: isUrgent } },
    { new: true }
  );
};