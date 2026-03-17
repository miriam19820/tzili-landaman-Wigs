<<<<<<< HEAD
import express, { Request, Response } from 'express';
import * as userService from '../Models_Service/User/userService';
=======
import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import { loginUser } from '../Models_Service/User/userService';
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';
>>>>>>> miriam

const router = express.Router();

<<<<<<< HEAD
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
=======
// --- נתיב התחברות: פתוח לכולם (ללא Middleware) ---
userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'נא לספק שם משתמש וסיסמה' });
>>>>>>> miriam
    }
});

<<<<<<< HEAD
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
=======
// --- שליפת רשימת משתמשים (כל משתמש מחובר) ---
// עובדות צריכות את זה כדי לראות למי להעביר את הפאה בתחנה הבאה
userRouter.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users); 
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

// --- יצירת משתמשת/עובדת חדשה במערכת (מנהלת בלבד!) ---
userRouter.post('/', verifyAdmin, async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת המשתמש', error: error.message });
  }
>>>>>>> miriam
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