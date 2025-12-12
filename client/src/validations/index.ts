import * as z from 'zod';

// Common validation patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\d\s\-\(\)]+$/;
const zipCodeRegex = /^[\d\-\s]+$/;

// Base schemas
export const baseSchemas = {
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  zipCode: z.string().regex(zipCodeRegex, 'Invalid ZIP code'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  requiredString: z.string().min(1, 'This field is required'),
  positiveNumber: z.number().min(0, 'Must be a positive number'),
  percentage: z.number().min(0).max(100, 'Must be between 0 and 100'),
};

// Customer validation schema
export const customerSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  phone: baseSchemas.phone,
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  invoiceNumber: baseSchemas.requiredString,
  customerId: baseSchemas.requiredString,
  issueDate: baseSchemas.requiredString,
  dueDate: baseSchemas.requiredString,
  subtotal: baseSchemas.positiveNumber,
  taxRate: baseSchemas.percentage,
  total: baseSchemas.positiveNumber,
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  notes: z.string().optional(),
});

// User validation schema
export const userSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  role: z.enum(['Admin', 'User', 'Manager', 'Accountant']),
  department: z.string().optional(),
  phone: baseSchemas.phone.optional(),
});

// Authentication schemas
export const signInSchema = z.object({
  email: baseSchemas.email,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: baseSchemas.name,
  email: baseSchemas.email,
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Report validation schema
export const reportSchema = z.object({
  title: baseSchemas.requiredString,
  type: z.enum(['financial', 'sales', 'inventory', 'payroll', 'custom']),
  startDate: baseSchemas.requiredString,
  endDate: baseSchemas.requiredString,
  parameters: z.record(z.any()).optional(),
});

// Settings validation schema
export const settingsSchema = z.object({
  companyName: baseSchemas.name,
  companyEmail: baseSchemas.email,
  companyPhone: baseSchemas.phone.optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default('USD'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  timezone: z.string().default('UTC'),
});

// Product/Inventory validation schema
export const productSchema = z.object({
  name: baseSchemas.requiredString,
  sku: baseSchemas.requiredString,
  description: z.string().optional(),
  price: baseSchemas.positiveNumber,
  cost: baseSchemas.positiveNumber,
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  category: z.string().optional(),
  supplier: z.string().optional(),
});

// Transaction validation schema
export const transactionSchema = z.object({
  amount: baseSchemas.positiveNumber,
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
  description: z.string().optional(),
  date: baseSchemas.requiredString,
  accountId: baseSchemas.requiredString,
});

// Export all schemas
export const schemas = {
  customer: customerSchema,
  invoice: invoiceSchema,
  user: userSchema,
  signIn: signInSchema,
  signUp: signUpSchema,
  report: reportSchema,
  settings: settingsSchema,
  product: productSchema,
  transaction: transactionSchema,
};

// Type exports
export type CustomerFormData = z.infer<typeof customerSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;