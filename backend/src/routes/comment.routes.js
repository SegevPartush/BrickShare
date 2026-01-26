const express = require('express');
const router = express.Router();
const { getPostComments, createComment, updateComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/posts/:id/comments', getPostComments);
router.post('/posts/:id/comments', authMiddleware, createComment);
router.put('/:id', authMiddleware, updateComment);
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
