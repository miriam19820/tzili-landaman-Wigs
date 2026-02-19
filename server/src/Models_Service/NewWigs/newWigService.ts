import { NewWig } from './newWigModel';

export const createNewWig = async (wigData: any) => {
  return await NewWig.create(wigData);
};

export const getNewWigById = async (id: string) => {
  return await NewWig.findById(id).populate('customer').populate('assignedWorker');
};
