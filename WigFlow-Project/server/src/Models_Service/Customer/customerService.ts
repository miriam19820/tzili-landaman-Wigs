import { Customer } from './customerModel.js';
import { AppError } from '../../Utils/AppError.js';


export const createCustomer = async (customerData: any) => {
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

export const findCustomerByName = async (fullName: string) => {
    if (!fullName) return null;


    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');


    return await Customer.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
    });
};


export const addInternalNote = async (customerId: string, noteData: { content: string, author?: string, context?: string }) => {
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new AppError('הלקוחה לא נמצאה במערכת', 404);
    }


    if (!customer.internalNotes) {
        (customer as any).internalNotes = [];
    }
    
    (customer as any).internalNotes.push(noteData);
    
    return await customer.save();
};


export const getAllCustomers = async () => {
    return await Customer.find().sort({ firstName: 1 });
};
export const deleteInternalNote = async (customerId: string, noteId: string) => {
    const customer = await Customer.findByIdAndUpdate(
        customerId,
        { $pull: { internalNotes: { _id: noteId } } },
        { new: true }
    );
    
    if (!customer) {
        throw new AppError('הלקוחה לא נמצאה במערכת', 404);
    }
    
    return customer;
};