import { Router } from 'express';
import { User } from '../Models_Service/User/userModel';
import { 
    loginUser, 
    createUser, 
    getUserById, 
    getUserByUsername, 
    updateUser, 
    deleteUser 
} from '../Models_Service/User/userService'; 
import { verifyToken, verifyAdmin } from '../Middlewares/authMiddleware';

const userRouter = Router();

/**
 * 1. כניסה למערכת (Login)
 * POST http://localhost:3000/api/users/login
 */
userRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await loginUser(username, password);
        res.json(result); 
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
});

/**
 * 2. רישום עובדת חדשה (רק מנהלת יכולה!)
 * POST http://localhost:3000/api/users/register
 */
userRouter.post('/register', verifyAdmin, async (req, res) => {
    try {
        const newUser = await createUser(req.body); 
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 3. שליפת כל המשתמשות (All)
 * GET http://localhost:3000/api/users/all
 */
userRouter.get('/all', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').populate('workload');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
    }
});

/**
 * 4. חיפוש עובדת לפי ID
 * GET http://localhost:3000/api/users/search-id/:userId
 */
userRouter.get('/search-id/:userId', verifyToken, async (req, res) => {
    try {
        const user = await getUserById(req.params.userId);
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

/**
 * 5. חיפוש עובדת לפי שם משתמש (Username)
 * GET http://localhost:3000/api/users/search-name/:username
 */
userRouter.get('/search-name/:username', verifyToken, async (req, res) => {
    try {
        const user = await getUserByUsername(req.params.username);
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

/**
 * 6. עדכון פרטי עובדת (Update)
 * PATCH http://localhost:3000/api/users/update/:userId
 */
userRouter.patch('/update/:userId', verifyAdmin, async (req, res) => {
    try {
        const updatedUser = await updateUser(req.params.userId, req.body);
        res.json(updatedUser);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * 7. מחיקת עובדת (Delete)
 * DELETE http://localhost:3000/api/users/delete/:userId
 */
userRouter.delete('/delete/:userId', verifyAdmin, async (req, res) => {
    try {
        const result = await deleteUser(req.params.userId);
        res.json(result);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
});

export default userRouter;