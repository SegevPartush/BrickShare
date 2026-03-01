const express = require('express');
const router = express.Router();
const { register, login, refresh, getMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { registerValidator, loginValidator, refreshValidator } = require('../validators/auth.validators');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh', refreshValidator, validate, refresh);
router.get('/me', authMiddleware, getMe);

module.exports = router;
