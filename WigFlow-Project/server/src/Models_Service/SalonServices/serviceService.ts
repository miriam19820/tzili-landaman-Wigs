import { Service } from './serviceModel';

// 1. יצירת הזמנת שירות חדשה - שודרג עם הדילוג האוטומטי של שבוע 2
export const createService = async (serviceData: any) => {
  // אם הלקוחה ביקשה "סירוק בלבד", המערכת מדלגת על החופפת ושולחת את המשימה ישירות לסורקת
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    // אם הלקוחה הזמינה "חפיפה בלבד" או "חפיפה וסירוק", הפאה מתחילה אצל החופפת
    serviceData.status = 'Pending Wash';
  }

  return await Service.create(serviceData);
};

// שליפת שירות לפי ID
export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer');
};

// 2. תחילת ייבוש - שמירת הזמן לצורך התראות
export const moveToDrying = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'Drying',
      dryingStartTime: new Date() // שמירת השעה המדויקת של תחילת הייבוש
    },
    { new: true }
  );
};

// 3. סיום ייבוש - ניתוב חכם להמשך הדרך
export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (service.serviceType === 'Wash & Style') {
    // הפאה יבשה ועכשיו צריכה סירוק - עוברת לסורקת
    service.status = 'Pending Style';
  } else if (service.serviceType === 'Wash Only') {
    // דילוג אוטומטי: אין צורך בסירוק, עוברת ישירות לבקרת איכות (QA)
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

// 5. אישור סופי של המבקרת - הפאה מוכנה למסירה
export const approveService = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'Ready' },
    { new: true }
  );
};

// 6. מנגנון "החזרה לתיקון" משודרג למבקרת
export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  returnTo?: 'Wash' | 'Style', 
  repairTaskId?: string
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/SalonServices/serviceService.ts
  // --- התיקון שבוצע כאן ---
  // TypeScript חשש ש-service.notes עשוי להיות null או undefined.
  // אנחנו מוודאים שהוא קיים לפני הגישה לשדה qa.
  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;
=======
  // המבקרת מוסיפה הערה מדוע הפאה נפסלה
  if (!service.notes) {
    service.notes = { qa: qaNote };
  } else {
    service.notes.qa = qaNote;
  }
>>>>>>> origin/miryami:server/src/Models_Service/SalonServices/serviceService.ts

  // ניתוב חזרה לעבודה לפי מקור הפאה
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