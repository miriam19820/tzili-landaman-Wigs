import { Service } from './serviceModel';

// 1. יצירת הזמנת שירות חדשה - שודרג עם הדילוג האוטומטי של שבוע 2
export const createService = async (serviceData: any) => {
  // אם הלקוחה ביקשה "סירוק בלבד", המערכת מדלגת על החופפת ושולחת את המשימה ישירות לסורקת
if (serviceData.serviceType === 'סירוק בלבד') {
    serviceData.status = 'ממתין לסירוק'; 
} else {
    serviceData.status = 'ממתין לחפיפה';
}

  return await Service.create(serviceData);
};

// הפונקציה המקורית שלך - שליפת שירות לפי ID (נשארה בדיוק אותו דבר!)
export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer').populate('assignedWorker');
};

// 2. תחילת ייבוש - שמירת הזמן לצורך התראות
export const moveToDrying = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'בייבוש',
      dryingStartTime: new Date() // שמירת השעה המדויקת של תחילת הייבוש
    },
    { new: true }
  );
};

// 3. סיום ייבוש - ניתוב חכם להמשך הדרך
export const finishDrying = async (serviceId: string) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

 if (service.serviceType === 'חפיפה וסירוק') {
    service.status = 'ממתין לסירוק';
} else if (service.serviceType === 'חפיפה בלבד') {
    service.status = 'בבדיקה'; // עובר ל-QA
}
    // דילוג אוטומטי: אין צורך בסירוק, עוברת ישירות לבקרת איכות (QA)
    else if (service.serviceType === 'סירוק בלבד') {
    service.status = 'בבדיקה';
}
  await service.save();
  return service;
};

// 4. סיום סירוק - מעבר לבקרת איכות (QA)
export const finishStyling = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'בבדיקה' },
    { new: true }
  );
};

// 5. אישור סופי של המבקרת - הפאה מוכנה למסירה
export const approveService = async (serviceId: string) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { status: 'מוכן' },
    { new: true }
  );
};

// 6. מנגנון "החזרה לתיקון" משודרג למבקרת
// 6. מנגנון "החזרה לתיקון" משודרג למבקרת
export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  // עדכנתי גם פה את האפשרויות לעברית כדי שתהיה עקביות
  returnTo?: 'חפיפה' | 'סירוק', 
  repairTaskId?: string
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  // המבקרת מוסיפה הערה מדוע הפאה נפסלה
service.set('notes.qa', qaNote);
  // ניתוב חזרה לעבודה לפי מקור הפאה
  if (service.origin === 'Service') {
    // כאן שיניתי לסטטוסים בעברית מה-Model שלך
    service.status = returnTo === 'חפיפה' ? 'ממתין לחפיפה' : 'ממתין לסירוק';
  } 
  else if (service.origin === 'NewWig' || service.origin === 'Repair') {
    // בייצור או תיקון, מחזירים לסטטוס "בביצוע"
    service.status = 'בביצוע';
  }

  await service.save();
  return service;
};