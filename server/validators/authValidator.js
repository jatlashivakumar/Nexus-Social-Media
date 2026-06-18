import { z } from 'zod';
import AppError from '../utils/AppError.js';

const schemas = {
  register: z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/,'Username: letters, numbers, underscores only'),
    email:    z.string().email('Invalid email'),
    password: z.string().min(8).regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need number'),
    name:     z.string().max(50).optional(),
  }),
  login: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
  forgotPassword: z.object({ email: z.string().email() }),
  resetPassword:  z.object({
    password: z.string().min(8).regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need number'),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(8).regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need number'),
  }),
};

export const validate = (name) => (req, res, next) => {
  const result = schemas[name]?.safeParse(req.body);
  if (!result) return next();
  if (!result.success)
    return next(new AppError(result.error.errors.map((e) => e.message).join('. '), 422));
  req.body = result.data;
  next();
};
