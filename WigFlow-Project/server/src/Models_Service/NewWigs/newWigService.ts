import { NewWig } from './newWigModel';
import { User } from '../User/userModel'; 
import { AppError } from '../../Utils/AppError';
import { Customer } from '../Customer/customerModel'; 
import { Service } from '../SalonServices/serviceModel'; 
import { sendCustomerUpdate } from '../../Services/notificationService';
import logger from '../../Utils/logger'; 

const STAGES_FLOW = [
  'התאמת שיער',
  'תפירת פאה',
  'צבע',
  'עבודת יד',
  'חפיפה',
  'בקרה'
];

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

  // שיבוץ עובדות - עכשיו מוודאים שזה נשמר כמערך
  if (wigData.stageAssignments && wigData.stageAssignments['התאמת שיער']) {
    const assigned = wigData.stageAssignments['התאמת שיער'];
    wigData.assignedWorkers = Array.isArray(assigned) ? assigned : [assigned];
  } 
  else if (!wigData.assignedWorkers || wigData.assignedWorkers.length === 0) {
    const initialSpecialty = getSpecialtyForStage('התאמת שיער');
    const firstWorker = await User.findOne({ role: 'Worker', specialty: initialSpecialty });
    
    if (!firstWorker) {
      throw new AppError(`לא ניתן לפתוח הזמנה: לא נמצאה עובדת זמינה להתמחות ${initialSpecialty}`, 404);
    }
    wigData.assignedWorkers = [firstWorker._id];
  }

  logger.info(`Creating new wig order: ${wigData.orderCode} for customer: ${wigData.customer}`);
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorkers');
};

export const moveToNextStage = async (wigId: string, specificWorkerIds?: string[]) => {
  const wig = await NewWig.findById(wigId);
  if (!wig) {
    throw new AppError('הפאה לא נמצאה במערכת', 404);
  }

  const currentStageIndex = STAGES_FLOW.indexOf(wig.currentStage);
  if (currentStageIndex === -1) {
    throw new AppError('סטטוס פאה אינו תקין', 400);
  }

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
        assignedWorkers: [] // מתנקה לקראת QA
      }, 
      { new: true }
    ).populate('customer');
  }

  if (currentStageIndex >= STAGES_FLOW.length - 1) {
      throw new AppError('הפאה כבר בשלב סופי', 400);
  }

  const nextStage = STAGES_FLOW[currentStageIndex + 1];
  let nextWorkerIdsToAssign: string[] = [];

  if (specificWorkerIds && specificWorkerIds.length > 0) {
    nextWorkerIdsToAssign = specificWorkerIds;
  } else if (wig.stageAssignments && (wig.stageAssignments as any).get(nextStage)) {
    const assigned = (wig.stageAssignments as any).get(nextStage);
    nextWorkerIdsToAssign = Array.isArray(assigned) ? assigned : [assigned];
  }
  
  // פולבק - אם לא נבחרה עובדת מראש, ניקח אחת פנויה
  if (nextWorkerIdsToAssign.length === 0) {
    const specialty = getSpecialtyForStage(nextStage);
    const nextWorker = await User.findOne({ role: 'Worker', specialty: specialty });
    if (!nextWorker) {
        throw new AppError(`לא נמצאה עובדת זמינה להתמחות ${specialty} עבור שלב ${nextStage}`, 404);
    }
    nextWorkerIdsToAssign = [nextWorker._id.toString()];
  }

  const updatedWig = await NewWig.findByIdAndUpdate(
    wigId,
    { 
      currentStage: nextStage,
      assignedWorkers: nextWorkerIdsToAssign
    },
    { new: true }
  ).populate('customer').populate('assignedWorkers');

  if (updatedWig && updatedWig.customer) {
    sendCustomerUpdate(updatedWig.customer, nextStage).catch(err => 
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

export const getWigsByWorker = async (workerId: string) => {
  // חיפוש חכם! גם אם היא אחת מתוך עשר עובדות, זה ימצא אותה בעזרת $in
  return await NewWig.find({ assignedWorkers: { $in: [workerId] } }).populate('customer');
};

// התיקון המרכזי כאן: התאמת הנתונים בדיוק למבנה שהדאשבורד מצפה לקבל
export const getAllWigsWithWorkers = async () => {
  const wigs = await NewWig.find().populate('customer').populate('assignedWorkers');
  
  return wigs.map((wig: any) => {
    const customer = wig.customer;
    return {
      wigCode: wig.orderCode,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'לא ידוע',
      overallStatus: 'בייצור (חדשה)',
      currentStation: wig.currentStage,
      assignedWorkers: wig.assignedWorkers, 
      isUrgent: wig.isUrgent
    };
  });
};

export const updateWigUrgency = async (id: string, isUrgent: boolean) => {
  return await NewWig.findByIdAndUpdate(
    id, 
    { $set: { isUrgent: isUrgent } },
    { new: true }
  );
};