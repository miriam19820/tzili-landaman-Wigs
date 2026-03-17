import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import { loginUser } from '../Models_Service/User/userService';
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';

const userRouter = Router();

// --- נתיב התחברות: פתוח לכולם (ללא Middleware) ---
userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'נא לספק שם משתמש וסיסמה' });
    }

    const result = await loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'שגיאה בהתחברות' });
  }
});

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
});

export default userRouter;