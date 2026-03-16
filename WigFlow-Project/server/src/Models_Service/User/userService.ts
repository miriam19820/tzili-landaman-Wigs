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

<<<<<<< HEAD
const SECRET_KEY = 'SECRET_KEY_123'; // כדאי להעביר ל-.env בהמשך

=======
// יצירת משתמש חדש (כולל הצפנה)
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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

<<<<<<< HEAD
export const loginUser = async (username: string, password: string) => {
=======
// פונקציית ההתחברות המרכזית
export const loginUser = async (username: string, passwordInput: string) => {
    console.log("--- ניסיון התחברות חדש ---");
    console.log("שם משתמש שהוזן:", username);

    // 1. חיפוש המשתמש
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    const user = await User.findOne({ username });
    if (!user) {
        console.log("❌ שגיאה: המשתמש לא נמצא בבסיס הנתונים!");
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    console.log("✅ המשתמש נמצא. בודק סיסמה...");

    // 2. השוואת סיסמה (bcrypt)
    const isMatch = await bcrypt.compare(passwordInput, user.password);
    console.log("האם הסיסמה תואמת?", isMatch);

    if (!isMatch) {
        console.log("❌ שגיאה: הסיסמה לא תואמת!");
        throw new Error('שם משתמש או סיסמה שגויים');
    }

<<<<<<< HEAD
=======
    // 3. יצירת Token (JWT)
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: '1d' }
    );

    console.log("🚀 התחברות הצליחה! תפקיד:", user.role);

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
    // הערה: ודאי שהשדה workload קיים במודל שלך, אחרת הסירי את ה-populate
    const user = await User.findById(userId)
<<<<<<< HEAD
    .select('-password')
    .populate('workload');
=======
        .select('-password');
    
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
    if (!user) {
        throw new Error('העובדת לא נמצאה במערכת');
    }
    return user;
};

export const getUserByUsername = async (username: string) => {
    const user = await User.findOne({ username })
<<<<<<< HEAD
        .select('-password')
        .populate('workload');
=======
        .select('-password');
        
>>>>>>> 7c742fcf95e6fbef8d82842b4bfbe7174cef8f40
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