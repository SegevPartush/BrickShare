import { Router } from 'express';
import { getFollowers, getFollowing, getUserProfile, updateUserProfile, getUserPosts, getSuggestedUsers } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import validate from '../middleware/validate.middleware';
import { updateProfileValidator } from '../validators/user.validators';

const router = Router();

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
router.put('/:id', authMiddleware, upload.single('profileImage'), updateProfileValidator, validate, updateUserProfile);

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
router.get('/:id/followers', authMiddleware, getFollowers);
router.get('/:id/following', authMiddleware, getFollowing);

export default router;
