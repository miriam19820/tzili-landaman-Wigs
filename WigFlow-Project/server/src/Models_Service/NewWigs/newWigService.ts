// src/Models_Service/NewWigs/newWigService.ts
import { NewWig } from './newWigModel.js';
import { User } from '../User/userModel.js'; 
import { AppError } from '../../Utils/AppError.js';
import { Customer } from '../Customer/customerModel.js'; 
import { Service } from '../SalonServices/serviceModel.js'; 
import { Repair } from '../Repairs/repairModel.js'; 
import { sendSalonUpdate } from '../../Services/notificationService.js';
import logger from '../../Utils/logger.js'; 

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];


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

export const moveToNextStage = async (wigId: string, specificWorkerIds?: string[]) => {

  const wig = await NewWig.findById(wigId).populate('assignedWorkers');
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  const workersWhoFinished = wig.assignedWorkers.map((w: any) => w.fullName || w.username).join(', ');
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
    await Service.create({
      customer: wig.customer,
      serviceType: 'Production QA',
      origin: 'NewWig',
      newWigReference: wig._id,
      status: 'QA',
      notes: { secretary: 'פאה הגיעה לבקרת איכות' }
    });

    return await NewWig.findByIdAndUpdate(
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
  }


  let nextWorkerIdsToAssign: string[] = [];
  if (specificWorkerIds && specificWorkerIds.length > 0) {
    nextWorkerIdsToAssign = specificWorkerIds;
  } else if (wig.stageAssignments && (wig.stageAssignments as any).get(nextStage)) {
    const assigned = (wig.stageAssignments as any).get(nextStage);
    nextWorkerIdsToAssign = Array.isArray(assigned) ? assigned : [assigned];
  }
  
  if (nextWorkerIdsToAssign.length === 0) {
    const specialty = getSpecialtyForStage(nextStage);
    const nextWorker = await User.findOne({ role: 'Worker', specialty: specialty });
    if (!nextWorker) throw new AppError(`לא נמצאה עובדת זמינה להתמחות ${specialty}`, 404);
    nextWorkerIdsToAssign = [nextWorker._id.toString()];
  }


  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorkers: nextWorkerIdsToAssign,
      pendingRepairStages: remainingRepairStages,
      $push: { history: historyEntry } 
    },
    { new: true }
  ).populate('customer').populate('assignedWorkers');

  if (updatedWig) {
    sendSalonUpdate(updatedWig, nextStage).catch((err: any) => 
        logger.error(`Failed to send notification: ${err.message}`)
    );
  }
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

export const createNewWig = async (wigData: any) => {
  // תיקון: חסימת המצאת קוד פאה אוטומטי - מחייב הזנה ידנית בלבד
  if (!wigData.orderCode || wigData.orderCode.trim() === '') {
    throw new AppError('חובה להזין קוד פאה באופן ידני', 400);
  }
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorkers');
};

export const getWigsByWorker = async (workerId: string) => {
  return await NewWig.find({ assignedWorkers: { $in: [workerId] } }).populate('customer');
};

export const getAllWigsWithWorkers = async () => {
  // תיקון: העלמת פאות שנמסרו מהדאשבורד (מסנן את סטטוס 'נמסר')
  const wigs = await NewWig.find({ currentStage: { $ne: 'נמסר' } })
    .populate('customer')
    .populate('assignedWorkers');
    
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


export const markWigAsDelivered = async (wigId: string) => {
  const historyEntry = {
    stage: 'נמסר ללקוחה',
    date: new Date(),
    worker: 'מזכירות'
  };

  return await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: 'נמסר',
      assignedWorkers: [], 
      $push: { history: historyEntry } 
    },
    { new: true }
  );
};