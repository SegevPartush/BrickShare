import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { askAssistant, estimatePrice, searchSets } from '../controllers/ai.controller';

const router = Router();

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask the LEGO AI assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "מה הסט הכי חדש של Star Wars?"
 *     responses:
 *       200:
 *         description: AI response text
 *       400:
 *         description: Missing message
 *       401:
 *         description: Unauthorized
 */
router.post('/ask', authMiddleware, askAssistant);

/**
 * @swagger
 * /api/ai/estimate-price:
 *   post:
 *     summary: Estimate the market price of a LEGO set
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [setName]
 *             properties:
 *               setName:
 *                 type: string
 *                 example: "Millennium Falcon UCS 75192"
 *               condition:
 *                 type: string
 *                 enum: [new, used, sealed]
 *                 example: "used"
 *     responses:
 *       200:
 *         description: Price estimate
 *       400:
 *         description: Missing set name
 */
router.post('/estimate-price', authMiddleware, estimatePrice);

/**
 * @swagger
 * /api/ai/search-sets:
 *   post:
 *     summary: Find LEGO sets matching specific criteria
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [criteria]
 *             properties:
 *               criteria:
 *                 type: string
 *                 example: "סטים של Star Wars עד 200 דולר"
 *     responses:
 *       200:
 *         description: Set recommendations
 *       400:
 *         description: Missing criteria
 */
router.post('/search-sets', authMiddleware, searchSets);

export default router;
