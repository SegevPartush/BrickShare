const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserPosts } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProfileValidator } = require('../validators/user.validators');

router.get('/:id', getUserProfile);
router.put('/:id', authMiddleware, upload.single('profileImage'), updateProfileValidator, validate, updateUserProfile);
router.get('/:id/posts', getUserPosts);

module.exports = router;
