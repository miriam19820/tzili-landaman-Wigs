import { Customer } from './customerModel';
import { AppError } from '../../Utils/AppError';

export const createCustomer = async (customerData: any) => {
  // בדיקה האם כבר קיימת לקוחה עם אותו מספר טלפון במערכת
  if (customerData.phoneNumber) {
    const existingCustomer = await Customer.findOne({ phoneNumber: customerData.phoneNumber });
    if (existingCustomer) {
      throw new AppError('לקוחה עם מספר טלפון זה כבר קיימת במערכת', 400);
    }
  }
  
  return await Customer.create(customerData);
};

export const getCustomerById = async (id: string) => {
  return await Customer.findById(id);
};