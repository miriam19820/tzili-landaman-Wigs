import { Router } from 'express';
// ייבוא המודל הנכון - מודל המשתמשים (העובדות) ולא מודל הלקוחות
import { User } from '../Models_Service/User/userModel';

const userRouter = Router();

// 1. שליפת כל המשתמשים (צוות העובדות וההנהלה)
// הקליינט ב-React פונה לנתיב הזה כדי למשוך את רשימת העובדות
userRouter.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users); // מחזיר מערך של משתמשים
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

// 2. יצירת משתמש/ת חדש/ה (אופציונלי - כדי שתוכל להוסיף עובדות דרך Postman או ממשק עתידי)
userRouter.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת המשתמש', error: error.message });
  }
});

export default userRouter;