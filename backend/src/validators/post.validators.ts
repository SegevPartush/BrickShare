import { body } from 'express-validator';

function optionalFocal(field: 'imageFocalX' | 'imageFocalY') {
  return body(field)
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(`${field} must be between 0 and 100`);
}

export const createPostValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 5000 })
    .withMessage('Text must be at most 5000 characters'),
  optionalFocal('imageFocalX'),
  optionalFocal('imageFocalY')
];

export const updatePostValidator = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Text must be at most 5000 characters'),
  optionalFocal('imageFocalX'),
  optionalFocal('imageFocalY')
];
