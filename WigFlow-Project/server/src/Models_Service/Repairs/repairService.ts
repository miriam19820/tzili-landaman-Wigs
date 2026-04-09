import { Repair } from './repairModel';
import { User } from '../User/userModel';

async function getRepairById(id: string) {
  const repair = await Repair.findById(id)
    .populate('customer')
    .populate('tasks.assignedTo', 'username');

  if (!repair) {
    throw new Error("תיקון לא נמצא");
  }

  return repair;
}

/**
 * פונקציה חדשה: פסילת משימה והחזרתה לעובדת (תיקון הבאג)
 * הפונקציה מעדכנת את הסטטוס לממתין ומוסיפה הערה מפורטת
 */
async function rejectTask(repairId: string, taskIndex: number, note: string) {
  const repair = await Repair.findById(repairId);
  if (!repair) throw new Error("תיקון לא נמצא");

  // 1. החזרת המשימה הספציפית לסטטוס ממתין כדי שתופיע שוב אצל העובדת
  repair.tasks[taskIndex].status = 'ממתין';

  // 2. הוספת הערת הפסילה המפורטת (ה"איפה") לשדה ההערות הקיים
  const previousNotes = repair.tasks[taskIndex].notes || "";
  repair.tasks[taskIndex].notes = `❌ פסילת QA: ${note}${previousNotes ? ` | הערה קודמת: ${previousNotes}` : ""}`;

  // 3. שמירה - ה-save יגרום לכך שהפאה תחזור להופיע ב-Dashboard תחת "בתיקון"
  return await repair.save();
}

async function updateTaskStatus(repairId: string, taskIndex: number, status: string) {
  // עדכון סטטוס משימה ספציפית בתוך המערך בעזרת מפתח דינמי
  const updatedRepair = await Repair.findByIdAndUpdate(
    repairId,
    { $set: { [`tasks.${taskIndex}.status`]: status } },
    { new: true }
  );

  if (!updatedRepair) {
    throw new Error("לא ניתן לעדכן את המשימה - התיקון לא נמצא");
  }

  return updatedRepair;
}

async function getWorkerLoadOpen(workerId: string) {
  return await Repair.countDocuments({
    'tasks.assignedTo': workerId,
    'tasks.status': 'ממתין'
  });
}

async function getWorkerLoadClose(workerId: string) {
  return await Repair.countDocuments({
    'tasks.assignedTo': workerId,
    'tasks.status': 'בוצע'
  });
}

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

async function getAvailableWorkersByCategory(category: string) {
  const workers = await User.find({ 
    role: 'Worker',
    specialty: category
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

async function updateWigStatusToDone(wigCode: string) {
  const updatedRepair = await Repair.findOneAndUpdate(
    { wigCode: wigCode },
    { $set: { "tasks.$[].status": "בוצע" } },
    { new: true }
  );

  if (!updatedRepair) {
    throw new Error(`פאה עם קוד ${wigCode} לא נמצאה במערכת`);
  }
  return updatedRepair;
}

async function addNoteByWigAndCategory(wigCode: string, category: string, note: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new Error("לא נמצאה פאה עם קוד כזה");
  
  const task = repair.tasks.find((t: any) => t.category === category);
  if (!task) throw new Error(`לא נמצא תיקון מסוג ${category} לפאה זו`);
  
  task.notes = note;
  return await repair.save();
}

async function checkRepairCompletion(wigCode: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new Error("לא נמצאה פאה עם קוד כזה");
  
  const allTasksDone = repair.tasks.every((task: any) => task.status === "בוצע");
  return allTasksDone;
}

async function updateTaskAndMoveToNext(wigCode: string, subCategoryName: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new Error("לא נמצאה פאה עם קוד כזה");

  const currentTask = repair.tasks.find((t: any) => t.subCategory === subCategoryName && t.status === 'ממתין');

  if (currentTask) {
    currentTask.status = 'בוצע';
    await repair.save();
  } else {
    throw new Error(`המשימה ${subCategoryName} לא נמצאה או שכבר בוצעה`);
  }

  const nextTask = repair.tasks.find((t: any) => t.status === 'ממתין');

  if (nextTask) {
    return {
      message: `המשימה ${subCategoryName} הושלמה. כעת התור של ${nextTask.subCategory} אצל העובדת המשובצת.`,
      nextUp: {
        category: nextTask.category,
        subCategory: nextTask.subCategory,
        assignedTo: nextTask.assignedTo
      }
    };
  } else {
    const hasWash = repair.tasks.some((t: any) => t.category === 'חפיפה');
    const hasQA = repair.tasks.some((t: any) => t.category === 'בקרה');

    if (!hasWash || !hasQA) {
      const finalSteps: any[] = [];

      if (!hasWash) {
        finalSteps.push({
          category: 'חפיפה',
          subCategory: 'חלק',
          assignedTo: repair.tasks[0]?.assignedTo,
          status: 'ממתין',
          notes: 'חפיפה לאחר תיקון'
        });
      }

      if (!hasQA) {
        finalSteps.push({
          category: 'בקרה',
          subCategory: 'בדיקה סופית',
          assignedTo: repair.tasks[0]?.assignedTo,
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
      message: 'כל התיקונים והחפיפה הסתיימו בהצלחה! הפאה בשלב הבקרה הסופית.',
      allDone: true
    };
  }
}

async function createRepairOrder(repairData: any) {
  const isUrgent = repairData.isUrgent || false;

  const finalSteps = [
    {
      category: 'חפיפה',
      subCategory: repairData.stylingType,
      assignedTo: repairData.washerId,
      status: 'ממתין',
      notes: "חפיפה לאחר תיקון"
    },
    {
      category: 'בקרה',
      subCategory: 'בדיקה סופית',
      assignedTo: repairData.adminId,
      status: 'ממתין'
    }
  ];

  const allTasks = [...repairData.tasks, ...finalSteps];

  const newRepair = new Repair({
    wigCode: repairData.wigCode,       
    customer: repairData.customerId,  
    isUrgent: isUrgent,               
    tasks: allTasks                   
  });

  return await newRepair.save();
}

async function getDashboardView() {
  const activeRepairs = await Repair.find()
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
      wigCode: repair.wigCode,
      customerName: customerFullName,
      isUrgent: repair.isUrgent,
      overallStatus: overallStatus,
      currentStation: currentTask ? currentTask.subCategory : 'הסתיים',
      assignedTo: currentTask && currentTask.assignedTo ? (currentTask.assignedTo as any).username : 'לא שובץ'
    };
  });
}

async function getTasksByWorker(workerId: string) {
  const repairs = await Repair.find({ 'tasks.assignedTo': workerId })
    .populate('customer', 'firstName lastName');

  const result: any[] = [];
  repairs.forEach(repair => {
    const customer = repair.customer as any;
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'לא ידוע';
    
    repair.tasks.forEach((task, index) => {
      if (task.assignedTo?.toString() === workerId && task.status === 'ממתין') {
        result.push({
          repairId: repair._id,
          wigCode: repair.wigCode,
          customerName,
          isUrgent: repair.isUrgent,
          taskIndex: index,
          task
        });
      }
    });
  });

  return result.sort((a, b) => (Number(b.isUrgent)) - (Number(a.isUrgent)));
}

export {
  getRepairById,
  rejectTask, // הייצוא החדש
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
  getDashboardView,
  getTasksByWorker
};