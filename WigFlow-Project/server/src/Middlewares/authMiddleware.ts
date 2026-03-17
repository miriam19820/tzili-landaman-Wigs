import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; 

interface AuthRequest extends Request {
    user?: any;
}

/**
 * המפתח הסודי לאימות טוקנים.
 * שילבנו את השמות שמרים ואיילה השתמשו בהם כדי למנוע תקלות.
 * ודאי שבקובץ ה-.env שלך קיים אחד מהם.
 */
const SECRET_KEY = process.env.WIG_SYSTEM_AUTH_KEY || process.env.JWT_SECRET || 'SECRET_KEY_123'; 

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
 * ולידציה של הרשאת בקרת איכות (QC / Inspector)
 */
export const verifyQC = (req: AuthRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
        // הוספנו תמיכה גם ב-QC וגם ב-Inspector לפי השינויים ב-App.tsx
        if (req.user && (req.user.role === 'QC' || req.user.role === 'Inspector' || req.user.role === 'Admin')) {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת בקרת איכות' });
        }
    });
};