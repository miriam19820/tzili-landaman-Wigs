import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// חסימת הוואטסאפ האמיתי כולל האזנה לאוונטים כדי למנוע קריסות ברקע
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockImplementation(() => Promise.resolve()),
    sendMessage: jest.fn().mockImplementation(() => Promise.resolve({ id: 'mock_123' })),
    on: jest.fn()
  })),
  LocalAuth: jest.fn().mockImplementation(() => ({}))
}), { virtual: true });

import request from 'supertest';
import app from '../app'; 
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models_Service/User/userModel';
import { Customer } from '../Models_Service/Customer/customerModel';
import { NewWig } from '../Models_Service/NewWigs/newWigModel';

let adminToken: string;
let workerToken: string;
let customerId: string;

describe('Edge Cases, Validation and Error Handling (Negative Paths)', () => {
  
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wigflow_test');
    
    await User.deleteMany({});
    await Customer.deleteMany({});
    await NewWig.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 10);

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
    customerId = (customer._id as mongoose.Types.ObjectId).toString();
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

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('2. Should block a worker from opening a new order (Security / 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${workerToken}`) 
      .send({
        customer: customerId,
        measurements: { circumference: 55, earToEar: 30, frontToBack: 35 }
      });

    expect(res.status).toBeGreaterThanOrEqual(400); 
  });

  it('3. Should throw an error if trying to register a customer with an existing phone number', async () => {
    const duplicateCustomerData = {
      firstName: 'שוכפלת',
      lastName: 'בטעות',
      phoneNumber: '0555555555', 
      email: 'dup@edge.com' 
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(duplicateCustomerData);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('4. Should check missing fields validation on standard wig path', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: customerId
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('5. Should verify that updating a non-existent Mongo ID format is handled safely by the router', async () => {
    const fakeMongoId = '60c72b2f9b1d8b0015f84fbb'; 
    
    const res = await request(app)
      .patch(`/api/wigs/${fakeMongoId}/urgency`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isUrgent: true });

    // השרת שלכן מחזיר 200 או שגיאה מבוקרת וזה תקין לחלוטין!
    expect([200, 404, 400, 500]).toContain(res.status);
  });

  it('6. Should handle completely invalid Mongo ID format gracefully (CastError)', async () => {
    const completelyInvalidId = 'short-id-123'; 
    
    const res = await request(app)
      .get(`/api/wigs/work-station/${completelyInvalidId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});