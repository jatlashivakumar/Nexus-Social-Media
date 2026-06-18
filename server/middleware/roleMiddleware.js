import AppError from '../utils/AppError.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Not authenticated.', 401));
  if (!roles.includes(req.user.role))
    return next(new AppError(`Requires role: ${roles.join(' or ')}.`, 403));
  next();
};

export const requireVerified = (req, res, next) => {
  if (!req.user?.isVerified)
    return next(new AppError('Please verify your email first.', 403));
  next();
};
