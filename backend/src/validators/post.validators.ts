import { body } from 'express-validator';

export const createPostValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 5000 })
    .withMessage('Text must be at most 5000 characters')
];

export const updatePostValidator = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Text must be at most 5000 characters')
];
