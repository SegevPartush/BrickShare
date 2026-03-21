declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: import('../models/user.model').IUser;
    }
  }
}

export {};
