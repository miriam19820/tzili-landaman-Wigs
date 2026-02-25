import { Service, IService } from './serviceModel';

// 1. יצירת הזמנת שירות חדשה - כולל דילוג אוטומטי (משימת מפתחת 4)
export const createService = async (serviceData: Partial<IService>) => {
  // לוגיקה: אם "סירוק בלבד" - מדלגים על חפיפה ועוברים ישירות לסירוק
  if (serviceData.serviceType === 'סירוק בלבד') {
    serviceData.status = 'ממתין לסירוק'; 
  } else {
    serviceData.status = 'ממתין לחפיפה';
  }

  return await Service.create(serviceData);
};

// שליפת שירות לפי ID
export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer');
};

// 2. תחילת ייבוש
export const moveToDrying = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'בייבוש',
      dryingStartTime: new Date() 
    },
    { new: true }
  );
  if (!service) throw new Error('Service not found');
  return service;
};

// 3. סיום ייבוש - ניתוב חכם להמשך הדרך
export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (service.serviceType === 'חפיפה וסירוק') {
    service.status = 'ממתין לסירוק';
  } else if (service.serviceType === 'חפיפה בלבד' || service.serviceType === 'סירוק בלבד') {
    service.status = 'בבדיקה';
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

// 5. אישור סופי של המבקרת
export const approveService = async (serviceId: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { status: 'מוכן' },
    { new: true }
  );
  if (!service) throw new Error('Service not found');
  return service;
};

// 6. מנגנון "החזרה לתיקון" (Reject) - פתרון הקונפליקט
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

  // ניתוב חזרה לעבודה לפי מקור הפאה וסטטוסים בעברית
  if (service.origin === 'Service') {
    service.status = returnTo === 'חפיפה' ? 'ממתין לחפיפה' : 'ממתין לסירוק';
  } 
  else if (service.origin === 'NewWig' || service.origin === 'Repair') {
    service.status = 'בביצוע';
  }

  await service.save();
  return service;
};