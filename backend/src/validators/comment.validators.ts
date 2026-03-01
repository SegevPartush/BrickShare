import { body } from 'express-validator';

export const createCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 1000 })
    .withMessage('Text must be at most 1000 characters')
];

export const updateCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 1000 })
    .withMessage('Text must be at most 1000 characters')
];
