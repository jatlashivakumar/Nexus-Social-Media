import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSubscription,
  upgradePlan,
} from '../controllers/paymentController.js';

const router = Router();

router.use(protect);

router.get('/subscription', getSubscription);
router.post('/upgrade', upgradePlan);

export default router;