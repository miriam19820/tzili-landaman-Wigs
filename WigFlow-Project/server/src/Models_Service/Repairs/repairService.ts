import { Repair } from './repairModel.js';
import { User } from '../User/userModel.js';
import { AppError } from '../../Utils/AppError.js';
import { Service } from '../SalonServices/serviceModel.js'; 

async function getRepairById(id: string) {
  const repair = await Repair.findById(id)
    .populate('customer')
    .populate('tasks.assignedTo', 'username');

  if (!repair) {
    throw new AppError("תיקון לא נמצא", 404);
  }
  return repair;
}

async function markRepairAsDelivered(id: string) {
  const repair = await Repair.findByIdAndUpdate(
    id,
    { $set: { overallStatus: 'נמסר' } },
    { new: true }
  ).populate('customer');

  if (!repair) throw new AppError("התיקון לא נמצא במערכת", 404);
  return repair;
}

async function rejectTask(repairId: string, taskIndex: number, note: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new AppError("תיקון לא נמצא", 404);
  if (!repair.tasks[taskIndex]) throw new AppError("המשימה לא קיימת", 404);

  repair.tasks[taskIndex].status = 'ממתין';
  const previousNotes = repair.tasks[taskIndex].notes || "";
  repair.tasks[taskIndex].notes = `❌ פסילת QA: ${note}${previousNotes ? ` | הערה קודמת: ${previousNotes}` : ""}`;

  return await repair.save();
}

async function updateTaskStatus(repairId: string, taskIndex: number, status: string) {
  const updatedRepair = await Repair.findByIdAndUpdate(
    repairId,
    { $set: { [`tasks.${taskIndex}.status`]: status } },
    { new: true }
  );
  if (!updatedRepair) throw new AppError("לא ניתן לעדכן את המשימה - התיקון לא נמצא", 404);
  return updatedRepair;
}

async function getWorkerLoadOpen(workerId: string) {
  return await Repair.countDocuments({ 'tasks.assignedTo': workerId, 'tasks.status': 'ממתין' });
}

async function getWorkerLoadClose(workerId: string) {
  return await Repair.countDocuments({ 'tasks.assignedTo': workerId, 'tasks.status': 'בוצע' });
}

async function FullWorkloadReportOpenJobs() {
  const allWorkers = await User.find({ role: 'Worker' });
  return await Promise.all(allWorkers.map(async (user: any) => {
    const taskCount = await getWorkerLoadOpen(user._id.toString());
    return { workerName: user.username, specialization: user.specialty, load: taskCount };
  }));
}

async function FullWorkloadReportCloseJobs() {
  const allWorkers = await User.find({ role: 'Worker' });
  return await Promise.all(allWorkers.map(async (user: any) => {
    const taskCount = await getWorkerLoadClose(user._id.toString());
    return { workerName: user.username, specialization: user.specialty, load: taskCount };
  }));
}

async function getAvailableWorkersByCategory(category: string) {
  let searchCategories = [category];
  if (category === 'מכונה' || category === 'תפירה') {
    searchCategories = ['מכונה', 'תפירה'];
  } else if (category === 'בקרה') {
    searchCategories = ['בקרה', 'בקרת איכות'];
  }

  const workers = await User.find({ role: 'Worker', specialty: { $in: searchCategories } });
  
  return await Promise.all(workers.map(async (worker: any) => {
    const openTasks = await getWorkerLoadOpen(worker._id.toString());
    return { workerId: worker._id, workerName: worker.username, load: openTasks };
  }));
}

async function updateWigStatusToDone(wigCode: string) {
  const updatedRepair = await Repair.findOneAndUpdate(
    { wigCode: wigCode },
    { $set: { "tasks.$[].status": "בוצע" } },
    { new: true }
  );
  if (!updatedRepair) throw new AppError(`פאה עם קוד ${wigCode} לא נמצאה במערכת`, 404);
  return updatedRepair;
}

async function addNoteByWigAndCategory(wigCode: string, category: string, note: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new AppError("לא נמצאה פאה עם קוד כזה", 404);
  
  const task = repair.tasks.find((t: any) => t.category === category);
  if (!task) throw new AppError(`לא נמצא תיקון מסוג ${category} לפאה זו`, 404);
  
  task.notes = note;
  return await repair.save();
}

async function checkRepairCompletion(wigCode: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new AppError("לא נמצאה פאה עם קוד כזה", 404);
  return repair.tasks.every((task: any) => task.status === "בוצע");
}

/**
 * עדכון משימה והתקדמות לשלב הבא - מקבל repairId במקום wigCode!
 */
