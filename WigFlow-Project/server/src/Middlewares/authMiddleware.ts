import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
        if (req.user && (req.user.role === 'Admin' || req.user.role === 'Secretary')) {
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
    verifyToken(req, res, () => {
        if (req.user && (req.user.role === 'QC' || req.user.role === 'Inspector' || req.user.role === 'Admin')) {
            next();
        } else {
            res.status(403).json({ message: 'גישה חסומה: נדרשת הרשאת בקרת איכות' });
        }
    });
};