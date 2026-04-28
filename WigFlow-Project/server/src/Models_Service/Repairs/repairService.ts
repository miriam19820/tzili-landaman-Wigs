import { Repair } from './repairModel.js';
import { User } from '../User/userModel.js';
import { AppError } from '../../Utils/AppError.js'; // שימוש ב-AppError של הפרויקט
import * as customerService from '../Customer/customerService.js';

/**
 * שליפת תיקון לפי מזהה - כולל אכלוס נתוני לקוחה ושמות עובדים
 */
async function getRepairById(id: string) {
  const repair = await Repair.findById(id)
    .populate('customer')
    .populate('tasks.assignedTo', 'username');

  if (!repair) {
    throw new AppError("תיקון לא נמצא", 404);
  }

  return repair;
}

/**
 * פונקציה חדשה: סימון תיקון כנמסר ללקוחה (ארכוב מהדאשבורד)
 */
async function markRepairAsDelivered(id: string) {
  const repair = await Repair.findByIdAndUpdate(
    id,
    { $set: { overallStatus: 'נמסר' } },
    { new: true }
  ).populate('customer');

  if (!repair) {
    throw new AppError("התיקון לא נמצא במערכת", 404);
  }

  return repair;
}

/**
 * פסילת משימה בבקרת איכות והחזרתה לעובדת
 */
async function rejectTask(repairId: string, taskIndex: number, note: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new AppError("תיקון לא נמצא", 404);

  repair.tasks[taskIndex].status = 'ממתין';

  const previousNotes = repair.tasks[taskIndex].notes || "";
  repair.tasks[taskIndex].notes = `❌ פסילת QA: ${note}${previousNotes ? ` | הערה קודמת: ${previousNotes}` : ""}`;

  return await repair.save();
}

/**
 * עדכון סטטוס משימה ספציפית
 */
async function updateTaskStatus(repairId: string, taskIndex: number, status: string) {
  const updatedRepair = await Repair.findByIdAndUpdate(
    repairId,
    { $set: { [`tasks.${taskIndex}.status`]: status } },
    { new: true }
  );

  if (!updatedRepair) {
    throw new AppError("לא ניתן לעדכן את המשימה - התיקון לא נמצא", 404);
  }

  return updatedRepair;
}

/**
 * ניהול עומסי עבודה - משימות פתוחות
 */
async function getWorkerLoadOpen(workerId: string) {
  return await Repair.countDocuments({
    'tasks.assignedTo': workerId,
    'tasks.status': 'ממתין'
  });
}

/**
 * ניהול עומסי עבודה - משימות שבוצעו
 */
async function getWorkerLoadClose(workerId: string) {
  return await Repair.countDocuments({
    'tasks.assignedTo': workerId,
    'tasks.status': 'בוצע'
  });
}

/**
 * דו"ח עומס עבודה מלא - משימות פתוחות
 */
async function FullWorkloadReportOpenJobs() {
  const allWorkers = await User.find({ role: 'Worker' });

  const report = await Promise.all(allWorkers.map(async (user: any) => {
    const taskCount = await getWorkerLoadOpen(user._id.toString());
    return {
      workerName: user.username,
      specialization: user.specialty,
      load: taskCount
    };
  }));

  return report;
}

/**
 * דו"ח עומס עבודה מלא - משימות שנסגרו
 */
async function FullWorkloadReportCloseJobs() {
  const allWorkers = await User.find({ role: 'Worker' });

  const report = await Promise.all(allWorkers.map(async (user: any) => {
    const taskCount = await getWorkerLoadClose(user._id.toString());
    return {
      workerName: user.username,
      specialization: user.specialty,
      load: taskCount
    };
  }));

  return report;
}

/**
 * שליפת עובדות זמינות לפי קטגוריית התמחות
 */
async function getAvailableWorkersByCategory(category: string) {
  let searchCategories = [category];
  
  if (category === 'מכונה' || category === 'תפירה') {
    searchCategories = ['מכונה', 'תפירה'];
  } else if (category === 'בקרה') {
    searchCategories = ['בקרה', 'בקרת איכות'];
  }

  const workers = await User.find({ 
    role: 'Worker',
    specialty: { $in: searchCategories }
  });
  
  const workersWithLoad = await Promise.all(workers.map(async (worker: any) => {
    const openTasks = await getWorkerLoadOpen(worker._id.toString());
    return {
      workerId: worker._id,
      workerName: worker.username,
      load: openTasks
    };
  }));
  
  return workersWithLoad;
}

