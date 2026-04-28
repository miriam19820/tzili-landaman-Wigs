// src/Models_Service/NewWigs/newWigService.ts
import { NewWig } from './newWigModel.js';
import { User } from '../User/userModel.js';
import { AppError } from '../../Utils/AppError.js';
import { Service } from '../SalonServices/serviceModel.js';
import { Repair } from '../Repairs/repairModel.js';
import { sendCustomerUpdate } from '../../Services/notificationService.js';
import logger from '../../Utils/logger.js';
import { addHistoryEvent } from '../WigHistory/wigHistoryService.js';

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

/**
 * עזר: מיפוי שלבים להתמחויות
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

/**
 * יצירת הזמנת פאה חדשה
 */
export const createNewWig = async (wigData: any) => {
  if (!wigData.measurements ||
    !wigData.measurements.circumference ||
    !wigData.measurements.earToEar ||
    !wigData.measurements.frontToBack) {
    throw new AppError('חובה להזין את כל מידות הלקוחה (היקף, אוזן לאוזן, ומצח לעורף)', 400);
  }

  if (!wigData.orderCode) {
    wigData.orderCode = `WIG-${Math.floor(1000 + Math.random() * 9999)}`;
  }

  const newWig = await NewWig.create(wigData);

  await addHistoryEvent({
    wigCode: newWig.orderCode,
    actionType: 'יצור',
    stage: 'הזמנה חדשה',
    workerName: (newWig as any).receivedBy || 'מזכירות',
    description: `נוצרה הזמנה חדשה לפאה מסוג ${(newWig as any).wigType || 'לא ידוע'}`,
    beforeImageUrl: newWig.imageUrl || undefined,
    notes: newWig.specialNotes || undefined
  }).catch((err: any) => logger.error("History Error:", err));

  return newWig;
};

/**
 * שליפת היסטוריה לפי ברקוד
 */
export const getWigHistoryByBarcode = async (barcode: string) => {
  const wig = await NewWig.findOne({ orderCode: barcode.trim() }).populate('customer');
  if (!wig) throw new AppError('לא נמצאה פאה עם קוד זה', 404);

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

/**
 * העברת פאה לשלב הבא
 */
export const moveToNextStage = async (wigId: string, specificWorkerIds?: string[]) => {
  const wig = await NewWig.findById(wigId).populate('assignedWorkers');
  if (!wig) throw new AppError('הפאה לא נמצאה במערכת', 404);

  // פתרון לאדום של assignedWorkers (תמונה 2)
  const currentWorkers = (wig as any).assignedWorkers || [];
  const workersWhoFinished = currentWorkers.map((w: any) => w.fullName || w.username).join(', ');

  const historyEntry = {
    stage: wig.currentStage,
    date: new Date(),
    worker: workersWhoFinished || 'לא ידוע'
  };

  let nextStage = '';
  let isReturningToQA = false;
  let remainingRepairStages = (wig as any).pendingRepairStages || [];

  if (remainingRepairStages.length > 0) {
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
        assignedWorkers: [],
        pendingRepairStages: [],
        qaNote: '',
        $push: { history: historyEntry }
      },
      { new: true }
    ).populate('customer');

    if (updatedWig) {
      await addHistoryEvent({
        wigCode: updatedWig.orderCode,
        actionType: 'יצור',
        stage: 'בקרה',
        workerName: workersWhoFinished || 'מערכת',
        description: `הפאה סיימה שלב ${wig.currentStage} ועברה לבקרת איכות`,
      }).catch((err: any) => logger.error("History Error:", err));
    }
    return updatedWig;
  }

  // הקצאת עובדות (פתרון לאדום מתמונה 1)
  let nextWorkerIds = specificWorkerIds || [];
  if (nextWorkerIds.length === 0) {
    const specialty = getSpecialtyForStage(nextStage);
    const worker = await User.findOne({ role: 'Worker', specialty });
    if (worker) {
        nextWorkerIds = [String(worker._id)]; 
    }
  }

  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    {
      currentStage: nextStage,
      assignedWorkers: nextWorkerIds,
      pendingRepairStages: remainingRepairStages,
      $push: { history: historyEntry }
    },
    { new: true }
  ).populate('customer').populate('assignedWorkers');

  if (updatedWig) {
    // פתרון לאדום מתמונות 3 ו-4
    sendCustomerUpdate(updatedWig.customer, nextStage).catch((err: any) => 
        logger.error(`Notification Error: ${err.message}`)
    );

    await addHistoryEvent({
      wigCode: updatedWig.orderCode,
      actionType: 'יצור',
      stage: nextStage,
      workerName: workersWhoFinished || 'מערכת',
      description: `הפאה התקדמה משלב ${wig.currentStage} לשלב ${nextStage}`,
    }).catch((err: any) => logger.error("History Error:", err));
  }

  return updatedWig;
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorkers');
};

export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorkers: workerId }).populate('customer');
};

export const getAllWigsWithWorkers = async () => {
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
};

export const updateWigUrgency = async (id: string, isUrgent: boolean) => {
  return await NewWig.findByIdAndUpdate(id, { $set: { isUrgent } }, { new: true });
};

export const deleteWig = async (id: string) => {
  const deletedWig = await NewWig.findByIdAndDelete(id);
  if (!deletedWig) throw new AppError('הפאה לא נמצאה', 404);
  return deletedWig;
};

export const updateSpecialNotes = async (wigId: string, notes: string) => {
  return await NewWig.findByIdAndUpdate(
    wigId,
    { $set: { specialNotes: notes } },
    { new: true }
  );
};