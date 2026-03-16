import { User } from './userModel';
import { Customer } from '../Customer/customerModel'; 
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';  

interface UserData {
    username: string;
    password: string;
    fullName: string;
    role: 'Admin' | 'Worker' | 'QC';
    specialty: string;
}

const SECRET_KEY = 'SECRET_KEY_123';

export const createUser = async (userData: UserData) => {
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
        throw new Error('שם המשתמש כבר קיים במערכת');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = new User({
        ...userData,
        password: hashedPassword 
    });

    return await newUser.save();
};

export const loginUser = async (username: string, password: string) => {
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: '1d' }
    );

    return {
        token,
        user: {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role
        }
    };
};

export const getAllUsers = async () => {
    return await User.find().select('-password');
};

export const getUserById = async (userId: string) => {
    const user = await User.findById(userId)
    .select('-password')
    .populate('workload');
    
    if (!user) {
        throw new Error('העובדת לא נמצאה במערכת');
    }
    return user;
};

export const getUserByUsername = async (username: string) => {
    const user = await User.findOne({ username })
        .select('-password')
        .populate('workload');
        
    if (!user) {
        throw new Error(`לא נמצאה עובדת עם שם המשתמש: ${username}`);
    }
    return user;
};

export const updateUser = async (userId: string, updateData: Partial<UserData>) => {
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        throw new Error('לא ניתן לעדכן, העובדת לא נמצאה');
    }

    return updatedUser;
};

export const deleteUser = async (userId: string) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw new Error('לא ניתן למחוק, העובדת לא נמצאה');
    }
    return { message: 'העובדת נמחקה בהצלחה מהמערכת' };
};