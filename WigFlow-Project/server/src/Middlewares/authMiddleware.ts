import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: any;
}

const SECRET_KEY = 'SECRET_KEY_123';

/**
 * 1. verifyToken: בדיקה בסיסית - האם המשתמשת מחוברת?
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
 * 2. verifyAdmin: הרשאה למזכירה/מנהלת בלבד
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
 * 3. verifyWorker: הרשאה לעובדת (וגם למנהלת)
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
 * 4. verifyQC: הרשאה לבקרת איכות (וגם למנהלת)
 * זה החלק שהיה חסר וגרם לשגיאה בראוטר!
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