/**
 * עדכון סטטוס פאה ל"בוצע" (סיום כל המשימות)
 */
async function updateWigStatusToDone(wigCode: string) {
  const updatedRepair = await Repair.findOneAndUpdate(
    { wigCode: wigCode },
    { $set: { "tasks.$[].status": "בוצע" } },
    { new: true }
  );

  if (!updatedRepair) {
    throw new AppError(`פאה עם קוד ${wigCode} לא נמצאה במערכת`, 404);
  }
  return updatedRepair;
}

/**
 * הוספת הערה לפי קוד פאה וקטגוריה
 */
async function addNoteByWigAndCategory(wigCode: string, category: string, note: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new AppError("לא נמצאה פאה עם קוד כזה", 404);
  
  const task = repair.tasks.find((t: any) => t.category === category);
  if (!task) throw new AppError(`לא נמצא תיקון מסוג ${category} לפאה זו`, 404);
  
  task.notes = note;
  return await repair.save();
}

/**
 * בדיקה האם כל התיקונים בפאה הושלמו
 */
async function checkRepairCompletion(wigCode: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new AppError("לא נמצאה פאה עם קוד כזה", 404);
  
  const allTasksDone = repair.tasks.every((task: any) => task.status === "בוצע");
  return allTasksDone;
}

/**
 * עדכון משימה והתקדמות לשלב הבא בזרימת העבודה
 */
async function updateTaskAndMoveToNext(wigCode: string, subCategoryName: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new AppError("לא נמצאה פאה עם קוד כזה", 404);

  const currentTask = repair.tasks.find((t: any) => t.subCategory === subCategoryName && t.status === 'ממתין');

  if (currentTask) {
    currentTask.status = 'בוצע';
    await repair.save();
  } else {
    throw new AppError(`המשימה ${subCategoryName} לא נמצאה או שכבר בוצעה`, 400);
  }

  const nextTask = repair.tasks.find((t: any) => t.status === 'ממתין');

  if (nextTask) {
    const nextWorker = await User.findById(nextTask.assignedTo).select('username');
    const workerName = nextWorker ? nextWorker.username : 'לא ידוע';

    return {
      message: `המשימה ${subCategoryName} הושלמה. התחנה הבאה: ${nextTask.subCategory} אצל ${workerName}`,
      nextUp: {
        category: nextTask.category,
        subCategory: nextTask.subCategory,
        assignedTo: workerName
      }
    };
  } else {
    // אם אין משימות נוספות, בודקים אם יש צורך בחפיפה ובקרה אוטומטית
    const hasWash = repair.tasks.some((t: any) => t.category === 'חפיפה');
    const hasQA = repair.tasks.some((t: any) => t.category === 'בקרה');

    if (!hasWash || !hasQA) {
      const finalSteps: any[] = [];
      const firstAssignedWorker = repair.tasks[0]?.assignedTo;
      if (!hasWash) {
        finalSteps.push({
          category: 'חפיפה',
          subCategory: 'חלק',
          assignedTo: firstAssignedWorker,
          status: 'ממתין',
          notes: 'חפיפה אוטומטית לאחר סיום תיקונים'
        });
      }
      if (!hasQA) {
        finalSteps.push({
          category: 'בקרה',
          subCategory: 'בדיקה סופית',
          assignedTo: firstAssignedWorker,
          status: 'ממתין'
        });
      }
      repair.tasks.push(...finalSteps);
      await repair.save();

      return {
        message: 'כל התיקונים הסתיימו! הפאה עברה אוטומטית לחפיפה ובקרה.',
        autoAdded: finalSteps,
        allDone: false
      };
    }

    return {
      message: 'כל המשימות בוצעו! הפאה ממתינה לאישור סופי בתחנת QA.',
      allDone: true
    };
  }
}

/**
 * יצירת הזמנת תיקון חדשה
 */
