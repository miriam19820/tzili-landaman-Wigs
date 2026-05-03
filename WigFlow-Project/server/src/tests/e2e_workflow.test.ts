import request from 'supertest';
import app from '../app'; 
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models_Service/User/userModel';
import { Customer } from '../Models_Service/Customer/customerModel';
import { NewWig } from '../Models_Service/NewWigs/newWigModel';
import { Service } from '../Models_Service/SalonServices/serviceModel';

let adminToken: string;
let workerToken: string;
let workerId: string;
let customerId: string;
let createdWigId: string;
let createdQaTaskId: string;
let w1Id: string, w2Id: string, w3Id: string, w4Id: string, w5Id: string;

describe('End-to-End: Production to QA Rejection (Developer #5)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    // ניקוי מסד הנתונים לפני תחילת הטסט
    await User.deleteMany({});
    await NewWig.deleteMany({});
    await Customer.deleteMany({});
    await Service.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. יצירת מנהלת QA
    await User.create({ username: 'admin_e2e', password: hashedPassword, fullName: 'מנהלת איכות', role: 'Admin', specialty: 'ניהול' });
    
    // 2. יצירת עובדות לכל אחת מהתחנות כדי שהפאה תוכל לעבור ביניהן
    const w1 = await User.create({ username: 'w1', password: hashedPassword, fullName: 'עובדת 1', role: 'Worker', specialty: 'התאמת שיער' });
    workerId = w1._id.toString();
    w1Id = w1._id.toString();
    
    const w2 = await User.create({ username: 'w2', password: hashedPassword, fullName: 'עובדת 2', role: 'Worker', specialty: 'תפירה' });
    w2Id = w2._id.toString();
    const w3 = await User.create({ username: 'w3', password: hashedPassword, fullName: 'עובדת 3', role: 'Worker', specialty: 'צבע' });
    w3Id = w3._id.toString();
    const w4 = await User.create({ username: 'w4', password: hashedPassword, fullName: 'עובדת 4', role: 'Worker', specialty: 'עבודת יד' });
    w4Id = w4._id.toString();
    const w5 = await User.create({ username: 'w5', password: hashedPassword, fullName: 'עובדת 5', role: 'Worker', specialty: 'חפיפה' });
    w5Id = w5._id.toString();

    // התחברות לקבלת טוקנים
    const adminRes = await request(app).post('/api/users/login').send({ username: 'admin_e2e', password: 'password123' });
    adminToken = adminRes.body.token;

    const workerRes = await request(app).post('/api/users/login').send({ username: 'w1', password: 'password123' });
    workerToken = workerRes.body.token;

    // יצירת לקוחה
    const customer = await Customer.create({ firstName: 'טסט', lastName: 'מקצה לקצה', phoneNumber: '0501234567', email: 'test@e2e.com' });
    customerId = customer._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. Should create a new wig order', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: customerId,
        measurements: { circumference: 55, earToEar: 30, frontToBack: 35 },
        netSize: 'M',
        hairType: 'חלק',
        stageAssignments: { 
          'התאמת שיער': [w1Id],
          'תפירת פאה': [w2Id],
          'צבע': [w3Id],
          'עבודת יד': [w4Id],
          'חפיפה': [w5Id]
        }
      });

    expect(res.status).toBe(201);
    createdWigId = res.body.data._id;
  });

  it('2. Should move wig through all stages until QA', async () => {
    // השלבים: התאמת שיער -> תפירת פאה -> צבע -> עבודת יד -> חפיפה -> בקרה
    // נריץ את פקודת ההתקדמות 5 פעמים כדי שהפאה תעבור את כל פס הייצור
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .patch(`/api/wigs/${createdWigId}/next-step`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({});
      expect(res.status).toBe(200);
    }

    // מוודאים שהפאה הגיעה לשלב 'בקרה'
    const wig = await NewWig.findById(createdWigId);
    expect(wig?.currentStage).toBe('בקרה');

    // מוודאים שנוצרה משימת QA באופן אוטומטי
    const qaTask = await Service.findOne({ newWigReference: createdWigId, status: 'QA' });
    expect(qaTask).toBeTruthy();
    createdQaTaskId = qaTask!._id.toString();
  });

  it('3. Should reject the wig in QA and send it back to specific stage', async () => {
    const returnStages = ['תפירת פאה'];
    const qaNote = 'התפירה לא ישרה';

    // הבודקת שולחת את בקשת הפסילה עם התחנות שבחרה
    const res = await request(app)
      .patch(`/api/services/${createdQaTaskId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qaNote, returnStages });

    expect(res.status).toBe(200);

    // בדיקת הקסם שלנו: מוודאים שהפאה באמת חזרה אחורה
    const updatedWig = await NewWig.findById(createdWigId);
    expect(updatedWig?.currentStage).toBe('תפירת פאה');
    // הפאה חזרה לשלב הנכון
    expect(updatedWig?.assignedWorkers).toBeDefined();

    // מוודאים שמשימת ה-QA נסגרה עם ההערה שלנו
    const closedTask = await Service.findById(createdQaTaskId);
    expect(closedTask?.status).toBe('Rejected');
    expect(closedTask?.notes?.qa).toBe(qaNote);
  });
});