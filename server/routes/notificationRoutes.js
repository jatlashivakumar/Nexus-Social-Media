import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification, getUnreadCount } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/',               getNotifications);
router.get('/unread-count',   getUnreadCount);
router.patch('/read',         markAsRead);
router.delete('/:id',         deleteNotification);
export default router;
