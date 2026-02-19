import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER', 'OWNER']).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'AUDITOR', 'INVENTORY_MANAGER', 'OWNER']).optional(),
  isActive: z.boolean().optional(),
});

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime().or(z.date()),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  companyId: z.string().uuid().optional(),
  userId: z.number().int().positive().optional(),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.number().positive('Amount must be positive'),
  dueAt: z.string().datetime().or(z.date()),
  status: z.enum(['DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
  companyId: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    amount: z.number().positive(),
  })).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data: any) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const validate = (schema: any) => {
  return async (req: any, res: any, next: any) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export default validate;
