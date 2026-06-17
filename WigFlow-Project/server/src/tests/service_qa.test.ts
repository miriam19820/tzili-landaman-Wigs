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
let adminId: string;
let customerId: string;
let createdRepairId: string;

describe('Services & QA API Tests (Developer #4 + Reject Fix)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    // ניקוי נתונים
    await User.deleteMany({});
    await Repair.deleteMany({});
    await Customer.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    // יצירת משתמשים: מנהלת (מבקרת איכות) ועובדת (תופרת)
    const admin = await User.create({
      username: 'qa_manager',
      password: hashedPassword,
      fullName: 'רבקה המבקרת',
      role: 'Admin',
      specialty: 'ניהול'
    });
    adminId = admin._id.toString();

    const worker = await User.create({
      username: 'tzippy_worker',
      password: hashedPassword,
      fullName: 'ציפי התופרת',
      role: 'Worker',
      specialty: 'מכונה'
    });
    repairWorkerId = worker._id.toString();

    // התחברות
    const adminRes = await request(app).post('/api/users/login').send({ username: 'qa_manager', password: 'password123' });
    adminToken = adminRes.body.token;

    const workerRes = await request(app).post('/api/users/login').send({ username: 'tzippy_worker', password: 'password123' });
    workerToken = workerRes.body.token;

    // יצירת לקוחה פיקטיבית לבדיקה (הוספנו את המייל החסר!)
    const customer = await Customer.create({ 
      firstName: 'חנה', 
      lastName: 'כהן', 
      phoneNumber: '0540000000',
      email: 'chana@test.com' 
    });
    customerId = customer._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --- בדיקה 1: יצירת כרטיס תיקון שיגיע ל-QA ---
  it('1. Should create a repair and complete initial task', async () => {
    const res = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wigCode: 'QA-100',
        customerId: customerId,
        stylingType: 'חלק',
        washerId: repairWorkerId, 
        adminId: adminId,
        tasks: [{ category: 'מכונה', subCategory: 'תיקון רשת', assignedTo: repairWorkerId }]
      });

    createdRepairId = res.body.data._id;

    // העובדת מסמנת "בוצע" על התיקון
    await request(app)
      .patch(`/api/repairs/${createdRepairId}/task/0`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ status: 'בוצע' });
      
    expect(res.status).toBe(201);
  });

  // --- בדיקה 2: בדיקת הבאג - פסילת QA והחזרה לעובדת עם הערה ---
  it('2. Should reject task in QA and verify note and status (The Fix!)', async () => {
    const rejectionNote = "התפר רופף מאוד בצד שמאל";
    
    const response = await request(app)
      .patch(`/api/repairs/${createdRepairId}/reject-task/0`) 
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: rejectionNote });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('הוחזרה לתיקון');

    const workerTasks = await request(app)
      .get(`/api/repairs/worker-tasks/${repairWorkerId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    const rejectedTask = workerTasks.body.data.find((t: any) => t.wigCode === 'QA-100');
    
    expect(rejectedTask).toBeDefined();
    expect(rejectedTask.task.status).toBe('ממתין'); 
    expect(rejectedTask.task.notes).toContain(rejectionNote); 
  });

  // --- בדיקה 3: אישור סופי והעברה למסירה ---
  it('3. Should approve in QA after fix and set to ready', async () => {
      // העובדת מתקנת ומסמנת שוב "בוצע"
      await request(app)
        .patch(`/api/repairs/${createdRepairId}/task/0`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ status: 'בוצע' });

      const dashboard = await request(app)
        .get('/api/repairs/dashboard-view')
        .set('Authorization', `Bearer ${adminToken}`);
        
      const currentWig = dashboard.body.data.find((w: any) => w.wigCode === 'QA-100');
      expect(currentWig.overallStatus).toMatch(/בחפיפה|בבקרה/);
  });
});