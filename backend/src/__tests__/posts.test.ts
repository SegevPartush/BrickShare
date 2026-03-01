import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';
import Post from '../models/post.model';

const testDb = 'mongodb://localhost:27017/brickshare-test';

beforeAll(async () => {
  await mongoose.connect(testDb);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});
});

describe('Posts', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: '123456'
      });
    token = reg.body.accessToken;
    userId = reg.body.user.id;
  });

  test('get all posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('posts');
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  test('create post with auth', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'My LEGO post' });

    expect(res.status).toBe(201);
    expect(res.body.post).toHaveProperty('text', 'My LEGO post');
  });

  test('reject create post without auth', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ text: 'My LEGO post' });

    expect(res.status).toBe(401);
  });
});
