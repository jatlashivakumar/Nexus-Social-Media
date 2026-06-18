import { Router } from 'express';
import { getUserProfile, updateProfile, toggleFollow, getFollowers, getFollowing, searchUsers, getSuggestedUsers, toggleBlock, deactivateAccount } from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { handleUpload, uploadProfileImages } from '../middleware/uploadMiddleware.js';

const router = Router();
router.get('/search',    optionalAuth, searchUsers);
router.get('/suggested', protect,      getSuggestedUsers);
router.get('/:username',           optionalAuth, getUserProfile);
router.get('/:username/followers', optionalAuth, getFollowers);
router.get('/:username/following', optionalAuth, getFollowing);
router.use(protect);
// Use uploadProfileImages so both avatar AND coverImage can be uploaded together
router.patch('/me/profile',  handleUpload(uploadProfileImages), updateProfile);
router.post('/:id/follow',   toggleFollow);
router.post('/:id/block',    toggleBlock);
router.delete('/me/deactivate', deactivateAccount);
export default router;
