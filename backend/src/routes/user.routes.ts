import { Router } from 'express';
import { getUserProfile, updateUserProfile, getUserPosts } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import validate from '../middleware/validate.middleware';
import { updateProfileValidator } from '../validators/user.validators';

const router = Router();

router.get('/:id', getUserProfile);
router.put('/:id', authMiddleware, upload.single('profileImage'), updateProfileValidator, validate, updateUserProfile);
router.get('/:id/posts', getUserPosts);

export default router;
