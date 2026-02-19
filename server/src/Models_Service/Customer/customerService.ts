import { Customer } from './customerModel';

export const createCustomer = async (customerData: any) => {
  return await Customer.create(customerData);
};

export const getCustomerById = async (id: string) => {
  return await Customer.findById(id);
};
