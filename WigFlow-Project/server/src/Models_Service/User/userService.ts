import { User } from './userModel.js';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';  
import { NewWig } from '../NewWigs/newWigModel.js';
import { getTasksByWorker } from '../Repairs/repairService.js';

interface UserData {
    username: string;
    password?: string; 
    fullName: string;
    role: 'Admin' | 'Worker' | 'QC' | 'Secretary' | 'Inspector';
    specialty: string;
}

const SECRET_KEY = process.env.JWT_SECRET || 'WIG_FLOW_SECRET_2026';

export const createUser = async (userData: UserData) => {
    
    const cleanUsername = userData.username.trim();
    
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
        throw new Error('שם המשתמש כבר קיים במערכת');
    }

    if (!userData.password) {
        throw new Error('חובה להזין סיסמה למשתמש חדש');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = new User({
        ...userData,
        username: cleanUsername,
        password: hashedPassword 
    });

    return await newUser.save();
};

export const loginUser = async (username: string, password: string) => {
   
    const cleanInputName = username.trim();
    console.log(`\n--- ניסיון התחברות ---`);
    console.log(`שם משתמש שהוקלד: "${cleanInputName}" (אורך: ${cleanInputName.length})`);
    
   
    const user = await User.findOne({ username: cleanInputName });
    
    if (!user) {
        console.log(`❌ שגיאה: לא נמצא משתמש בשם "${cleanInputName}" בבסיס הנתונים.`);
        
       
        const allUsers = await User.find({}, 'username');
        console.log(`שמות שקיימים ב-DB:`, allUsers.map(u => `"${u.username}"`));
        
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    console.log(`✅ משתמש נמצא: "${user.username}" (אורך ב-DB: ${user.username.length})`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log(`❌ שגיאה: הסיסמה לא תואמת.`);
        throw new Error('שם משתמש או סיסמה שגויים');
    }

    console.log(`✅ התחברות הצליחה!`);

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
            role: user.role,
            specialty: user.specialty
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
    const user = await User.findOne({ username: username.trim() })
        .select('-password')
        .populate('workload');
        
    if (!user) {
        throw new Error(`לא נמצאה עובדת עם שם המשתמש: ${username}`);
    }
    return user;
};

export const updateUser = async (userId: string, updateData: Partial<UserData>) => {
    if (updateData.username) {
        updateData.username = updateData.username.trim();
    }

    if (updateData.password && updateData.password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
        delete updateData.password;
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

export const getWorkerUnifiedTasks = async (workerId: string) => {
   
    const newWigs = await NewWig.find({ 
        assignedWorkers: { $in: [workerId] },
        currentStage: { $nin: ['בקרה', 'מוכנה למסירה', 'נמסר'] }
    }).populate('customer');
    const wigTasks = newWigs.map((wig: any) => ({
        repairId: wig._id.toString(), 
        type: 'חדשה', 
        wigCode: wig.orderCode,
        customerName: wig.customer ? `${wig.customer.firstName} ${wig.customer.lastName}` : 'לא ידוע',
        category: 'ייצור פאה חדשה',
        subCategory: wig.currentStage,
        isUrgent: wig.isUrgent,
        notes: wig.specialNotes || 'אין הערות מיוחדות',
        status: 'ממתין',
        taskIndexes: [],
        imageUrl: wig.imageUrl || ''
    }));
    const repairTasksRaw = await getTasksByWorker(workerId);
    const groupedRepairs = new Map<string, any>();

    repairTasksRaw.forEach((t: any) => {
        const repairIdStr = t.repairId.toString();
        
        // סינון משימות בקרה — הן שייכות ל-QA Dashboard בלבד
        if (t.task.category === 'בקרה') return;
    
        if (!groupedRepairs.has(repairIdStr)) {
            groupedRepairs.set(repairIdStr, {
                repairId: repairIdStr,
                type: 'תיקון',
                wigCode: t.wigCode,
                customerName: t.customerName,
                isUrgent: t.isUrgent,
                internalNote: t.internalNote || '',
                imageUrl: t.imageUrl || '',
                status: 'ממתין',
                category: `תיקונים (${t.task.category})`,
                subCategories: [], 
                groupedNotes: [],  
                taskIndexes: []   
            });
        }
        
        const group = groupedRepairs.get(repairIdStr);
        group.subCategories.push(t.task.subCategory);
        
        if (t.task.notes) {
            group.groupedNotes.push(`${t.task.subCategory}: ${t.task.notes}`);
        }
        if (t.task.deadline) {
            group.deadline = t.task.deadline; 
        }
     
        group.taskIndexes.push(t.taskIndex);
    });

    const repairTasks = Array.from(groupedRepairs.values());


    return [...wigTasks, ...repairTasks].sort((a, b) => (Number(b.isUrgent)) - (Number(a.isUrgent)));
};