import { User } from './userModel';
<<<<<<< HEAD:WigFlow-Project/server/src/Models_Service/User/userService.ts
import { Customer } from '../Customer/customerModel'; 
=======
<<<<<<< HEAD
import { Customer } from '../Customer/customerModel'; 
=======
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';  
>>>>>>> f514276d700e85a8075a6e6e0830bc2843dc3126
>>>>>>> origin/miryami:server/src/Models_Service/User/userService.ts

// הגדרת ה"חוזה" של הנתונים - זה מה שמעלים את האדום מ-userData
interface UserData {
    username: string;
    password: string;
    fullName: string;
    role: 'Admin' | 'Worker' | 'QC';
    specialty: string;
}

/**
 * פונקציה ליצירת עובדת חדשה (הרשמה)
 * מיועדת לשימוש על ידי המזכירה בלבד
 */
export const createUser = async (userData: UserData) => {
    // 1. בדיקה אם שם המשתמש כבר תפוס
    const existingUser = await User.findOne({ username: userData.username });
    if (existingUser) {
        throw new Error('שם המשתמש כבר קיים במערכת');
    }

    // 2. יצירת ה"מלח" (Salt) להצפנה
    const salt = await bcrypt.genSalt(10);
    
    // 3. הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // 4. יצירת האובייקט החדש ושמירתו
    const newUser = new User({
        ...userData,
        password: hashedPassword 
    });

    return await newUser.save();
};

/**
 * פונקציה לכניסה למערכת (Login)
 */
export const loginUser = async (username: string, password: string) => {
    // 1. חיפוש המשתמשת לפי שם משתמש
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    // 2. השוואת הסיסמה שהוקלדה לסיסמה המוצפנת ב-DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    // 3. יצירת ה-Token (הכרטיס המגנטי)
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        'SECRET_KEY_123', // כדאי להחליף למחרוזת סודית משלך
        { expiresIn: '1d' }
    );

    // 4. החזרת הנתונים לריאקט (ללא הסיסמה)
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
    // מביא את כל המשתמשים ומוריד את שדה הסיסמה מהתוצאה
    return await User.find().select('-password');
};

/**
 * 2. הצגת עובדת אחת לפי ID
 * קריטי עבור שאר המפתחות! ככה הן יודעות מי העובדת שטיפלה בפאה מסוימת
 */
export const getUserById = async (userId: string) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error('העובדת לא נמצאה במערכת');
    }
    return user;
};

/**
 * 3. חיפוש עובדת לפי שם משתמש (Username)
 * מיועד למזכירה שרוצה לחפש עובדת ספציפית בתיבת חיפוש
 */
export const getUserByUsername = async (username: string) => {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
        throw new Error(`לא נמצאה עובדת עם שם המשתמש: ${username}`);
    }
    return user;
};

/**
 * 4. עדכון פרטי עובדת
 * מאפשר למנהלת לשנות תפקיד, שם או התמחות (specialty)
 */
export const updateUser = async (userId: string, updateData: Partial<UserData>) => {
    // אם המנהלת מעדכנת גם סיסמה, צריך להצפין אותה מחדש
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true } // מחזיר את האובייקט החדש ובודק תקינות
    ).select('-password');

    if (!updatedUser) {
        throw new Error('לא ניתן לעדכן, העובדת לא נמצאה');
    }

    return updatedUser;
};

/**
 * 5. מחיקת עובדת
 * כשהעובדת עוזבת את הסלון ומסירים אותה מהמערכת
 */
export const deleteUser = async (userId: string) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw new Error('לא ניתן למחוק, העובדת לא נמצאה');
    }
    return { message: 'העובדת נמחקה בהצלחה מהמערכת' };
};