async function updateTaskAndMoveToNext(repairId: string, subCategoryName: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new AppError("לא נמצא תיקון כזה", 404);

  const currentTask = repair.tasks.find((t: any) => t.subCategory === subCategoryName && t.status === 'ממתין');

  if (currentTask) {
    currentTask.status = 'בוצע';
    await repair.save();
  } else {
    const alreadyDoneTask = repair.tasks.find((t: any) => t.subCategory === subCategoryName && t.status === 'בוצע');
    if (alreadyDoneTask) {
      return { message: 'המשימה נרשמה כהושלמה', allDone: !repair.tasks.some((t: any) => t.status === 'ממתין') };
    }
    throw new AppError(`המשימה ${subCategoryName} לא נמצאה או שכבר טופלה`, 400);
  }

  let nextTask = repair.tasks.find((t: any) => t.status === 'ממתין');

  // יצירת חפיפה ובקרה אוטומטית אם אין יותר משימות
  if (!nextTask) {
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
      nextTask = repair.tasks.find((t: any) => t.status === 'ממתין');
    }
  }

  if (nextTask) {
    if (nextTask.category === 'בקרה') {
       repair.overallStatus = 'בבקרה';
       await repair.save();
       
       const existingQA = await Service.findOne({ repairReference: repair._id, status: 'QA' });
       if (!existingQA) {
          await Service.create({
             customer: repair.customer,
             serviceType: 'Repair QA',
             origin: 'Repair',
             repairReference: repair._id,
             status: 'QA',
             notes: { secretary: 'תיקון הגיע לבקרת איכות' }
          });
       }
    } else if (nextTask.category === 'חפיפה') {
       repair.overallStatus = 'בחפיפה';
       await repair.save();
    }

    const nextWorker = await User.findById(nextTask.assignedTo).select('username');
    const workerName = nextWorker ? nextWorker.username : 'לא שובץ';

    return {
      message: `המשימה הושלמה. התחנה הבאה: ${nextTask.subCategory} אצל ${workerName}`,
      nextUp: { category: nextTask.category, subCategory: nextTask.subCategory, assignedTo: workerName }
    };
  } 
  
  repair.overallStatus = 'בבקרה';
  await repair.save();

  const existingQA = await Service.findOne({ repairReference: repair._id, status: 'QA' });
  if (!existingQA) {
      await Service.create({
         customer: repair.customer,
         serviceType: 'Repair QA',
         origin: 'Repair',
         repairReference: repair._id,
         status: 'QA',
         notes: { secretary: 'כל התיקונים הסתיימו. ממתין לאישור סופי.' }
      });
  }

  return { message: 'כל המשימות בוצעו! הפאה עברה לאישור סופי בתחנת QA.', allDone: true };
}

async function createRepairOrder(repairData: any) {
  const isUrgent = repairData.isUrgent || false;
  const photoUrl = (repairData.images && repairData.images.length > 0) ? repairData.images[0] : repairData.imageUrl;

  const finalSteps: any[] = [];

  if (repairData.washerId) {
    finalSteps.push({
      category: 'חפיפה',
      subCategory: repairData.stylingType || 'חלק',
      assignedTo: repairData.washerId,
      status: 'ממתין',
      notes: 'חפיפה לאחר תיקון'
    });
  }

  if (repairData.adminId) {
    finalSteps.push({
      category: 'בקרה',
      subCategory: 'בדיקה סופית',
      assignedTo: repairData.adminId,
      status: 'ממתין'
    });
  }

  const allTasks = [...(repairData.tasks || []), ...finalSteps];

  const newRepair = new Repair({
    wigCode: repairData.wigCode,       
    customer: repairData.customerId,  
    isUrgent: isUrgent,               
    tasks: allTasks, 
    beforeImageUrl: photoUrl,
    internalNote: repairData.internalNote 
  });

  return await newRepair.save();
}

async function finalizeRepairWithQA(repairId: string, afterImageUrl: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new AppError("תיקון לא נמצא", 404);

  repair.afterImageUrl = afterImageUrl; 
  repair.overallStatus = 'מוכן';

  repair.tasks.forEach((task: any) => { task.status = 'בוצע'; });

  return await repair.save();
}

async function getDashboardView() {
  const activeRepairs = await Repair.find({ overallStatus: { $ne: 'נמסר' } })
    .populate('customer', 'firstName lastName')
    .populate('tasks.assignedTo', 'username')
    .sort({ isUrgent: -1, createdAt: 1 });

  return activeRepairs.map((repair: any) => {
    const currentTask = repair.tasks.find((t: any) => t.status === 'ממתין');
    let overallStatus = 'בתיקון';
    
    if (currentTask) {
      if (currentTask.category === 'חפיפה') overallStatus = 'בחפיפה';
      if (currentTask.category === 'בקרה') overallStatus = 'בבקרה';
    } else {
      overallStatus = 'מוכן';
    }

    const customerFullName = repair.customer ? `${repair.customer.firstName} ${repair.customer.lastName}` : "לקוחה כללית";

    return {
      _id: repair._id, 
      wigCode: repair.wigCode,
      customerName: customerFullName,
      isUrgent: repair.isUrgent,
      overallStatus: overallStatus,
      currentStation: currentTask ? currentTask.subCategory : 'הסתיים',
      assignedTo: currentTask && currentTask.assignedTo ? currentTask.assignedTo.username : 'לא שובץ'
    };
  });
}

async function getTasksByWorker(workerId: string) {
  const repairs = await Repair.find({ 'tasks.assignedTo': workerId }).populate('customer', 'firstName lastName');

  const result: any[] = [];
  repairs.forEach((repair: any) => {
    repair.tasks.forEach((task: any, index: number) => {
      if (task.assignedTo?.toString() === workerId && task.status === 'ממתין') {
        result.push({
          repairId: repair._id,
          wigCode: repair.wigCode,
          customerName: repair.customer ? `${repair.customer.firstName} ${repair.customer.lastName}` : 'לא ידוע',
          isUrgent: repair.isUrgent,
          internalNote: repair.internalNote,
          imageUrl: repair.imageUrl,
          taskIndex: index,
          task 
        });
      }
    });
  });
  
  return result.sort((a, b) => (Number(b.isUrgent)) - (Number(a.isUrgent)));
}

async function deleteRepair(id: string) {
  const deletedRepair = await Repair.findByIdAndDelete(id);
  if (!deletedRepair) throw new AppError('התיקון המבוקש לא נמצא במערכת', 404);
  return deletedRepair;
}

// ייצוא מרוכז של כל הפונקציות כדי שהראוטר יזהה אותן בדיוק כמו קודם
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