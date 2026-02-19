import { Repair } from './repairModel';

export const createRepair = async (repairData: any) => {
  return await Repair.create(repairData);
};

export const getRepairById = async (id: string) => {
  return await Repair.findById(id).populate('customer').populate('tasks.assignedTo');
};

export const updateTaskStatus = async (repairId: string, taskIndex: number, status: string) => {
  return await Repair.findByIdAndUpdate(
    repairId,
    { $set: { [`tasks.${taskIndex}.status`]: status } },
    { new: true }
  );
};
