import { verifyAccessToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getCache, setCache } from '../config/redis.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];
  else if (req.cookies?.accessToken)
    token = req.cookies.accessToken;

  if (!token) return next(new AppError('Not authenticated. Please log in.', 401));

  const decoded = verifyAccessToken(token);

  const cacheKey = `user:${decoded.id}`;
  let user = await getCache(cacheKey);

  if (!user) {
    user = await User.findById(decoded.id)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    if (!user) return next(new AppError('User no longer exists.', 401));
    await setCache(cacheKey, user, 300);
  }

  if (!user.isActive) return next(new AppError('Account deactivated.', 401));
  if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat))
    return next(new AppError('Password recently changed. Please log in again.', 401));

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (user?.isActive) req.user = user;
  } catch { /* silent */ }
  next();
});

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError('You do not have permission to do this.', 403));
  next();
};
