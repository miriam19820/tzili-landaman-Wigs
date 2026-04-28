// src/Models_Service/Repairs/repairService.ts

import { Repair } from './repairModel.js';
import { User } from '../User/userModel.js';
import { AppError } from '../../Utils/AppError.js';
import { addHistoryEvent } from '../WigHistory/wigHistoryService.js';

// ... (שאר הפונקציות למעלה נשארות אותו דבר)

export const createRepairOrder = async (repairData: any) => {
  const isUrgent = repairData.isUrgent || false;
  const photoUrl = repairData.beforeImageUrl || ''; 

  const finalSteps = [
    {
      category: 'חפיפה',
      subCategory: repairData.stylingType || 'חפיפה',
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

  const allTasks = [...(repairData.tasks || []), ...finalSteps];

  const newRepair = new Repair({
    wigCode: repairData.wigCode,       
    customer: repairData.customerId,  
    isUrgent: isUrgent,               
    tasks: allTasks, 
    beforeImageUrl: photoUrl,
    internalNote: repairData.internalNote 
  });

  const savedRepair = await newRepair.save();

  await addHistoryEvent({
    wigCode: savedRepair.wigCode,
    actionType: 'תיקון',
    stage: 'פתיחת תיקון',
    workerName: 'מזכירות',
    description: `הפאה נכנסה לתיקון`,
    beforeImageUrl: photoUrl,
    notes: repairData.internalNote
  }).catch((err: any) => console.error("History event failed:", err));

  return savedRepair;
};

export const finalizeRepairWithQA = async (repairId: string, afterImageUrl: string) => {
  const repair = await Repair.findById(repairId).populate('customer');
  if (!repair) throw new AppError("תיקון לא נמצא", 404);

  // הוספת (repair as any) פותרת את האדומים מתמונות 10 ו-11
  (repair as any).afterImageUrl = afterImageUrl; 
  (repair as any).overallStatus = 'מוכן';
  (repair as any).inspectedAt = new Date();

  repair.tasks.forEach(task => {
    task.status = 'בוצע';
  });

  const savedRepair = await repair.save();

  await addHistoryEvent({
    wigCode: savedRepair.wigCode,
    actionType: 'תיקון',
    stage: 'סיום תיקון ובקרה',
    workerName: 'בקרת איכות', 
    description: 'התיקון הושלם בהצלחה',
    beforeImageUrl: (savedRepair as any).beforeImageUrl,
    afterImageUrl: afterImageUrl,
    notes: (savedRepair as any).internalNote
  }).catch((err: any) => console.error("History event failed:", err));

  return savedRepair;
};

export const getTasksByWorker = async (workerId: string) => {
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
          // שימוש ב-as any פותר את האדומים מתמונה 8
          internalNote: (repair as any).internalNote,
          imageUrl: (repair as any).beforeImageUrl,
          taskIndex: index,
          task
        });
      }
    });
  });

  return result.sort((a, b) => (Number(b.isUrgent)) - (Number(a.isUrgent)));
};