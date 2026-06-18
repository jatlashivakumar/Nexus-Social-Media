import crypto from 'crypto';
import User from '../models/User.js';
import { sendTokenResponse, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteCache } from '../config/redis.js';
import logger from '../utils/logger.js';

export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password, name } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    return next(new AppError(`This ${field} is already in use.`, 409));
  }
  const user = await User.create({ username, email, password, name });
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  try { await sendEmail({ to: user.email, template: 'verifyEmail', data: [user.name || user.username, verifyUrl] }); }
  catch (e) { logger.error('Verification email failed:', e.message); }
  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Provide email and password.', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return next(new AppError('Invalid email or password.', 401));
  if (!user.isActive) return next(new AppError('Account deactivated.', 403));
  const refreshToken = generateRefreshToken(user._id);
  const expiresAt = new Date(Date.now() + (+process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000);
  user.cleanExpiredTokens();
  user.refreshTokens.push({
    token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt, userAgent: req.headers['user-agent']?.slice(0, 200), ip: req.ip,
  });
  user.lastSeen = Date.now();
  user.onlineStatus = 'online';
  await user.save({ validateBeforeSave: false });
  sendTokenResponse(user, 200, res);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: hashed } },
      onlineStatus: 'offline', lastSeen: Date.now(),
    });
  }
  await deleteCache(`user:${req.user._id}`);
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out.' });
});

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.cookies;
  if (!token) return next(new AppError('No refresh token.', 401));
  const decoded = verifyRefreshToken(token);
  const hashed  = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.token': hashed,
    'refreshTokens.expiresAt': { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Invalid or expired refresh token.', 401));
  res.status(200).json({ success: true, accessToken: generateAccessToken(user._id) });
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerificationToken: hashed, emailVerificationExpire: { $gt: Date.now() } });
  if (!user) return next(new AppError('Token invalid or expired.', 400));
  user.isVerified = true;
  user.emailVerificationToken  = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: 'Email verified.' });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(200).json({ success: true, message: 'If that email is registered, a reset link was sent.' });
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  try {
    await sendEmail({ to: user.email, template: 'resetPassword', data: [user.name || user.username, `${process.env.CLIENT_URL}/reset-password/${resetToken}`] });
    res.status(200).json({ success: true, message: 'If that email is registered, a reset link was sent.' });
  } catch {
    user.passwordResetToken = undefined; user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    next(new AppError('Error sending email.', 500));
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpire: { $gt: Date.now() } });
  if (!user) return next(new AppError('Token invalid or expired.', 400));
  user.password = req.body.password;
  user.passwordResetToken = user.passwordResetExpire = undefined;
  user.refreshTokens = [];
  await user.save();
  await deleteCache(`user:${user._id}`);
  sendTokenResponse(user, 200, res);
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword)))
    return next(new AppError('Current password incorrect.', 401));
  user.password = req.body.newPassword;
  user.refreshTokens = [];
  await user.save();
  await deleteCache(`user:${user._id}`);
  sendTokenResponse(user, 200, res);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user.toPublicJSON() });
});

// ── Google OAuth callback ────────────────────────────────────────
// Passport already attached the authenticated user to req.user
// (via the Google strategy in config/passport.js). We just issue
// our own JWT tokens and redirect back to the frontend.
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  const refreshToken = generateRefreshToken(user._id);
  const expiresAt = new Date(Date.now() + (+process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000);

  user.cleanExpiredTokens();
  user.refreshTokens.push({
    token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt,
    userAgent: req.headers['user-agent']?.slice(0, 200),
    ip: req.ip,
  });
  user.lastSeen = Date.now();
  user.onlineStatus = 'online';
  await user.save({ validateBeforeSave: false });

  const accessToken = generateAccessToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: (+process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000,
  });

  // Pass the access token to the frontend via URL — frontend immediately
  // stores it in localStorage then redirects to home. Token is short-lived (15m)
  // so this brief exposure in the URL is low-risk, and it's removed by the
  // frontend right away.
  res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${accessToken}`);
});
