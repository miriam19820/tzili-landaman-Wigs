import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // ייבוא של איילה: מאפשר לקרוא נתונים מקובץ ה-.env

interface AuthRequest extends Request {
    user?: any;
}

/**
 * המפתח הסודי נמשך מקובץ ה-.env (באחריות איילה - מפתחת 1)
 * הוספנו 'SECRET_KEY_123' כגיבוי בלבד כדי למנוע קריסה
 */
const SECRET_KEY = process.env.WIG_SYSTEM_AUTH_KEY || 'SECRET_KEY_123'; 

/**
 * אימות טוקן בסיסי לכל בקשה
 */
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

/**
 * ולידציה של הרשאת מנהלת/מזכירה (Admin)
 */
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        if (req.user && req.user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת מזכירה/מנהלת' });
        }
    });
};

/**
 * ולידציה של הרשאת עובדת (Worker)
 */
export const verifyWorker = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        if (req.user && (req.user.role === 'Worker' || req.user.role === 'Admin')) {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת עובדת' });
        }
    });
};

/**
 * ולידציה של הרשאת בקרת איכות (QC)
 */
export const verifyQC = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        if (req.user && (req.user.role === 'QC' || req.user.role === 'Admin')) {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת בקרת איכות' });
        }
    });
};