import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken  = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRE        || '15m' });

export const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'  });

export const verifyAccessToken  = (t) => jwt.verify(t, process.env.JWT_SECRET);
export const verifyRefreshToken = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);

export const sendTokenResponse = (user, statusCode, res) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  const days = parseInt(process.env.JWT_COOKIE_EXPIRE || 7);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   days * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toPublicJSON ? user.toPublicJSON() : user,
  });
};

export const generateSecureToken = () => crypto.randomBytes(32).toString('hex');
