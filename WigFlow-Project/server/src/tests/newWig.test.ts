import request from 'supertest';
import app from '../app'; 
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models_Service/User/userModel';
import { Customer } from '../Models_Service/Customer/customerModel';
import { NewWig } from '../Models_Service/NewWigs/newWigModel';

let adminToken: string;
let workerToken: string;
let workerId: string;
let customerId: string;
let createdWigId: string;

describe('New Wigs API Tests (Developer #2)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    // ניקוי מסד הנתונים לפני הבדיקה
    await User.deleteMany({});
    await NewWig.deleteMany({});
    await Customer.deleteMany({});
    
    // הצפנת הסיסמה כדי שהלוגין יעבוד
    const hashedPassword = await bcrypt.hash('password123', 10);

    // יצירת משתמש מנהלת
    await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'מנהלת מערכת',
      role: 'Admin',
      specialty: 'ניהול'
    });

    // יצירת עובדת פס ייצור (שרה)
    const worker = await User.create({
      username: 'שרה',
      password: hashedPassword,
      fullName: 'שרה לוי',
      role: 'Worker',
      specialty: 'התאמת שיער'
    });
    workerId = worker._id.toString();

    // יצירת עובדת תפירה (הני) - התיקון שנוסף!
    await User.create({
      username: 'הני',
      password: hashedPassword,
      fullName: 'הני כהן',
      role: 'Worker',
      specialty: 'תפירה'
    });

    // ------------------------------------------
    // עכשיו נבצע התחברות עם המשתמשים שיצרנו!
    // ------------------------------------------
    const adminRes = await request(app).post('/api/users/login').send({
      username: 'admin',
      password: 'password123'
    });
    adminToken = adminRes.body.token;

    const workerRes = await request(app).post('/api/users/login').send({
      username: 'שרה',
      password: 'password123'
    });
    workerToken = workerRes.body.token;

    // יצירת לקוחה פיקטיבית
    const customer = await Customer.create({
      firstName: 'לקוחת', lastName: 'טסט', phoneNumber: '0501234567', email: 'test@test.com'
    });
    customerId = customer._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- בדיקה 1: יצירת הזמנה חדשה ---
  it('1. Should create a new wig order (POST /api/wigs/new)', async () => {
    const response = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: customerId,
        measurements: { circumference: 55, earToEar: 30, frontToBack: 35 },
        netSize: 'M',
        hairType: 'חלק',
        currentStage: 'התאמת שיער',
        assignedWorker: workerId
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toBeDefined();
    
    // נשמור את מזהה הפאה לבדיקות הבאות
    createdWigId = response.body.data._id || response.body.data.id; 
  });

  // --- בדיקה 2: שליפת הפאות לעובדת בתחנה ---
  it('2. Should get wigs for specific worker (GET /api/wigs/work-station/:workerId)', async () => {
    const response = await request(app)
      .get(`/api/wigs/work-station/${workerId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // --- בדיקה 3: סימון הפאה כדחופה ---
  it('3. Should update wig urgency (PATCH /api/wigs/:id/urgency)', async () => {
    const response = await request(app)
      .patch(`/api/wigs/${createdWigId}/urgency`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isUrgent: true });

    expect(response.status).toBe(200);
  });

  // --- בדיקה 4: העברה לשלב הבא בייצור ---
  it('4. Should move wig to the next step (PATCH /api/wigs/:id/next-step)', async () => {
    const response = await request(app)
      .patch(`/api/wigs/${createdWigId}/next-step`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({}); 

    expect(response.status).toBe(200);
  });

});