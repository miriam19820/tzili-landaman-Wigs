import { NewWig } from './newWigModel.js';
import { User } from '../User/userModel.js'; 
import { AppError } from '../../Utils/AppError.js';
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
    const wig = await NewWig.findOne({ 
        orderCode: { $regex: new RegExp(`^${barcode.trim()}$`, 'i') }
    }).populate('customer');
    
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

  // התיקון לשרת: אם הפאה כבר בבקרה או נמסרה (בגלל לחיצה כפולה/זיהוי קולי כפול), סיימנו בהצלחה מבלי לזרוק 400!
  if (wig.currentStage === 'בקרה' || wig.currentStage === 'מוכנה למסירה' || wig.currentStage === 'נמסר') {
      return wig;
  }

  const workersWhoFinished = wig.assignedWorkers.map((w: any) => w.fullName || w.username).join(', ');
  const historyEntry = {
    stage: wig.currentStage,
    date: new Date(),
    worker: workersWhoFinished || 'לא ידוע'
  };

  let nextStage = '';
  let isMovingToQA = false;
  let remainingRepairStages = (wig as any).pendingRepairStages || [];

  if (remainingRepairStages && remainingRepairStages.length > 0) {
    const currentRepairIdx = remainingRepairStages.indexOf(wig.currentStage);
    if (currentRepairIdx !== -1 && currentRepairIdx < remainingRepairStages.length - 1) {
      nextStage = remainingRepairStages[currentRepairIdx + 1];
    } else {
      nextStage = 'בקרה';
      isMovingToQA = true;
      remainingRepairStages = []; 
    }
  } else {
    // מנקה רווחים מיותרים כדי למנוע באגים של אי-התאמה במערך
    const currentStageIndex = STAGES_FLOW.findIndex(s => s.trim() === wig.currentStage.trim());
    
    if (currentStageIndex === -1) {
       nextStage = STAGES_FLOW[1]; // גיבוי למקרה של תקלה בנתונים
    } else if (currentStageIndex === STAGES_FLOW.length - 2) {
      nextStage = 'בקרה';
      isMovingToQA = true;
    } else {
      nextStage = STAGES_FLOW[currentStageIndex + 1];
    }
  }

  if (isMovingToQA || nextStage === 'בקרה') {
    try {
      await Service.create({
        customer: wig.customer,
        serviceType: 'Production QA',
        origin: 'NewWig',
        newWigReference: wig._id,
        status: 'QA',
        styleCategory: 'ללא',
        notes: { secretary: 'פאה הגיעה לבקרת איכות מסיום ייצור או תיקון', worker: '', qa: '' }
      });
      console.log(`✅ Service QA נוצר לפאה ${wig.orderCode}`);
    } catch (serviceError: any) {
      console.error(`❌ שגיאה ביצירת Service QA:`, serviceError.message);
    }
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
  if (!wigData.orderCode || wigData.orderCode.trim() === '') {
    wigData.orderCode = `WIG-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  if (!wigData.measurements || 
      !wigData.measurements.circumference || 
      !wigData.measurements.earToEar || 
      !wigData.measurements.frontToBack) {
    throw new AppError('חובה להזין את כל מידות הלקוחה (היקף, אוזן לאוזן, ומצח לעורף)', 400);
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