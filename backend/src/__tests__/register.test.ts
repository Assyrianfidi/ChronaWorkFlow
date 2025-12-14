import request from 'supertest';
import app from '../app';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('user');
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'short',
      });
    expect(response.statusCode).toBe(400);
  });
});
