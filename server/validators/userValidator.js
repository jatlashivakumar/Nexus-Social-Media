import { z } from 'zod';
import AppError from '../utils/AppError.js';

const schemas = {
  updateProfile: z.object({
    name:     z.string().max(50).optional(),
    bio:      z.string().max(160).optional(),
    website:  z.string().url().or(z.literal('')).optional(),
    location: z.string().max(50).optional(),
    isPrivate:z.boolean().optional(),
    notifications: z.object({
      email:z.boolean(), push:z.boolean(), follows:z.boolean(),
      likes:z.boolean(), comments:z.boolean(), messages:z.boolean(),
    }).partial().optional(),
  }),
  createGroup: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(200).optional(),
    participantIds: z.array(z.string()).min(2).max(50),
  }),
};

export const validateUser = (name) => (req, res, next) => {
  const result = schemas[name]?.safeParse(req.body);
  if (!result) return next();
  if (!result.success)
    return next(new AppError(result.error.errors.map((e) => e.message).join('. '), 422));
  req.body = result.data;
  next();
};
