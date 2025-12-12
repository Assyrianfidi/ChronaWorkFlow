// Additional validation schemas for comprehensive form support
import * as z from 'zod';
import { baseSchemas } from './index';

// Transaction validation schema
export const transactionSchema = z.object({
  amount: baseSchemas.positiveNumber,
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: baseSchemas.requiredString,
  accountId: baseSchemas.requiredString,
});

// Vendor validation schema
export const vendorSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email.optional(),
  phone: baseSchemas.phone.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
});

// Payroll validation schema
export const payrollSchema = z.object({
  employeeId: baseSchemas.requiredString,
  payPeriod: baseSchemas.requiredString,
  grossPay: baseSchemas.positiveNumber,
  netPay: baseSchemas.positiveNumber,
  deductions: z.number().min(0).optional(),
  bonuses: z.number().min(0).optional(),
  overtime: z.number().min(0).optional(),
  status: z.enum(['draft', 'processed', 'paid']),
});

// Settings validation schema (enhanced)
export const enhancedSettingsSchema = z.object({
  companyName: baseSchemas.name,
  companyEmail: baseSchemas.email,
  companyPhone: baseSchemas.phone.optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default('USD'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  timezone: z.string().default('UTC'),
  fiscalYear: z.string().optional(),
  invoicePrefix: z.string().default('INV'),
  quotePrefix: z.string().default('QUO'),
  autoBackup: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  twoFactorAuth: z.boolean().default(false),
});

// Contact form validation schema
export const contactFormSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  subject: z.string().min(1, 'Subject is required').min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(1, 'Message is required').min(10, 'Message must be at least 10 characters'),
  phone: baseSchemas.phone.optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
  currentPassword: baseSchemas.requiredString,
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Search/Filter validation schema
export const searchFilterSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Export all additional schemas
export const additionalSchemas = {
  transaction: transactionSchema,
  vendor: vendorSchema,
  payroll: payrollSchema,
  enhancedSettings: enhancedSettingsSchema,
  contactForm: contactFormSchema,
  passwordChange: passwordChangeSchema,
  searchFilter: searchFilterSchema,
};

// Type exports
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type VendorFormData = z.infer<typeof vendorSchema>;
export type PayrollFormData = z.infer<typeof payrollSchema>;
export type EnhancedSettingsFormData = z.infer<typeof enhancedSettingsSchema>;
export type ContactFormFormData = z.infer<typeof contactFormSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type SearchFilterFormData = z.infer<typeof searchFilterSchema>;