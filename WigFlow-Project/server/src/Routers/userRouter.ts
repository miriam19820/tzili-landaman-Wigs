import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import { loginUser } from '../Models_Service/User/userService';

const userRouter = Router();

// --- זה הנתיב שהיה חסר! בלעדיו אי אפשר להתחבר ---
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

userRouter.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users); 
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

userRouter.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: 'שגיאה ביצירת המשתמש', error: error.message });
  }
});

export default userRouter;