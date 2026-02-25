import app from './app';
import { connectDB } from './Utils/connectDB';
import { Customer } from './Models_Service/Customer/customerModel';
import { User } from './Models_Service/User/userModel';
import { Service } from './Models_Service/SalonServices/serviceModel';

const PORT = 3000;

const startServer = async () => {
    try {
        console.log("Starting server...");
        
        // 1. קודם כל מתחברים למסד הנתונים ומחכים שזה יסתיים
        await connectDB(); 
        console.log('✅ מחובר ל-MongoDB בהצלחה!');

        // 2. רק אחרי שהתחברנו, מנקים ומכניסים נתונים (Seed)
        // אם כאן זה נתקע - זה אומר שיש בעיית הרשאות ב-IP של אטלס
        await Customer.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});
        console.log('🧹 מסד הנתונים נוקה');

        const customer = await Customer.create({ 
            firstName: 'שרה', lastName: 'כהן', idNumber: '012345678', 
            phoneNumber: '050-1234567', email: 'sara@example.com', address: 'ירושלים' 
        });
        
        const user = await User.create({ 
            username: 'מרים', role: 'Admin', specialty: 'סרוק' 
        });
        
        await Service.create({ 
            customer: customer._id, 
            serviceType: 'סירוק בלבד', 
            styleCategory: 'גלי', 
            origin: 'Service',
            status: 'ממתין לסירוק', 
            assignedWorker: user._id 
        });
        console.log('✅ נתוני Seed הוכנסו למסד הנתונים!');

        // 3. רק בסוף פותחים את השרת להאזנה
        app.listen(PORT, () => {
            console.log(`🚀 השרת פועל בפורט: ${PORT}`);
            console.log("הכל מחובר ועובד - מסד נתונים + שרת!");
        });

    } catch (error) {
        console.error('❌ שגיאה קריטית בהפעלה:', error);
        process.exit(1); // סגירת התהליך אם אין חיבור ל-DB
    }
};

startServer();