async function createRepairOrder(repairData: any) {
  const isUrgent = repairData.isUrgent || false;

  const photoUrl = (repairData.images && repairData.images.length > 0) 
    ? repairData.images[0] 
    : repairData.imageUrl;

  const newRepair = new Repair({
    wigCode: repairData.wigCode,       
    customer: repairData.customerId,  
    isUrgent: isUrgent,               
    tasks: repairData.tasks, 
    imageUrl: photoUrl,
    internalNote: repairData.internalNote 
  });

  return await newRepair.save();
}

/**
 * סגירת תיקון סופית לאחר אישור QA
 */
async function finalizeRepairWithQA(repairId: string, afterImageUrl: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new AppError("תיקון לא נמצא", 404);

  repair.afterImageUrl = afterImageUrl; 
  repair.overallStatus = 'מוכן';

  repair.tasks.forEach(task => {
    task.status = 'בוצע';
  });

  return await repair.save();
}

/**
 * שליפת תצוגת דאשבורד - כולל סינון פריטים שנמסרו
 */
async function getDashboardView() {
  // תיקון: סינון של 'נמסר' כדי שהדאשבורד יהיה נקי ומקצועי
  const activeRepairs = await Repair.find({ overallStatus: { $ne: 'נמסר' } })
    .populate('customer', 'firstName lastName')
    .populate('tasks.assignedTo', 'username')
    .sort({ isUrgent: -1, createdAt: 1 });

  return activeRepairs.map(repair => {
    const currentTask = repair.tasks.find((t: any) => t.status === 'ממתין');

    let overallStatus = 'בתיקון';
    if (currentTask) {
      if (currentTask.category === 'חפיפה') overallStatus = 'בחפיפה';
      if (currentTask.category === 'בקרה') overallStatus = 'בבקרה';
    } else {
      overallStatus = 'מוכן';
    }

    const customer = repair.customer as any;
    const customerFullName = customer ? `${customer.firstName} ${customer.lastName}` : "לקוחה כללית";

    return {
      _id: repair._id, 
      wigCode: repair.wigCode,
      customerName: customerFullName,
      isUrgent: repair.isUrgent,
      overallStatus: overallStatus,
      currentStation: currentTask ? currentTask.subCategory : 'הסתיים',
      assignedTo: currentTask && currentTask.assignedTo ? (currentTask.assignedTo as any).username : 'לא שובץ'
    };
  });
}

/**
 * שליפת משימות לפי עובדת
 */
async function getTasksByWorker(workerId: string) {
  const repairs = await Repair.find({ 'tasks.assignedTo': workerId })
    .populate('customer', 'firstName lastName');

  const result: any[] = [];
  repairs.forEach(repair => {
    repair.tasks.forEach((task, index) => {
      if (task.assignedTo?.toString() === workerId && task.status === 'ממתין') {
        result.push({
          repairId: repair._id,
          wigCode: repair.wigCode,
          customerName: repair.customer ? `${(repair.customer as any).firstName} ${(repair.customer as any).lastName}` : 'לא ידוע',
          isUrgent: repair.isUrgent,
          internalNote: repair.internalNote,
          imageUrl: (repair as any).imageUrl,
          taskIndex: index,
          task 
        });
      }
    });
  });
  return result.sort((a, b) => (Number(b.isUrgent)) - (Number(a.isUrgent)));
}

/**
 * מחיקת תיקון מהמערכת
 */
async function deleteRepair(id: string) {
  const deletedRepair = await Repair.findByIdAndDelete(id);
  if (!deletedRepair) {
    throw new AppError('התיקון המבוקש לא נמצא במערכת', 404);
  }
  return deletedRepair;
}

export {
  getRepairById,
  markRepairAsDelivered,
  rejectTask, 
  updateTaskStatus,
  getWorkerLoadOpen,
  getWorkerLoadClose,
  FullWorkloadReportOpenJobs,
  FullWorkloadReportCloseJobs,
  getAvailableWorkersByCategory,
  updateWigStatusToDone,
  addNoteByWigAndCategory,
  checkRepairCompletion,
  updateTaskAndMoveToNext,
  createRepairOrder,
  finalizeRepairWithQA,
  getDashboardView,
  getTasksByWorker,
  deleteRepair 
};