import { z } from 'zod';

const pw = z.string().min(8,'Min 8 chars').regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need number');

export const loginSchema    = z.object({ email: z.string().email(), password: z.string().min(1) });
export const registerSchema = z.object({ username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/,'Letters, numbers, underscores only'), email: z.string().email(), name: z.string().max(50).optional(), password: pw, confirmPassword: z.string() }).refine(d=>d.password===d.confirmPassword,{message:'Passwords do not match',path:['confirmPassword']});
export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema  = z.object({ password: pw, confirmPassword: z.string() }).refine(d=>d.password===d.confirmPassword,{message:'Passwords do not match',path:['confirmPassword']});
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: pw, confirmPassword: z.string() }).refine(d=>d.newPassword===d.confirmPassword,{message:'Passwords do not match',path:['confirmPassword']});
export const profileSchema  = z.object({ name: z.string().max(50).optional(), bio: z.string().max(160).optional(), website: z.string().url().or(z.literal('')).optional(), location: z.string().max(50).optional() });
export const postSchema     = z.object({ content: z.string().min(1,'Required').max(2200), visibility: z.enum(['public','followers','private']).default('public') });
export const commentSchema  = z.object({ content: z.string().min(1).max(1000) });
