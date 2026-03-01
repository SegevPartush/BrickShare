const { body } = require('express-validator');

const createCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 1000 })
    .withMessage('Text must be at most 1000 characters')
];

const updateCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required')
    .isLength({ max: 1000 })
    .withMessage('Text must be at most 1000 characters')
];

module.exports = {
  createCommentValidator,
  updateCommentValidator
};
