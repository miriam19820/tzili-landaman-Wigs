import express from 'express';

import * as userService from '../Models_Service/User/userService.js';

import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await userService.loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

userRouter.get('/', verifyAdmin, async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


userRouter.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

userRouter.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});


userRouter.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(200).json({ message: 'העובדת נמחקה בהצלחה' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

userRouter.get('/:workerId/unified-tasks', verifyToken, async (req, res) => {
    try {
        const tasks = await userService.getWorkerUnifiedTasks(req.params.workerId);
        res.status(200).json({ success: true, data: tasks });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default userRouter;