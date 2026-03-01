import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';

const testDb = 'mongodb://localhost:27017/brickshare-test';

beforeAll(async () => {
  await mongoose.connect(testDb);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
});

describe('Comments', () => {
  let token: string;
  let postId: string;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'test',
        email: 'test@test.com',
        password: '123456'
      });

    token = userRes.body.accessToken;

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Test post' });

    postId = postRes.body.post._id;
  });

  test('create comment', async () => {
    const res = await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body.comment.text).toBe('Great post!');
  });

  test('get comments for post', async () => {
    await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Comment 1' });

    await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Comment 2' });

    const res = await request(app)
      .get(`/api/comments/posts/${postId}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBe(2);
  });

  test('update comment', async () => {
    const createRes = await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Original' });

    const commentId = createRes.body.comment._id;

    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.comment.text).toBe('Updated');
  });

  test('delete comment', async () => {
    const createRes = await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'To delete' });

    const commentId = createRes.body.comment._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('cannot delete other user comment', async () => {
    const createRes = await request(app)
      .post(`/api/comments/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Test' });

    const commentId = createRes.body.comment._id;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user2',
        email: 'user2@test.com',
        password: '123456'
      });

    const token2 = user2Res.body.accessToken;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(403);
  });
});
