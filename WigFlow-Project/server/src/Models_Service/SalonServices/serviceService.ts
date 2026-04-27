<<<<<<< Updated upstream
import { Service } from './serviceModel';

export const createService = async (serviceData: any) => {
=======
import { Service } from './serviceModel.js';
import { NewWig } from '../NewWigs/newWigModel.js'; 
import { Repair } from '../Repairs/repairModel.js';
import * as customerService from '../Customer/customerService.js'; 
import { addHistoryEvent } from '../WigHistory/wigHistoryService.js';

export const createService = async (serviceData: any) => {
  if (typeof serviceData.customer === 'string' && serviceData.customer.length < 24) {
    const foundCustomer = await customerService.findCustomerByName(serviceData.customer);
    if (!foundCustomer) {
      throw new Error(`הלקוחה "${serviceData.customer}" לא נמצאה במערכת. יש להוסיף אותה קודם.`);
    }
    serviceData.customer = foundCustomer._id;
  }

>>>>>>> Stashed changes
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
  }

  // 1. יצירת השירות ושמירתו במשתנה
  const newService = await Service.create(serviceData);

  // 2. רישום להיסטוריה המרכזית
  // שימי לב: אנחנו משתמשים ב-wigCode אם הוא קיים ב-serviceData, 
  // או ב-newWigReference אם מדובר בפאה חדשה בתהליך.
  await addHistoryEvent({
    wigCode: serviceData.wigCode || "סירוק כללי", 
    actionType: 'סירוק',
    stage: 'פתיחת הזמנת שירות',
    workerName: 'מזכירות',
    description: `הוזמן שירות: ${newService.serviceType} (סגנון: ${newService.styleCategory})`,
    beforeImageUrl: newService.beforeImageUrl,
    notes: newService.notes?.secretary
  });

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
  if (!service) throw new Error('Service not found');

  if (service.serviceType === 'Wash & Style') {
    service.status = 'Pending Style';
  } else if (service.serviceType === 'Wash Only') {
    service.status = 'QA';
  }

  await service.save();
  return service;
};

// 4. סיום סירוק - מעבר לבקרת איכות (QA)
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
  if (!service) throw new Error('Service not found');

  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;

  if (service.origin === 'Service') {
    service.status = returnTo === 'Wash' ? 'Pending Wash' : 'Pending Style';
  } else if (service.origin === 'NewWig') {
    service.status = 'In Progress';
  } else if (service.origin === 'Repair') {
    service.status = 'In Progress';
  }

  await service.save();
  return service;
};
