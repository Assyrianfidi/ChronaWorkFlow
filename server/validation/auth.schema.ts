import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please include a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    })
});

export const loginSchema = z.object({
  email: z.string().email('Please include a valid email'),
  password: z.string().min(1, 'Password is required')
});

export const updateDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please include a valid email').optional()
}).refine(data => data.name || data.email, {
  message: 'At least one field must be provided',
  path: ['name', 'email']
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    })
});
