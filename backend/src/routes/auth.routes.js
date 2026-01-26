const express = require('express');
const router = express.Router();
const { register, login, refresh, getMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getMe);

module.exports = router;
