import { z } from 'zod';
import AppError from '../utils/AppError.js';

const schemas = {
  createPost:  z.object({ content: z.string().min(1).max(2200), visibility: z.enum(['public','followers','private']).default('public'), tags: z.array(z.string().max(50)).max(30).optional() }),
  addComment:  z.object({ content: z.string().min(1).max(1000) }),
};

export const validatePost = (name) => (req, res, next) => {
  const result = schemas[name]?.safeParse(req.body);
  if (!result) return next();
  if (!result.success)
    return next(new AppError(result.error.errors.map((e) => e.message).join('. '), 422));
  req.body = result.data;
  next();
};
