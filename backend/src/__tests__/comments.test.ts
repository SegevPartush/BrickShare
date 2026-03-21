import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';

const TEST_DB = 'mongodb://localhost:27017/brickshare-test';

// התחברות לDB לפני כל הבדיקות
beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

// ניתוק מה-DB אחרי שכל הבדיקות מסתיימות
afterAll(async () => {
  await mongoose.connection.close();
});

// מנקים את כל הנתונים לפני כל בדיקה
beforeEach(async () => {
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});
});

// בדיקות למערכת התגובות - הוספה, עריכה, מחיקה וקריאה
describe('Comments Tests', () => {

  let authToken: string;
  let postId: string;

  // יוצרים משתמש ופוסט לפני כל בדיקה
  beforeEach(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'omer_golan',
        email: 'omergolan@gmail.com',
        password: 'Lego1234'
      });

    authToken = registerResponse.body.accessToken;

    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'MOC חדש של תחנת חלל - הגעתי ל-3200 חלקים! 🚀' });

    postId = postResponse.body.post._id;
  });

  describe('POST /api/comments/posts/:postId/comments', () => {

    // בדיקה שאפשר להוסיף תגובה לפוסט כשמחובר
    test('should add a comment to a post successfully', async () => {
      const response = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'וואו איזה בניה מרשימה! כמה זמן לקח לך?' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment.text).toBe('וואו איזה בניה מרשימה! כמה זמן לקח לך?');
      expect(response.body.comment).toHaveProperty('author');
    });

    // בדיקה שלא ניתן להוסיף תגובה בלי להיות מחובר
    test('should reject comment without authentication', async () => {
      const response = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .send({ text: 'תגובה ללא אימות' });

      expect(response.status).toBe(401);
    });

    // בדיקה שלא ניתן להוסיף תגובה ריקה
    test('should reject empty comment text', async () => {
      const response = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '' });

      expect(response.status).toBe(400);
    });

    // בדיקה שלא ניתן לתגב על פוסט שלא קיים
    test('should return 404 for comment on non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .post(`/api/comments/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה על פוסט שלא קיים' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/comments/posts/:postId/comments', () => {

    // בדיקה שאפשר לקבל את התגובות של פוסט בלי להיות מחובר
    test('should return all comments for a post without authentication', async () => {
      await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה ראשונה - נראה מדהים!' });

      await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה שנייה - איפה קנית את החלקים?' });

      const response = await request(app).get(`/api/comments/posts/${postId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBe(2);
    });

    // בדיקה שפוסט ללא תגובות מחזיר מערך ריק
    test('should return empty array when post has no comments', async () => {
      const response = await request(app).get(`/api/comments/posts/${postId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(0);
    });
  });

  describe('PUT /api/comments/:id', () => {

    let commentId: string;

    // יוצרים תגובה לפני בדיקות העריכה
    beforeEach(async () => {
      const commentResponse = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'הטקסט המקורי של התגובה' });

      commentId = commentResponse.body.comment._id;
    });

    // בדיקה שאפשר לערוך תגובה שכתבת
    test('should update own comment successfully', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'הטקסט המעודכן - הוספתי פרטים' });

      expect(response.status).toBe(200);
      expect(response.body.comment.text).toBe('הטקסט המעודכן - הוספתי פרטים');
    });

    // בדיקה שלא ניתן לערוך תגובה של משתמש אחר
    test('should reject editing another user\'s comment', async () => {
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'hila_bar',
          email: 'hilabar@gmail.com',
          password: 'Lego1234'
        });

      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({ text: 'מנסה לערוך תגובה של מישהו אחר' });

      expect(response.status).toBe(403);
    });

    // בדיקה שלא ניתן לערוך תגובה בלי להיות מחובר
    test('should reject comment update without authentication', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .send({ text: 'עריכה ללא אימות' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/comments/:id', () => {

    // בדיקה שאפשר למחוק תגובה שכתבת
    test('should delete own comment successfully', async () => {
      const createResponse = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה שאמחק עכשיו' });

      const commentId = createResponse.body.comment._id;

      const deleteResponse = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // מוודאים שהתגובה נמחקה
      const listResponse = await request(app).get(`/api/comments/posts/${postId}/comments`);
      const found = listResponse.body.comments.find((c: any) => c._id === commentId);
      expect(found).toBeUndefined();
    });

    // בדיקה שלא ניתן למחוק תגובה של משתמש אחר
    test('should reject deleting another user\'s comment', async () => {
      const createResponse = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה שניסו למחוק ממני' });

      const commentId = createResponse.body.comment._id;

      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shir_ofer',
          email: 'shirofer@gmail.com',
          password: 'Lego1234'
        });

      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`);

      expect(response.status).toBe(403);
    });

    // בדיקה שלא ניתן למחוק תגובה בלי להיות מחובר
    test('should reject deletion without authentication', async () => {
      const createResponse = await request(app)
        .post(`/api/comments/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'תגובה לבדיקת מחיקה' });

      const commentId = createResponse.body.comment._id;

      const response = await request(app).delete(`/api/comments/${commentId}`);

      expect(response.status).toBe(401);
    });
  });
});
