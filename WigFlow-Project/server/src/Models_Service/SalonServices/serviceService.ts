import { Service } from './serviceModel';

export const createService = async (serviceData: any) => {
  return await Service.create(serviceData);
};

export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('customer').populate('assignedWorker');
};
