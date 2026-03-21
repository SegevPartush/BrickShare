import { Router } from 'express';
import { getFollowers, getFollowing, getUserProfile, updateUserProfile, getUserPosts, getSuggestedUsers } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';
import validate from '../middleware/validate.middleware';
import { updateProfileValidator } from '../validators/user.validators';

const router = Router();

router.get('/', getSuggestedUsers);
router.get('/:id', getUserProfile);
router.put('/:id', authMiddleware, upload.single('profileImage'), updateProfileValidator, validate, updateUserProfile);
router.get('/:id/posts', getUserPosts);
router.get('/:id/followers', authMiddleware, getFollowers);
router.get('/:id/following', authMiddleware, getFollowing);

export default router;
