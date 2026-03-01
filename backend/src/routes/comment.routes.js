const express = require('express');
const router = express.Router();
const { getPostComments, createComment, updateComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createCommentValidator, updateCommentValidator } = require('../validators/comment.validators');

router.get('/posts/:id/comments', getPostComments);
router.post('/posts/:id/comments', authMiddleware, createCommentValidator, validate, createComment);
router.put('/:id', authMiddleware, updateCommentValidator, validate, updateComment);
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
