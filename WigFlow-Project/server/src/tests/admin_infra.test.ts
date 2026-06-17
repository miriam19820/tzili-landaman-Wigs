import request from 'supertest';
import app from '../app'; 
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models_Service/User/userModel';

let adminToken: string;
let workerToken: string;

describe('Infrastructure & Admin API Tests (Developer #1)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    await User.deleteMany({});
    
    // יצירת סיסמה מוצפנת מראש עבור הטסטים
    const hashedPassword = await bcrypt.hash('securePassword123', 10);

    // יצירת מנהלת ישירות ב-DB (התשתית של מפתחת 1)
    await User.create({
      username: 'boss_lady',
      password: hashedPassword,
      fullName: 'מנהלת ראשית',
      role: 'Admin',
      specialty: 'ניהול'
    });

    // יצירת עובדת ישירות ב-DB
    await User.create({
      username: 'worker_bee',
      password: hashedPassword,
      fullName: 'עובדת חרוצה',
      role: 'Worker',
      specialty: 'תפירה'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- בדיקה 1: התחברות (Login) ---
  it('1. Should login successfully and return a token', async () => {
    const res = await request(app).post('/api/users/login').send({
      username: 'boss_lady',
      password: 'securePassword123'
    });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    adminToken = res.body.token;

    const workerRes = await request(app).post('/api/users/login').send({
      username: 'worker_bee',
      password: 'securePassword123'
    });
    workerToken = workerRes.body.token;
  });

  // --- בדיקה 2: אבטחת הרשאות (Middleware) ---
  it('2. Should block worker from accessing admin-only routes', async () => {
    // ניסיון של עובדת לגשת לרשימת המשתמשים (דורש Admin)
    const res = await request(app)
      .get('/api/users') 
      .set('Authorization', `Bearer ${workerToken}`);
    
    // כאן אנחנו מצפים ל-403 (מחובר אבל אין הרשאה)
    expect(res.status).toBe(403); 
  });

  // --- בדיקה 3: שליפת דשבורד מנהלת ---
  it('3. Should fetch dashboard overview', async () => {
    // הנתיב תוקן ל-repairs כפי שמופיע בקוד של מפתחת 3
    const res = await request(app)
      .get('/api/repairs/dashboard-view') 
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});