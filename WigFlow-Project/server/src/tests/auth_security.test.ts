import { describe, it, expect, jest } from '@jest/globals';

// חסימת הוואטסאפ האמיתי כולל האזנה לאירועים (פותר את ה-whatsappClient.on)
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockImplementation(() => Promise.resolve()),
    sendMessage: jest.fn().mockImplementation(() => Promise.resolve({ id: 'mock_123' })),
    on: jest.fn() // הוספנו את פונקציית האירועים כדי למנוע קריסה!
  })),
  LocalAuth: jest.fn().mockImplementation(() => ({}))
}), { virtual: true });

import request from 'supertest';
import app from '../app'; 

describe('Auth & Security API Tests', () => {
  
  it('Should reject GET request to protected routes if no token is provided', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
  });

  it('Should reject POST request to create a wig with an invalid token format', async () => {
    const res = await request(app)
      .post('/api/wigs/new')
      .set('Authorization', 'Bearer fake_invalid_token_12345')
      .send({ customerName: 'חני טסט אבטחה' });

    expect(res.status).toBe(401);
  });
});