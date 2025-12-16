const request = require('supertest');
const { app } = require('../app');

describe('Auth API', () => {
  it('should register a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'test', email: 'test@test.com', password: '123456' });
    expect(res.status).toBe(201);
  });
});