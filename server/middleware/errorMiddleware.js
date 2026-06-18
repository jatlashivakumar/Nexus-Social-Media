import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

export const notFound = (req, res, next) =>
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({ success: false, status: err.status, message: err.message, stack: err.stack });
  }

  let e = { ...err, message: err.message };
  if (err.name === 'CastError')        e = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  if (err.code  === 11000)             { const f = Object.keys(err.keyValue)[0]; e = new AppError(`${f} already taken.`, 409); }
  if (err.name === 'ValidationError')  e = new AppError(Object.values(err.errors).map((v) => v.message).join('. '), 422);
  if (err.name === 'JsonWebTokenError')e = new AppError('Invalid token. Please log in again.', 401);
  if (err.name === 'TokenExpiredError')e = new AppError('Token expired. Please log in again.', 401);

  if (e.isOperational) {
    return res.status(e.statusCode).json({ success: false, status: e.status, message: e.message });
  }

  logger.error('Unexpected error:', err);
  res.status(500).json({ success: false, status: 'error', message: 'Something went wrong.' });
};
