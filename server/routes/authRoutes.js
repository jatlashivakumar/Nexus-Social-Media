import { Router } from 'express';
import passport from 'passport';
import {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, changePassword, getMe, googleCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../validators/authValidator.js';

const router = Router();

router.post('/register',        validate('register'),        register);
router.post('/login',           validate('login'),           login);
router.post('/logout',          protect,                     logout);
router.post('/refresh-token',                                refreshToken);
router.get( '/verify-email/:token',                          verifyEmail);
router.post('/forgot-password', validate('forgotPassword'),  forgotPassword);
router.patch('/reset-password/:token', validate('resetPassword'), resetPassword);
router.patch('/change-password', protect, validate('changePassword'), changePassword);
router.get( '/me',              protect,                     getMe);

// ── Google OAuth ──────────────────────────────────────────────
// Step 1: frontend redirects browser here → we redirect to Google's consent screen
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Step 2: Google redirects back here after user approves → passport verifies, attaches req.user
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

export default router;
