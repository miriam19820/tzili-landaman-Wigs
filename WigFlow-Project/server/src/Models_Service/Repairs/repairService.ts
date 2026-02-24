import { Repair } from './repairModel';
import { User } from '../User/userModel';
import { Customer } from '../Customer/customerModel';


// 1. שליפת תיקון ספציפי לפי ה-ID שלו (כולל נתוני לקוחה ועובדות)
 async function getRepairById(id: string) {
  const repair = await Repair.findById(id)
    .populate('customer')
    .populate('tasks.assignedTo', 'username'); // מביא את שם העובדת

  if (!repair) {
    throw new Error("תיקון לא נמצא");
  }

  return repair;
}

// 2. עדכון סטטוס משימה לפי המיקום שלה ברשימה (Index)
 async function updateTaskStatus(repairId: string, taskIndex: number, status: string) {
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
  // מחזיר את מספר המשימות הפתוחות של עובד מסוים
  // כאן אנחנו סופרים את כל התיקונים שבהם יש משימה שהוקצתה לעובד הזה שעדיין במצב "ממתין
  return await Repair.countDocuments({ 
    'tasks.assignedTo': workerId,
    'tasks.status': 'ממתין'
  });
};
async function getWorkerLoadClose(workerId: string) {
  // מחזיר את מספר המשימות הסגורות של עובד מסוים
  // כאן אנחנו סופרים את כל התיקונים שבהם יש משימה שהוקצתה לעובד הזה שעדיין במצב "בוצע"
  return await Repair.countDocuments({ 
    'tasks.assignedTo': workerId,
    'tasks.status': 'בוצע'
  });
};
async function FullWorkloadReportOpenJobs() {
  const allWorkers = await User.find({ role: 'Worker' });

  const report = await Promise.all(allWorkers.map(async (user) => {
    
  const taskCount = await getWorkerLoadOpen(user._id.toString());

    return {
      workerName: user.username,
      specialization: user.specialty, 
      load: taskCount
    };
  }));

  return report;
};
async function FullWorkloadReportCloseJobs() {
  const allWorkers = await User.find({ role: 'Worker' });

  const report = await Promise.all(allWorkers.map(async (user) => {
    
  const taskCount = await getWorkerLoadClose(user._id.toString());

    return {
      workerName: user.username,
      specialization: user.specialty, 
      load: taskCount
    };
  }));

  return report;
};
async function getAvailableWorkersByCategory(category: string) {
 const workers = await User.find({ 
    role: 'Worker',
    specialty: category
  });
  const workersWithLoad=await Promise.all(workers.map(async (worker) => {
    const openTasks = await getWorkerLoadOpen(worker._id.toString());
    return {
      workerId: worker._id,
      workerName: worker.username,
      load: openTasks
    };
  }));
  return workersWithLoad; 
};
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
  const task = repair.tasks.find(t => t.category === category);
  if (!task) throw new Error(`לא נמצא תיקון מסוג ${category} לפאה זו`);
 task.notes = note;
  return await repair.save();
}
//pubelic function to check if all tasks for a given wig code are done
async function checkRepairCompletion(wigCode: string) {
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new Error("לא נמצאה פאה עם קוד כזה");
  const allTasksDone = repair.tasks.every(task => task.status === "בוצע");
  return allTasksDone;
}
async function updateTaskAndMoveToNext(wigCode: string, subCategoryName: string) {
  // 1. מציאת התיקון לפי קוד הפאה
  const repair = await Repair.findOne({ wigCode: wigCode });
  if (!repair) throw new Error("לא נמצאה פאה עם קוד כזה");

  // 2. עדכון המשימה הנוכחית לסטטוס 'בוצע' (החלק שהיה חסר) 
  const currentTask = repair.tasks.find(t => t.subCategory === subCategoryName && t.status === 'ממתין');
  
  if (currentTask) {
    currentTask.status = 'בוצע';
    await repair.save(); // שמירת השינוי בדאטה-בייס
  } else {
    throw new Error(`המשימה ${subCategoryName} לא נמצאה או שכבר בוצעה`);
  }

  // 3. חיפוש המשימה הבאה בתור שעדיין בסטטוס 'ממתין' [cite: 18, 51]
  const nextTask = repair.tasks.find(t => t.status === 'ממתין');

  if (nextTask) {
    return {
      message: `המשימה ${subCategoryName} הושלמה. כעת התור של ${nextTask.subCategory} אצל העובדת המשובצת. `,
      nextUp: {
        category: nextTask.category,
        subCategory: nextTask.subCategory,
        assignedTo: nextTask.assignedTo
      }
    };
  } else {
    // 4. אם אין יותר משימות 'ממתין', הפאה עוברת אוטומטית לבקרה [cite: 18, 52]
    return {
      message: "כל התיקונים והחפיפה הסתיימו בהצלחה! הפאה עברה לשלב הבקרה הסופית. [cite: 18, 58]",
      allDone: true
    };
  }
}
async function createRepairOrder(repairData:any) {
  // 1. הגדרת דחיפות: אם המזכירה סימנה או אם תאריך היעד קרוב מאוד (אופציונלי)
  const isUrgent = repairData.isUrgent || false;

  // 2. בניית המשימות האוטומטיות (חפיפה ובקרה)
  const finalSteps = [
    {
      category: 'חפיפה',
      subCategory: repairData.stylingType, // מה שהלקוחה ביקשה
      assignedTo: repairData.washerId, // העובדת שנבחרה לחפיפה
      status: 'ממתין',
      notes: "חפיפה לאחר תיקון"
    },
    {
      category: 'בקרה',
      subCategory: 'בדיקה סופית',
      assignedTo: repairData.adminId, // המנהלת שאחראית על הבקרה
      status: 'ממתין'
    }
  ];

  // 3. איחוד המשימות: התיקונים של המזכירה + החפיפה והבקרה בסוף
  const allTasks = [...repairData.tasks, ...finalSteps];

  // 4. יצירת האובייקט לשמירה
  const newRepair = new Repair({
    wigCode: repairData.wigCode,       // הקוד הקל (למשל 102)
    customer: repairData.customerId,   // ה-ID של הלקוחה
    isUrgent: isUrgent,                // האם דחוף
    tasks: allTasks                    // כל המערך שבנינו
  });

  // 5. שמירה בדאטה-בייס
  return await newRepair.save();
}
 async function getDashboardView() {
  // 1. שליפת כל התיקונים הפעילים
  const activeRepairs = await Repair.find()
    .populate('customer', 'firstName lastName') // שימוש בשדות הסכימה ששלחת
    .populate('tasks.assignedTo', 'username')    // מביא את שם העובדת במקום ה-ID שלה
    .sort({ isUrgent: -1, createdAt: 1 });

  // 2. עיבוד הנתונים למזכירה
  return activeRepairs.map(repair => {
    // מוצאים את המשימה הראשונה שעדיין בסטטוס 'ממתין'
    const currentTask = repair.tasks.find(t => t.status === 'ממתין');

    // קביעת הסטטוס הכללי
    let overallStatus = 'בתיקון'; 
    if (currentTask) {
      if (currentTask.category === 'חפיפה') overallStatus = 'בחפיפה';
      if (currentTask.category === 'בקרה') overallStatus = 'בבקרה';
    } else {
      overallStatus = 'מוכן';
    }

    // חיבור השם המלא של הלקוחה מהסכימה שלך
    const customer = repair.customer as any;
    const customerFullName = customer ? `${customer.firstName} ${customer.lastName}` : "לקוחה כללית";

    return {
      wigCode: repair.wigCode,
      customerName: customerFullName,
      isUrgent: repair.isUrgent,
      overallStatus: overallStatus,
      currentStation: currentTask ? currentTask.subCategory : 'הסתיים',
      // הצגת שם העובדת (username) במקום ה-ID שלה
      assignedTo: currentTask && currentTask.assignedTo ? (currentTask.assignedTo as any).username : 'לא שובץ'
    };
  });
}
//ייצוא של כל הפונקציות שיצרנו כדי שנוכל להשתמש בהן בקונטרולרים שלנו
export {
  getRepairById,  
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
  getDashboardView
  };