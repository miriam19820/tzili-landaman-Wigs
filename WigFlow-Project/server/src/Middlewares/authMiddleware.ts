import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Models_Service/User/userModel.js'; // ייבוא המודל כדי לשלוף נתונים ממסד הנתונים

interface AuthRequest extends Request {
    user?: any;
}

const SECRET_KEY = process.env.JWT_SECRET || 'WIG_FLOW_SECRET_2026';

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'גישה נדחתה: לא סופק טוקן אבטחה' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(401).json({ message: 'טוקן לא תקין או פג תוקף' });
    }
};

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        if (req.user && req.user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת מזכירה/מנהלת' });
        }
    });
};

export const verifyWorker = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        if (req.user && (req.user.role === 'Worker' || req.user.role === 'Admin')) {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת עובדת' });
        }
    });
};

export const verifyQC = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, async () => {
        try {
            // 1. בדיקה מהירה - האם התפקיד הרשמי מספיק
            if (req.user && (req.user.role === 'QC' || req.user.role === 'Inspector' || req.user.role === 'Admin')) {
                return next();
            } 
            
            // 2. התיקון: אם זו עובדת, נבדוק במסד הנתונים האם ההתמחות שלה היא בקרת איכות
            if (req.user && req.user.role === 'Worker') {
                const userDb = await User.findById(req.user.id);
                if (userDb && (userDb.specialty === 'בקרת איכות' || userDb.specialty === 'בקרה')) {
                    return next(); // אישור גישה
                }
            }
            
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת בקרת איכות' });
        } catch (error) {
            res.status(500).json({ message: 'שגיאת שרת באימות הרשאות' });
        }
    });
};