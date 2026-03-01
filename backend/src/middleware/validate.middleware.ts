import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err: { path?: string; msg: string }) => ({
        field: err.path ?? 'unknown',
        message: err.msg
      }))
    });
  }

  next();
};

export default validate;
