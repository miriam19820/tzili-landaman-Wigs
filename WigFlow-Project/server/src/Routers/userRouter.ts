import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';

const userRouter = Router();


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
