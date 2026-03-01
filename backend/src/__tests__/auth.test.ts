import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';

const testDb = 'mongodb://localhost:27017/brickshare-test';

beforeAll(async () => {
  await mongoose.connect(testDb);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth', () => {
  test('register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test',
        email: 'test@test.com',
        password: '123456'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('login user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test',
        email: 'test@test.com',
        password: '123456'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: '123456'
      });

    expect(res.status).toBe(200);
  });

  test('reject wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test',
        email: 'test@test.com',
        password: '123456'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'wrong'
      });

    expect(res.status).toBe(401);
  });
});
