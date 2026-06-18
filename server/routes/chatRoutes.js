import { Router } from 'express';
import { getOrCreateConversation, getConversations, getMessages, sendMessage, deleteMessage, createGroupChat } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleUpload, uploadChatMedia } from '../middleware/uploadMiddleware.js';

const router = Router();
router.use(protect);
router.get('/',                      getConversations);
router.post('/dm/:userId',           getOrCreateConversation);
router.post('/group',                createGroupChat);
router.get('/:conversationId/messages',  getMessages);
router.post('/:conversationId/messages', handleUpload(uploadChatMedia), sendMessage);
router.delete('/messages/:messageId',    deleteMessage);
export default router;
