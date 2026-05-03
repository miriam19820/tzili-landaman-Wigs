import { Service } from './serviceModel.js';
import { NewWig } from '../NewWigs/newWigModel.js'; 
import { Repair } from '../Repairs/repairModel.js';
import * as customerService from '../Customer/customerService.js'; 

export const createService = async (serviceData: any) => {
  // 1. טיפול במזהה הלקוחה
  if (typeof serviceData.customer === 'string' && serviceData.customer.length < 24) {
    const foundCustomer = await customerService.findCustomerByName(serviceData.customer);
    if (!foundCustomer) {
      throw new Error(`הלקוחה "${serviceData.customer}" לא נמצאה במערכת. יש להוסיף אותה קודם.`);
    }
    serviceData.customer = foundCustomer._id;
  }

  // קישור לקוד הפאה
  if (serviceData.wigCode) {
    const wig = await NewWig.findOne({ orderCode: serviceData.wigCode.trim() });
    if (wig) {
      serviceData.newWigReference = wig._id;
      serviceData.origin = 'NewWig';
    } else {
      throw new Error(`לא נמצאה פאה עם הקוד ${serviceData.wigCode}`);
    }
  }

  // 2. טיפול בסטטוס התחלתי
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
  }

  return await Service.create(serviceData);
};

// =========================================================================
// שולפת את כל משימות ה-QA שפתוחות כרגע (כולל תמונות מקור)
// =========================================================================
export const getQATasks = async () => {
  const tasks = await Service.find({ status: 'QA' })
    .populate('customer', 'firstName lastName')
    .populate('newWigReference', 'orderCode imageUrl')
    .populate('repairReference', 'wigCode')
    .sort({ createdAt: -1 }); // מציג את החדשים ביותר קודם

  // עוברים על המשימות כדי לצרף אליהן את תמונת ה"לפני" של הפאה/תיקון
  const tasksWithImages = await Promise.all(tasks.map(async (task) => {
    let beforeImageUrl = task.beforeImageUrl;
    
    // אם אין תמונה על משימת השירות עצמה, נשאב אותה מהפאה או מהתיקון המקוריים
    if (!beforeImageUrl) {
      if (task.origin === 'NewWig' && task.newWigReference) {
        const wig = await NewWig.findById(task.newWigReference).select('imageUrl');
        // שימוש ב-as any כדי למנוע שגיאות TypeScript
        if (wig) beforeImageUrl = (wig as any).imageUrl;
      } else if (task.origin === 'Repair' && task.repairReference) {
        // שליפה מורחבת של שדות תמונה אפשריים בתיקון
        const repair = await Repair.findById(task.repairReference).select('imageUrl beforeImageUrl images');
        if (repair) {
          // שימוש ב-as any ועדיפות למספר שדות כדי לוודא שתמיד תוצג תמונה
          beforeImageUrl = (repair as any).imageUrl || 
                           (repair as any).beforeImageUrl || 
                           ((repair as any).images && (repair as any).images.length > 0 ? (repair as any).images[0] : undefined);
        }
      }
    }
    
    return {
      ...task.toObject(),
      beforeImageUrl
    };
  }));

  return tasksWithImages;
};

export const approveService = async (serviceId: string, inspectorId: string, photoUrl: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'Ready',
      afterImageUrl: photoUrl, 
      inspectedBy: inspectorId,
      inspectedAt: new Date(),
      qaRejectionPhoto: null
    },
    { new: true }
  );

  if (!service) throw new Error('Service not found');

  if (service.origin === 'NewWig' && service.newWigReference) {
    await NewWig.findByIdAndUpdate(service.newWigReference, { 
      currentStage: 'מוכנה למסירה',
      finalPhotoUrl: photoUrl, 
      inspectorName: inspectorId,
      inspectionDate: new Date(),
      assignedWorkers: []
    });
  } else if (service.origin === 'Repair' && service.repairReference) {
    await Repair.findByIdAndUpdate(service.repairReference, {
      overallStatus: 'מוכן',
      afterImageUrl: photoUrl, 
      inspectedBy: inspectorId,
      inspectedAt: new Date()
    });
  }

  return service;
};

export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  photoUrl: string,
  returnStages?: string[]
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;
  service.qaRejectionPhoto = photoUrl;
  service.status = 'Rejected';

  if (service.origin === 'NewWig' && service.newWigReference) {
    const firstStage = (returnStages && returnStages.length > 0) ? returnStages[0] : 'תפירת פאה';
    
    const wig = await NewWig.findById(service.newWigReference);
    let originalWorkers: any[] = [];
    
    if (wig && wig.stageAssignments) {
      originalWorkers = typeof wig.stageAssignments.get === 'function' 
        ? wig.stageAssignments.get(firstStage) 
        : (wig.stageAssignments as any)[firstStage];
    }

    await NewWig.findByIdAndUpdate(service.newWigReference, {
       currentStage: firstStage,
       assignedWorkers: originalWorkers || [],
       qaNote: qaNote,
       qaRejectionPhoto: photoUrl, 
       pendingRepairStages: returnStages 
    });

  // --- הטיפול המלא בחזרת תיקון ---
  } else if (service.origin === 'Repair' && service.repairReference) {
      const repair = await Repair.findById(service.repairReference);
      if (repair) {
          repair.overallStatus = 'בתיקון';
          repair.qaNote = qaNote;
          repair.qaRejectionPhoto = photoUrl;

          // אנו עוברים על המשימות בתיקון. אם הקטגוריה שלהן נבחרה בחלון הפסילה, נחזיר ל'ממתין'
          if (returnStages && returnStages.length > 0) {
              repair.tasks.forEach((task: any) => {
                  if (returnStages.includes(task.category)) {
                      task.status = 'ממתין';
                      // אנחנו מוסיפים את הערת המבקרת ישירות למשימה של העובדת
                      task.notes = `❌ הוחזר מ-QA: ${qaNote}`; 
                  }
              });
          } else {
              // מחזירים את כל המשימות ל'ממתין' למקרה שהמבקרת לא סימנה תחנות ספציפיות
              repair.tasks.forEach((task: any) => {
                  if (task.category !== 'בקרה' && task.category !== 'חפיפה') {
                      task.status = 'ממתין';
                  }
              });
          }
          await repair.save();
      }
      service.status = 'Pending Wash'; 

  } else {
    service.status = 'Pending Wash'; 
  }

  await service.save();
  return service;
};