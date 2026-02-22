import { User } from './userModel';
import { Customer } from '../Customer/customerModel'; 

export const createUser = async (userData: any) => {
  return await User.create(userData);
};

export const getUserById = async (id: string) => {
  return await User.findById(id);
};
