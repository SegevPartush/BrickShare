const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserPosts } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/:id', getUserProfile);
router.put('/:id', authMiddleware, updateUserProfile);
router.get('/:id/posts', getUserPosts);

module.exports = router;
