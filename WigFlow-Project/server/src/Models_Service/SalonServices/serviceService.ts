import { Service } from './serviceModel.js';
import { NewWig } from '../NewWigs/newWigModel.js'; 
import { Repair } from '../Repairs/repairModel.js';
// שים לב: אם יש שגיאה על השורה הזו, וודאי שבקובץ customerService יש export לפונקציה הזו
import * as customerService from '../Customer/customerService.js'; 
import { addHistoryEvent } from '../WigHistory/wigHistoryService.js';
import { AppError } from '../../Utils/AppError.js';

export const createService = async (serviceData: any) => {
  if (typeof serviceData.customer === 'string' && serviceData.customer.length < 24) {
    // שימוש ב-as any כדי לעקוף את השגיאה אם TS לא מזהה את הפונקציה בייבוא
    const foundCustomer = await (customerService as any).findCustomerByName(serviceData.customer);
    if (!foundCustomer) {
      throw new AppError(`הלקוחה "${serviceData.customer}" לא נמצאה במערכת. יש להוסיף אותה קודם.`, 404);
    }
    serviceData.customer = foundCustomer._id;
  }

  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
  }

  // 1. יצירת השירות
  const newService = await Service.create(serviceData);

  // 2. רישום להיסטוריה
  await addHistoryEvent({
    wigCode: serviceData.wigCode || "סירוק כללי", 
    actionType: 'סירוק',
    stage: 'פתיחת הזמנת שירות',
    workerName: 'מזכירות',
    description: `הוזמן שירות: ${newService.serviceType} (סגנון: ${(newService as any).styleCategory || 'לא נקבע'})`,
    beforeImageUrl: (newService as any).beforeImageUrl || undefined,
    notes: (newService as any).notes?.secretary || undefined 
  }).catch((err: any) => console.error("History event failed:", err));

  return newService;
};

export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer');
};

export const moveToDrying = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'Drying',
      dryingStartTime: new Date() 
    },
    { new: true }
  );
};

export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new AppError('Service not found', 404);

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
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'Ready' },
    { new: true }
  );
};

export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  returnTo?: 'Wash' | 'Style', 
  repairTaskId?: string
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new AppError('Service not found', 404);

  // טיפול יסודי בשגיאת ה-Object is possibly undefined
  const currentNotes = (service as any).notes || { secretary: '', worker: '', qa: '' };
  currentNotes.qa = qaNote;
  
  (service as any).notes = currentNotes;

  if ((service as any).origin === 'Service') {
    service.status = returnTo === 'Wash' ? 'Pending Wash' : 'Pending Style';
  } else {
    service.status = 'In Progress';
  }

  await service.save();
  return service;
};