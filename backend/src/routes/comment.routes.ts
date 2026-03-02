import { Router } from 'express';
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller';
import authMiddleware from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { createCommentValidator, updateCommentValidator } from '../validators/comment.validators';

const router = Router();

/**
 * @swagger
 * /api/comments/posts/{id}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/posts/:id/comments', getPostComments);

/**
 * @swagger
 * /api/comments/posts/{id}/comments:
 *   post:
 *     summary: Add comment to post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *       401:
 *         description: Not authenticated
 */
router.post('/posts/:id/comments', authMiddleware, createCommentValidator, validate, createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *       403:
 *         description: Not comment author
 */
router.put('/:id', authMiddleware, updateCommentValidator, validate, updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Not comment author
 */
router.delete('/:id', authMiddleware, deleteComment);

export default router;
