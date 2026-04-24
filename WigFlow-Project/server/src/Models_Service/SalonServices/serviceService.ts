import { Service, IService } from './serviceModel';

<<<<<<< HEAD
// 1. יצירת הזמנת שירות חדשה - כולל דילוג אוטומטי (משימת מפתחת 4)
export const createService = async (serviceData: Partial<IService>) => {
  // לוגיקה: אם "סירוק בלבד" - מדלגים על חפיפה ועוברים ישירות לסירוק
  if (serviceData.serviceType === 'סירוק בלבד') {
    serviceData.status = 'ממתין לסירוק'; 
  } else {
    serviceData.status = 'ממתין לחפיפה';
=======
export const createService = async (serviceData: any) => {
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  }

  return await Service.create(serviceData);
};

export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer');
};

<<<<<<< HEAD
// 2. תחילת ייבוש
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
export const moveToDrying = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { 
<<<<<<< HEAD
      status: 'בייבוש',
=======
      status: 'Drying',
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
      dryingStartTime: new Date() 
    },
    { new: true }
  );
  if (!service) throw new Error('Service not found');
  return service;
};

export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

<<<<<<< HEAD
  if (service.serviceType === 'חפיפה וסירוק') {
    service.status = 'ממתין לסירוק';
  } else if (service.serviceType === 'חפיפה בלבד' || service.serviceType === 'סירוק בלבד') {
    service.status = 'בבדיקה';
=======
  if (service.serviceType === 'Wash & Style') {
    service.status = 'Pending Style';
  } else if (service.serviceType === 'Wash Only') {
    service.status = 'QA';
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  }
  
  await service.save();
  return service;
};

// 4. סיום סירוק - מעבר לבקרת איכות (QA)
export const finishStyling = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { status: 'בבדיקה' },
    { new: true }
  );
  if (!service) throw new Error('Service not found');
  return service;
};

<<<<<<< HEAD
// 5. אישור סופי של המבקרת
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
export const approveService = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { status: 'מוכן' },
    { new: true }
  );
  if (!service) throw new Error('Service not found');
  return service;
};

<<<<<<< HEAD
// 6. מנגנון "החזרה לתיקון" (Reject) - פתרון הקונפליקט
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  returnTo?: 'חפיפה' | 'סירוק', 
  repairTaskId?: string
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  // אתחול אובייקט notes אם הוא לא קיים ועדכון הערת ה-QA
  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;

<<<<<<< HEAD
  // ניתוב חזרה לעבודה לפי מקור הפאה וסטטוסים בעברית
=======
>>>>>>> 4b486c0bd58f9af880f93a227e41ab2a058e1302
  if (service.origin === 'Service') {
    service.status = returnTo === 'חפיפה' ? 'ממתין לחפיפה' : 'ממתין לסירוק';
  } 
  else if (service.origin === 'NewWig' || service.origin === 'Repair') {
    service.status = 'בביצוע';
  }

  await service.save();
  return service;
};