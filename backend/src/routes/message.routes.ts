import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import {
  sendMessage,
  getConversations,
  getThread,
  getUnreadCount
} from '../controllers/message.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Direct messages between users
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a direct message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient, text]
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: User id of the recipient
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message created
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, sendMessage);

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all conversations of the current user (latest message + unread count per peer)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', authMiddleware, getConversations);

/**
 * @swagger
 * /api/messages/unread/count:
 *   get:
 *     summary: Get total number of unread messages for the current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread messages count
 */
router.get('/unread/count', authMiddleware, getUnreadCount);

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Get the full message thread with another user (also marks incoming as read)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages between current user and userId
 */
router.get('/:userId', authMiddleware, getThread);

export default router;
