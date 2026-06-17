import request from 'supertest';
import app from '../app'; 
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models_Service/User/userModel';
import { Customer } from '../Models_Service/Customer/customerModel';
import { Repair } from '../Models_Service/Repairs/repairModel';

let adminToken: string;
let workerToken: string;
let repairWorkerId: string;
let washerWorkerId: string;
let adminId: string;
let customerId: string;
let createdRepairId: string;

describe('Repairs API Tests (Developer #3)', () => {
  
  beforeAll(async () => {
    // התחברות למסד הנתונים של הטסטים
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    // ניקוי הקולקציות
    await User.deleteMany({});
    await Repair.deleteMany({});
    await Customer.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. יצירת מנהלת
    const admin = await User.create({
      username: 'admin_repairs',
      password: hashedPassword,
      fullName: 'מזכירת תיקונים',
      role: 'Admin',
      specialty: 'ניהול'
    });
    adminId = admin._id.toString();

    // 2. יצירת עובדת תיקונים (שרה - התמחות מכונה)
    const repairWorker = await User.create({
      username: 'שרה_תיקונים',
      password: hashedPassword,
      fullName: 'שרה כהן',
      role: 'Worker',
      specialty: 'מכונה'
    });
    repairWorkerId = repairWorker._id.toString();

    // 3. יצירת עובדת חפיפה (שתקבל את הפאה אוטומטית בסוף התיקון)
    const washerWorker = await User.create({
      username: 'רחלי_חופפת',
      password: hashedPassword,
      fullName: 'רחלי לוי',
      role: 'Worker',
      specialty: 'חפיפה'
    });
    washerWorkerId = washerWorker._id.toString();

    // התחברות המנהלת וקבלת Token
    const adminRes = await request(app).post('/api/users/login').send({
      username: 'admin_repairs',
      password: 'password123'
    });
    adminToken = adminRes.body.token;

    // התחברות עובדת התיקונים וקבלת Token
    const workerRes = await request(app).post('/api/users/login').send({
      username: 'שרה_תיקונים',
      password: 'password123'
    });
    workerToken = workerRes.body.token;

    // יצירת לקוחה פיקטיבית
    const customer = await Customer.create({
      firstName: 'רותי', lastName: 'לקוחה', phoneNumber: '0522222222', email: 'ruti@test.com'
    });
    customerId = customer._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- בדיקה 1: פתיחת כרטיס תיקון חדש ---
  it('1. Should create a new repair order (POST /api/repairs)', async () => {
    const response = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wigCode: 'REP-999',
        customerId: customerId,
        isUrgent: true,
        stylingType: 'חלק',
        washerId: washerWorkerId,
        adminId: adminId,
        tasks: [
          {
            category: 'מכונה',
            subCategory: 'תיקון רשת',
            assignedTo: repairWorkerId
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.overallStatus).toBe('בתיקון');
    expect(response.body.data.tasks.length).toBeGreaterThan(1); // צריך להכיל גם את התיקון וגם חפיפה ובקרה שנוספו אוטומטית

    createdRepairId = response.body.data._id || response.body.data.id;
  });

  // --- בדיקה 2: שליפת המשימה האישית של העובדת ---
  it('2. Should fetch tasks for specific repair worker (GET /api/repairs/worker-tasks/:workerId)', async () => {
    const response = await request(app)
      .get(`/api/repairs/worker-tasks/${repairWorkerId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    // מוודא שהפאה ששלחנו מופיעה אצל שרה
    expect(response.body.data.some((task: any) => task.wigCode === 'REP-999')).toBe(true);
  });

  // --- בדיקה 3: סימון המשימה כ"בוצע" ומעבר אוטומטי הלאה! ---
  it('3. Should complete task and move to next stage automatically (PATCH /api/repairs/:id/task/:index)', async () => {
    // אינדקס 0 הוא המשימה הראשונה (תיקון רשת)
    const response = await request(app)
      .patch(`/api/repairs/${createdRepairId}/task/0`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ status: 'בוצע' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // הפונקציה החכמה אמורה להחזיר שהמשימה עברה לחפיפה!
    expect(response.body.message).toContain('המשימה הושלמה'); 
  });

});