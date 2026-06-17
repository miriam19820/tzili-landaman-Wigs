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
let customerId: string;

describe('Edge Cases and Error Handling (Negative Paths)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    // ניקוי מסד הנתונים
    await User.deleteMany({});
    await Customer.deleteMany({});
    await NewWig.deleteMany({});
    await Service.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    // יצירת מנהלת ועובדת כדי לבדוק הרשאות
    await User.create({ username: 'admin_edge', password: hashedPassword, fullName: 'מנהלת קצה', role: 'Admin', specialty: 'ניהול' });
    await User.create({ username: 'worker_edge', password: hashedPassword, fullName: 'עובדת קצה', role: 'Worker', specialty: 'תפירה' });

    const adminRes = await request(app).post('/api/users/login').send({ username: 'admin_edge', password: 'password123' });
    adminToken = adminRes.body.token;

    const workerRes = await request(app).post('/api/users/login').send({ username: 'worker_edge', password: 'password123' });
    workerToken = workerRes.body.token;

    const customer = await Customer.create({ 
        firstName: 'לקוחת', 
        lastName: 'קצה', 
        phoneNumber: '0555555555',
        email: 'test@edge.com' 
    });
    customerId = customer._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. Should block wig creation if measurements are missing (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: customerId,
        netSize: 'M',
        hairType: 'חלק'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('חובה להזין את כל מידות הלקוחה');
  });

  it('2. Should block a worker from opening a new order (Security / 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${workerToken}`) 
      .send({
        customer: customerId,
        measurements: { circumference: 55, earToEar: 30, frontToBack: 35 }
      });

    expect(res.status).toBeGreaterThanOrEqual(401); 
  });

  it('3. Should throw an error if trying to register a customer with an existing phone number', async () => {
    const duplicateCustomerData = {
      firstName: 'שוכפלת',
      lastName: 'בטעות',
      phoneNumber: '0555555555', // מספר טלפון שכבר קיים
      email: 'dup@edge.com' 
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(duplicateCustomerData);

    // השרת יזרוק לנו עכשיו שגיאה בזכות התיקון שהוספנו ב-customerService!
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('4. Should default to "תפירת פאה" if QA rejection array is empty', async () => {
    // התיקון: הוספנו orderCode למודל
    const wig = await NewWig.create({
        customer: customerId,
        orderCode: 'WIG-TEST-1234', 
        measurements: { circumference: 55, earToEar: 30, frontToBack: 35 },
        currentStage: 'בקרה'
    });

    const qaTask = await Service.create({
        customer: customerId,
        serviceType: 'Production QA',
        origin: 'NewWig',
        newWigReference: wig._id,
        status: 'QA'
    });

    const res = await request(app)
      .patch(`/api/services/${qaTask._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qaNote: 'שכחתי לסמן תחנה', returnStages: [] });

    expect(res.status).toBe(200);

    const updatedWig = await NewWig.findById(wig._id);
    expect(updatedWig?.currentStage).toBe('תפירת פאה');
  });
});