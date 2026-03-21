import '../types/express-augment';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void | Response => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
