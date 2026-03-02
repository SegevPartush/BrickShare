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

  test('get all posts with pagination', async () => {
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Post 1' });

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Post 2' });

    const res = await request(app)
      .get('/api/posts?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(2);
    expect(res.body.totalPosts).toBe(2);
  });

  test('update post', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Original' });

    const postId = createRes.body.post._id;

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.post.text).toBe('Updated');
  });

  test('delete post', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'To delete' });

    const postId = createRes.body.post._id;

    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('like and unlike post', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Test post' });

    const postId = createRes.body.post._id;

    const likeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.liked).toBe(true);

    const unlikeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(unlikeRes.status).toBe(200);
    expect(unlikeRes.body.liked).toBe(false);
  });
});
