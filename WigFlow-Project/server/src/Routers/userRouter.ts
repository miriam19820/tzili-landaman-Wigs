import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import * as userService from '../Models_Service/User/userService';
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';

const userRouter = Router();

userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await userService.loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

userRouter.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

userRouter.post('/', verifyAdmin, async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default userRouter;