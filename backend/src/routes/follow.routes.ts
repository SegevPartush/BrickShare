import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { getFollowers, getFollowing, toggleFollow } from '../controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /api/follow/{id}:
 *   post:
 *     summary: Toggle follow a user
 *     tags: [Users]
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
 *         description: Follow state toggled
 */
router.post('/:id', authMiddleware, toggleFollow);

export default router;

