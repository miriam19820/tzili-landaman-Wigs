import { Service } from './serviceModel';
import { NewWig } from '../NewWigs/newWigModel'; // ייבוא של הפאות החדשות!

export const createService = async (serviceData: any) => {
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
  }
  return await Service.create(serviceData);
};

export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer');
};

export const getQATasks = async () => {
  return await Service.find({ status: 'QA' }).populate('customer');
};

export const moveToDrying = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'Drying', dryingStartTime: new Date() },
    { new: true }
  );
};

export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (service.serviceType === 'Wash & Style') {
    service.status = 'Pending Style';
  } else if (service.serviceType === 'Wash Only') {
    service.status = 'QA';
  }

  await service.save();
  return service;
};

export const finishStyling = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'QA' },
    { new: true }
  );
};

export const approveService = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { status: 'Ready' },
    { new: true }
  );

  // חכם: אם מדובר בפאה חדשה מפס הייצור, אנחנו מסמנים אותה סוף סוף כמוכנה!
  if (service && service.origin === 'NewWig' && service.newWigReference) {
    await NewWig.findByIdAndUpdate(service.newWigReference, { 
      currentStage: 'מוכנה למסירה',
      assignedWorkers: []
    });
  }

  return service;
};

// --- התיקון המרכזי: קבלת מערך התחנות (returnStages) ופעולה לפיו ---
export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  returnStages?: string[]
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;

  // אם הפאה הגיעה מפס הייצור החדש
  if (service.origin === 'NewWig' && service.newWigReference) {
    service.status = 'Rejected'; // סוגרים את משימת ה-QA
    
    // לוקחים את התחנה הראשונה מתוך התחנות שהבודקת סימנה
    const firstStage = (returnStages && returnStages.length > 0) ? returnStages[0] : 'תפירת פאה';
    
    // זורקים את הפאה חזרה לפס הייצור!
    await NewWig.findByIdAndUpdate(service.newWigReference, {
       currentStage: firstStage,
       assignedWorkers: [] // מנקים עובדות כדי שמנהלת תוכל לשבץ מחדש מי תתקן
    });
  } 
  // אם מדובר בשירות של תיקון/חפיפה רגיל
  else {
    service.status = 'Pending Wash'; 
  }

  await service.save();
  return service;
};