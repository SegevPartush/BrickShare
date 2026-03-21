require('dotenv').config();
import './types/express-augment';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';

import './config/passport';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import followRoutes from './routes/follow.routes';
import aiRoutes from './routes/ai.routes';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// מסיר X-Powered-By ומוסיף headers אבטחה סטנדרטיים
app.use(helmet({ contentSecurityPolicy: false }));

// CORS רק מהפרונט שלנו
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// הגבלת גודל body למניעת payload attacks
app.use(express.json({ limit: '2mb' }));
app.use(passport.initialize());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/ai', aiRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => console.log('Error:', err));
}

export default app;
