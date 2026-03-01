const express = require('express');
const router = express.Router();
const { getAllPosts, getPostById, createPost, updatePost, deletePost, toggleLike } = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');
const { createPostValidator, updatePostValidator } = require('../validators/post.validators');

router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/', authMiddleware, upload.single('image'), createPostValidator, validate, createPost);
router.put('/:id', authMiddleware, upload.single('image'), updatePostValidator, validate, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, toggleLike);

module.exports = router;
