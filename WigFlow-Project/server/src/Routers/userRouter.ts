import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import * as userService from '../Models_Service/User/userService';
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';

const userRouter = Router();

// התחברות
userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await userService.loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

// שליפת כל המשתמשים (בסיסי)
userRouter.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

// --- נתיבים חדשים שנוספו ---

// שליפת עובדות כולל חישוב עומס (Workload) - למסך ניהול צוות
userRouter.get('/workload', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('workload'); // כאן קורה הקסם של ספירת המשימות
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת נתוני עומס' });
  }
});

// יצירת עובדת חדשה
userRouter.post('/', verifyAdmin, async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// עדכון עובדת (שם, סיסמה, התמחות או סטטוס פעיל)
userRouter.patch('/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// מחיקת עובדת מהמערכת
userRouter.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default userRouter;