import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';
import Post from '../models/post.model';

const TEST_DB = 'mongodb://localhost:27017/brickshare-test';

// התחברות לDB לפני כל הבדיקות
beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

// ניתוק מה-DB אחרי שכל הבדיקות מסתיימות
afterAll(async () => {
  await mongoose.connection.close();
});

// מנקים פוסטים ומשתמשים לפני כל בדיקה
beforeEach(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});
});

// בדיקות למערכת הפוסטים - יצירה, עריכה, מחיקה ולייקים
describe('Posts Tests', () => {

  let authToken: string;
  let userId: string;

  // יוצרים משתמש ומתחברים לפני כל בדיקה
  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'gal_cohen',
        email: 'gal.cohen@gmail.com',
        password: 'Lego1234'
      });

    authToken = response.body.accessToken;
    userId = response.body.user.id;
  });

  describe('GET /api/posts', () => {

    // בדיקה שאפשר לקבל רשימת פוסטים בלי להיות מחובר
    test('should return posts list without authentication', async () => {
      const response = await request(app).get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    // בדיקה שהעימוד עובד - מחזיר מידע על עמודים
    test('should support pagination with page and limit params', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'סיימתי לבנות את ה-Technic Bugatti 🏎️' });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'מחפש חלקי Star Wars - מי יש?' });

      const response = await request(app).get('/api/posts?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalPosts', 2);
      expect(response.body.posts.length).toBe(2);
    });
  });

  describe('POST /api/posts', () => {

    // בדיקה שיצירת פוסט עובדת כשהמשתמש מחובר
    test('should create a new post when authenticated', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'סיימתי לבנות את ה-Millennium Falcon! 7541 חלקים ו-18 שעות בניה 🚀'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('post');
      expect(response.body.post).toHaveProperty('_id');
      expect(response.body.post.text).toContain('Millennium Falcon');
    });

    // בדיקה שלא ניתן ליצור פוסט בלי להיות מחובר
    test('should reject post creation without authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ text: 'פוסט ללא אימות' });

      expect(response.status).toBe(401);
    });

    // בדיקה שלא ניתן ליצור פוסט ריק
    test('should reject post with empty text', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/posts/:id', () => {

    let postId: string;

    // יוצרים פוסט לפני בדיקות העריכה
    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'הטקסט המקורי של הפוסט' });

      postId = createResponse.body.post._id;
    });

    // בדיקה שאפשר לערוך פוסט שיצרת
    test('should update own post successfully', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'הטקסט המעודכן - הוספתי פרטים על הבניה' });

      expect(response.status).toBe(200);
      expect(response.body.post.text).toBe('הטקסט המעודכן - הוספתי פרטים על הבניה');
    });

    // בדיקה שלא ניתן לערוך פוסט של משתמש אחר
    test('should reject editing another user\'s post', async () => {
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'maya_peretz',
          email: 'maya.peretz@gmail.com',
          password: 'Lego1234'
        });

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({ text: 'מנסה לערוך פוסט של מישהו אחר' });

      expect(response.status).toBe(403);
    });

    // בדיקה שלא ניתן לערוך פוסט בלי להיות מחובר
    test('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ text: 'עריכה ללא אימות' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/posts/:id', () => {

    // בדיקה שאפשר למחוק פוסט שיצרת
    test('should delete own post successfully', async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'פוסט שאמחק מיד' });

      const postId = createResponse.body.post._id;

      const deleteResponse = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // מוודאים שהפוסט אכן נמחק מהרשימה
      const listResponse = await request(app).get('/api/posts');
      const found = listResponse.body.posts.find((p: any) => p._id === postId);
      expect(found).toBeUndefined();
    });

    // בדיקה שלא ניתן למחוק פוסט בלי להיות מחובר
    test('should reject deletion without authentication', async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'פוסט לבדיקת מחיקה' });

      const postId = createResponse.body.post._id;

      const response = await request(app).delete(`/api/posts/${postId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/posts/:id/like', () => {

    let postId: string;

    // יוצרים פוסט לפני בדיקות הלייק
    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'בניה חדשה - מי אוהב? 🧱' });

      postId = createResponse.body.post._id;
    });

    // בדיקה שאפשר לתת לייק לפוסט
    test('should like a post and return liked: true', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked', true);
      // הלייקים מוחזרים כאובייקטים (אחרי populate) - בודקים לפי _id
      expect(response.body.post.likes.some((like: any) => like._id === userId || like === userId)).toBe(true);
    });

    // בדיקה שלחיצה שנייה מבטלת את הלייק
    test('should unlike a post when liking again (toggle)', async () => {
      // לייק ראשון
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // לייק שני - אמור לבטל
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('liked', false);
      // מוודאים שה-ID לא קיים יותר בלייקים
      expect(response.body.post.likes.some((like: any) => like._id === userId || like === userId)).toBe(false);
    });

    // בדיקה שלא ניתן לתת לייק בלי להיות מחובר
    test('should reject like without authentication', async () => {
      const response = await request(app).post(`/api/posts/${postId}/like`);

      expect(response.status).toBe(401);
    });
  });
});
