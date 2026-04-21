import { Router } from 'express';
import { getFollowers, getFollowing, getUserProfile, updateUserProfile, getUserPosts, getSuggestedUsers } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import validate from '../middleware/validate.middleware';
import { updateProfileValidator } from '../validators/user.validators';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of suggested users
 */
router.get('/', getSuggestedUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:id', getUserProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:id', authMiddleware, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateProfileValidator, validate, updateUserProfile);

/**
 * @swagger
 * /api/users/{id}/posts:
 *   get:
 *     summary: Get user posts
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user posts
 */
router.get('/:id/posts', getUserPosts);

/**
 * @swagger
 * /api/users/{id}/followers:
 *   get:
 *     summary: Get user followers
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
 *         description: List of followers
 *       404:
 *         description: User not found
 */
router.get('/:id/followers', authMiddleware, getFollowers);

/**
 * @swagger
 * /api/users/{id}/following:
 *   get:
 *     summary: Get users this user follows
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
 *         description: List of followed users
 *       404:
 *         description: User not found
 */
router.get('/:id/following', authMiddleware, getFollowing);

export default router;
