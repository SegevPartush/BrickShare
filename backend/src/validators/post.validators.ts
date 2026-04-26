import { body } from 'express-validator';

function optionalFocal(field: 'imageFocalX' | 'imageFocalY') {
  return body(field)
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(`${field} must be between 0 and 100`);
}

export const createPostValidator = [
  body('text')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 5000 })
    .withMessage('Text must be at most 5000 characters'),
optionalFocal('imageFocalX'),
optionalFocal('imageFocalY'),
body().custom((_value, { req }) => {
  const raw = req.body?.text;
  const t = raw !== undefined && raw !== null ? String(raw).trim() : '';
  const hasFile = Boolean((req as { file?: unknown }).file);

  if (t.length === 0 && !hasFile) {
    throw new Error('Text or image is required');
  }

  return true;
})
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
