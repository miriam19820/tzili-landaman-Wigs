import app from './app'; 
import { connectDB } from './Utils/connectDB';

const PORT = 5000;

const startServer = async () => {
    try {
        // 1. קודם כל מתחברים למסד הנתונים
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // 2. מפעילים את השרת שיקשיב לבקשות
        app.listen(PORT, () => {
            console.log(`🚀 The server is running! Waiting for you at: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error starting the server:', error);
    }
};

startServer();