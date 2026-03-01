const { body } = require('express-validator');

const updateProfileValidator = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2 and 30 characters')
];

module.exports = {
  updateProfileValidator
};
