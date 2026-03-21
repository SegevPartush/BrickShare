import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/user.model';

const TEST_DB = 'mongodb://localhost:27017/brickshare-test';

// התחברות לDB לפני כל הבדיקות
beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

// ניתוק מה-DB אחרי שכל הבדיקות מסתיימות
afterAll(async () => {
  await mongoose.connection.close();
});

// מנקים את המשתמשים לפני כל בדיקה כדי שלא יהיו התנגשויות
beforeEach(async () => {
  await User.deleteMany({});
});

// בדיקות למערכת אימות - הרשמה והתחברות
describe('Authentication Tests', () => {

  describe('POST /api/auth/register', () => {

    // בדיקה שהרשמה עובדת עם נתונים תקינים
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'yossi_cohen',
          email: 'yossicohen@gmail.com',
          password: 'Lego1234'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('username', 'yossi_cohen');
      expect(response.body.user).toHaveProperty('email', 'yossicohen@gmail.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    // בדיקה שלא ניתן להירשם עם מייל לא תקין
    test('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'dani_levi',
          email: 'not-a-valid-email',
          password: 'Lego1234'
        });

      expect(response.status).toBe(400);
    });

    // בדיקה שלא ניתן להירשם עם סיסמה קצרה מ-6 תווים
    test('should reject registration with password shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'sarah_levi',
          email: 'sarah.levi@gmail.com',
          password: '123'
        });

      expect(response.status).toBe(400);
    });

    // בדיקה שלא ניתן להירשם עם שם משתמש חסר
    test('should reject registration with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'moshe.katz@gmail.com',
          password: 'Lego1234'
        });

      expect(response.status).toBe(400);
    });

    // בדיקה שלא ניתן להירשם עם מייל שכבר קיים במערכת
    test('should reject registration with an already existing email', async () => {
      // הרשמה ראשונה - אמורה להצליח
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'rina_shapiro',
          email: 'rina.shapiro@gmail.com',
          password: 'Lego1234'
        });

      // הרשמה שנייה עם אותו מייל - אמורה להיכשל
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'rina_other',
          email: 'rina.shapiro@gmail.com',
          password: 'Other1234'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {

    // יוצרים משתמש לפני כל בדיקות ההתחברות
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'noam_mizrahi',
          email: 'noammizrahi@gmail.com',
          password: 'Lego1234'
        });
    });

    // בדיקה שהתחברות עובדת עם נתונים נכונים
    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noammizrahi@gmail.com',
          password: 'Lego1234'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('noammizrahi@gmail.com');
    });

    // בדיקה שלא ניתן להתחבר עם סיסמה שגויה
    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noam.mizrahi@gmail.com',
          password: 'WrongPass99'
        });

      expect(response.status).toBe(401);
    });

    // בדיקה שלא ניתן להתחבר עם מייל שלא קיים
    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@gmail.com',
          password: 'Lego1234'
        });

      expect(response.status).toBe(401);
    });

    // בדיקה שלא ניתן להתחבר עם מייל לא תקין
    test('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Lego1234'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {

    // בדיקה שניתן לקבל את פרטי המשתמש המחובר עם טוקן תקין
    test('should return current user details with valid token', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'tal_peretz',
          email: 'talperetz@gmail.com',
          password: 'Lego1234'
        });

      const { accessToken } = registerResponse.body;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('talperetz@gmail.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    // בדיקה שלא ניתן לקבל פרטי משתמש בלי טוקן
    test('should reject request without authorization token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
