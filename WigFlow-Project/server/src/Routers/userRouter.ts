import express, { Request, Response } from 'express';
import * as userService from '../Models_Service/User/userService';

const router = express.Router();

/**
 * 1. נתיב לכניסה (Login) - שילוב של הלוגיקה שלך בתוך המבנה של איילה
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'נא לספק שם משתמש וסיסמה' });
        }

        const result = await userService.loginUser(username, password);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message || 'שגיאה בהתחברות' });
    }
});

/**
 * 2. נתיב להרשמה (Register)
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json({ message: 'המשתמש נוצר בהצלחה', user: newUser });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. הצגת כל העובדות
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * 4. חיפוש עובדת לפי שם משתמש (Username)
 */
router.get('/search/:username', async (req: Request, res: Response) => {
    try {
        const user = await userService.getUserByUsername(req.params.username);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

/**
 * 5. הצגת עובדת אחת לפי ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

/**
 * 6. עדכון פרטי עובדת
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({ message: 'הפרטים עודכנו בהצלחה', user: updatedUser });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 7. מחיקת עובדת
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export default router;