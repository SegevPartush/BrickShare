const express = require('express');
const router = express.Router();
const { getAllPosts, getPostById, createPost, updatePost, deletePost, toggleLike } = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/', authMiddleware, createPost);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, toggleLike);

module.exports = router;
