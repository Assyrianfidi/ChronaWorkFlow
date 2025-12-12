const fs = require('fs');
const path = require('path');

function fixFormsValidation() {
  console.log('🔧 Fixing Forms, Validation & Interactions Issues\n');
  
  let fixesApplied = [];
  
  // 1. Create comprehensive form components
  console.log('🏗️  Creating Comprehensive Form Components...');
  
  // Create forms directory
  if (!fs.existsSync('src/components/forms')) {
    fs.mkdirSync('src/components/forms', { recursive: true });
    fixesApplied.push('Created forms directory');
  }
  
  // Create enhanced Form component
  const enhancedFormComponent = `import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  success?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, title, description, loading, error, success, ...props }, ref) => {
    return (
      <div className="w-full max-w-md mx-auto">
        {title && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        <form
          ref={ref}
          className={cn('space-y-4', className)}
          {...props}
        >
          {children}
        </form>
        
        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }
);

Form.displayName = 'Form';

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  required = false, 
  description, 
  children 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({ children, className }) => {
  return (
    <div className={cn('flex space-x-3 pt-4', className)}>
      {children}
    </div>
  );
};

export { FormField, FormActions };
export default Form;`;
  
  fs.writeFileSync('src/components/forms/Form.tsx', enhancedFormComponent);
  fixesApplied.push('Created enhanced Form component with validation support');
  
  // Create CustomerForm component
  const customerFormComponent = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Form, { FormField, FormActions } from './Form';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').regex(/^[\\d\\s\\-\\(\\)]+$/, 'Invalid phone number'),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error,
  success,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(initialData);
  };

  return (
    <Form
      title={initialData ? 'Edit Customer' : 'Add New Customer'}
      description="Fill in the customer information below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField
        label="Full Name"
        error={errors.name?.message}
        required
      >
        <Input
          {...register('name')}
          placeholder="Enter customer name"
          aria-label="Customer full name"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
      </FormField>

      <FormField
        label="Email Address"
        error={errors.email?.message}
        required
        description="We'll use this for invoices and notifications"
      >
        <Input
          {...register('email')}
          type="email"
          placeholder="customer@example.com"
          aria-label="Customer email address"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
      </FormField>

      <FormField
        label="Phone Number"
        error={errors.phone?.message}
        required
      >
        <Input
          {...register('phone')}
          type="tel"
          placeholder="(555) 123-4567"
          aria-label="Customer phone number"
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
      </FormField>

      <FormField
        label="Company"
        error={errors.company?.message}
      >
        <Input
          {...register('company')}
          placeholder="Company name (optional)"
          aria-label="Customer company name"
        />
      </FormField>

      <FormField
        label="Address"
        error={errors.address?.message}
      >
        <Input
          {...register('address')}
          placeholder="Street address"
          aria-label="Customer street address"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="City"
          error={errors.city?.message}
        >
          <Input
            {...register('city')}
            placeholder="City"
            aria-label="Customer city"
          />
        </FormField>

        <FormField
          label="State"
          error={errors.state?.message}
        >
          <Input
            {...register('state')}
            placeholder="State"
            aria-label="Customer state"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="ZIP Code"
          error={errors.zipCode?.message}
        >
          <Input
            {...register('zipCode')}
            placeholder="ZIP or postal code"
            aria-label="Customer ZIP code"
          />
        </FormField>

        <FormField
          label="Country"
          error={errors.country?.message}
        >
          <Input
            {...register('country')}
            placeholder="Country"
            aria-label="Customer country"
          />
        </FormField>
      </div>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? 'Update customer' : 'Create customer'}
        >
          {isSubmitting 
            ? 'Saving...' 
            : initialData 
              ? 'Update Customer' 
              : 'Create Customer'
          }
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default CustomerForm;`;
  
  fs.writeFileSync('src/components/forms/CustomerForm.tsx', customerFormComponent);
  fixesApplied.push('Created CustomerForm with React Hook Form and Zod validation');
  
  // Create InvoiceForm component
  const invoiceFormComponent = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Form, { FormField, FormActions } from './Form';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  subtotal: z.number().min(0, 'Subtotal must be positive'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  total: z.number().min(0, 'Total must be positive'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error,
  success,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      customerId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      taxRate: 0,
      total: 0,
      status: 'draft',
      notes: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(initialData);
  };

  return (
    <Form
      title={initialData ? 'Edit Invoice' : 'Create New Invoice'}
      description="Fill in the invoice details below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField
        label="Invoice Number"
        error={errors.invoiceNumber?.message}
        required
      >
        <Input
          {...register('invoiceNumber')}
          placeholder="INV-001"
          aria-label="Invoice number"
          aria-invalid={errors.invoiceNumber ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Customer ID"
        error={errors.customerId?.message}
        required
      >
        <Input
          {...register('customerId')}
          placeholder="Customer ID"
          aria-label="Customer ID"
          aria-invalid={errors.customerId ? 'true' : 'false'}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Issue Date"
          error={errors.issueDate?.message}
          required
        >
          <Input
            {...register('issueDate')}
            type="date"
            aria-label="Invoice issue date"
            aria-invalid={errors.issueDate ? 'true' : 'false'}
          />
        </FormField>

        <FormField
          label="Due Date"
          error={errors.dueDate?.message}
          required
        >
          <Input
            {...register('dueDate')}
            type="date"
            aria-label="Invoice due date"
            aria-invalid={errors.dueDate ? 'true' : 'false'}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Subtotal"
          error={errors.subtotal?.message}
          required
        >
          <Input
            {...register('subtotal', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Invoice subtotal"
            aria-invalid={errors.subtotal ? 'true' : 'false'}
          />
        </FormField>

        <FormField
          label="Tax Rate (%)"
          error={errors.taxRate?.message}
          required
        >
          <Input
            {...register('taxRate', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Tax rate"
            aria-invalid={errors.taxRate ? 'true' : 'false'}
          />
        </FormField>
      </div>

      <FormField
        label="Total"
        error={errors.total?.message}
        required
      >
        <Input
          {...register('total', { valueAsNumber: true })}
          type="number"
          step="0.01"
          placeholder="0.00"
          aria-label="Invoice total"
          aria-invalid={errors.total ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Status"
        error={errors.status?.message}
        required
      >
        <select
          {...register('status')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          aria-label="Invoice status"
          aria-invalid={errors.status ? 'true' : 'false'}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </FormField>

      <FormField
        label="Notes"
        error={errors.notes?.message}
        description="Additional notes or terms for this invoice"
      >
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter any additional notes..."
          aria-label="Invoice notes"
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? 'Update invoice' : 'Create invoice'}
        >
          {isSubmitting 
            ? 'Saving...' 
            : initialData 
              ? 'Update Invoice' 
              : 'Create Invoice'
          }
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default InvoiceForm;`;
  
  fs.writeFileSync('src/components/forms/InvoiceForm.tsx', invoiceFormComponent);
  fixesApplied.push('Created InvoiceForm with React Hook Form and Zod validation');
  
  // 2. Create validation schemas
  console.log('\n✅ Creating Validation Schemas...');
  
  // Create validations directory
  if (!fs.existsSync('src/validations')) {
    fs.mkdirSync('src/validations', { recursive: true });
    fixesApplied.push('Created validations directory');
  }
  
  const validationSchemas = `import * as z from 'zod';

// Common validation patterns
const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const phoneRegex = /^[\\d\\s\\-\\(\\)]+$/;
const zipCodeRegex = /^[\\d\\-\\s]+$/;

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
export type TransactionFormData = z.infer<typeof transactionSchema>;`;
  
  fs.writeFileSync('src/validations/index.ts', validationSchemas);
  fixesApplied.push('Created comprehensive validation schemas with Zod');
  
  // 3. Create form validation utilities
  console.log('\n🔧 Creating Form Validation Utilities...');
  
  const validationUtils = `import { z } from 'zod';
import { schemas } from './index';

// Validation utilities
export const validateForm = <T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodIssue[] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
};

// Format validation errors for form display
export const formatValidationErrors = (issues: z.ZodIssue[]): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return errors;
};

// Real-time validation for form fields
export const validateField = <T extends z.ZodSchema>(
  schema: T,
  fieldName: keyof z.infer<T>,
  value: unknown
): string | null => {
  try {
    const fieldSchema = schema.shape[fieldName as string] as z.ZodTypeAny;
    const result = fieldSchema.safeParse(value);
    
    if (result.success) {
      return null;
    }
    
    return result.error.issues[0]?.message || 'Invalid value';
  } catch {
    return 'Invalid field';
  }
};

// Async validation utilities
export const validateEmailUnique = async (email: string): Promise<boolean> => {
  // Simulate API call to check email uniqueness
  await new Promise(resolve => setTimeout(resolve, 500));
  return !email.includes('taken');
};

export const validateInvoiceNumberUnique = async (invoiceNumber: string): Promise<boolean> => {
  // Simulate API call to check invoice number uniqueness
  await new Promise(resolve => setTimeout(resolve, 500));
  return !invoiceNumber.includes('existing');
};

// Custom validation rules
export const customValidations = {
  passwordStrength: (password: string): boolean => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  },
  
  futureDate: (date: string): boolean => {
    return new Date(date) > new Date();
  },
  
  positiveAmount: (amount: number): boolean => {
    return amount > 0;
  },
  
  validPhone: (phone: string): boolean => {
    const phoneRegex = /^[\\d\\s\\-\\(\\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\\D/g, '').length >= 10;
  },
};

// Form validation hooks (for React Hook Form integration)
export const createFormResolver = <T extends z.ZodSchema>(schema: T) => {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    
    const errors: Record<string, { message: string }> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = { message: issue.message };
    });
    
    return { values: {}, errors };
  };
};

// Pre-configured resolvers for common forms
export const resolvers = {
  customer: createFormResolver(schemas.customer),
  invoice: createFormResolver(schemas.invoice),
  user: createFormResolver(schemas.user),
  signIn: createFormResolver(schemas.signIn),
  signUp: createFormResolver(schemas.signUp),
  report: createFormResolver(schemas.report),
  settings: createFormResolver(schemas.settings),
  product: createFormResolver(schemas.product),
  transaction: createFormResolver(schemas.transaction),
};

export default {
  validateForm,
  formatValidationErrors,
  validateField,
  validateEmailUnique,
  validateInvoiceNumberUnique,
  customValidations,
  createFormResolver,
  resolvers,
  schemas,
};`;
  
  fs.writeFileSync('src/validations/utils.ts', validationUtils);
  fixesApplied.push('Created form validation utilities and helpers');
  
  // 4. Create enhanced form components with validation feedback
  console.log('\n💬 Creating Enhanced Form Components with Validation Feedback...');
  
  const enhancedFormComponents = `import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { validateField, formatValidationErrors } from '@/validations/utils';

// Enhanced Input with real-time validation
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  validationSchema?: z.ZodTypeAny;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  showSuccessIndicator?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  name,
  label,
  error,
  touched = false,
  validationSchema,
  onValidationChange,
  showSuccessIndicator = true,
  className,
  onChange,
  onBlur,
  ...props
}) => {
  const [fieldError, setFieldError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    
    if (validationSchema) {
      const validationError = validateField(validationSchema, name as any, e.target.value);
      setFieldError(validationError || '');
      setIsValid(!validationError);
      onValidationChange?.(!validationError, validationError || undefined);
    }
    
    onChange?.(e);
  }, [name, validationSchema, onValidationChange, onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (validationSchema && isDirty) {
      const validationError = validateField(validationSchema, name as any, e.target.value);
      setFieldError(validationError || '');
      setIsValid(!validationError);
      onValidationChange?.(!validationError, validationError || undefined);
    }
    
    onBlur?.(e);
  }, [name, validationSchema, isDirty, onValidationChange, onBlur]);

  const displayError = error || fieldError;
  const showError = touched && isDirty && displayError;
  const showSuccess = touched && isDirty && isValid && showSuccessIndicator && !displayError;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <Input
          id={name}
          name={name}
          className={cn(
            showError && 'border-red-500 focus:ring-red-500',
            showSuccess && 'border-green-500 focus:ring-green-500',
            className
          )}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? \`\${name}-error\` : undefined}
          {...props}
        />
        
        {/* Validation indicators */}
        {showSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {showError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {showError && (
        <p 
          id={\`\${name}-error\`}
          className="text-sm text-red-600"
          role="alert"
        >
          {displayError}
        </p>
      )}
    </div>
  );
};

// Enhanced Form with comprehensive validation feedback
interface EnhancedFormProps {
  schema: z.ZodSchema;
  onSubmit: (data: any, isValid: boolean) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  confirmOnSubmit?: boolean;
  resetOnSubmit?: boolean;
}

const EnhancedForm: React.FC<EnhancedFormProps> = ({
  schema,
  onSubmit,
  children,
  className,
  showProgress = false,
  confirmOnSubmit = false,
  resetOnSubmit = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({});
  
  const {
    handleSubmit,
    formState: { errors, touchedFields, isValid, isDirty },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const handleFieldValidation = useCallback((fieldName: string, isValid: boolean, error?: string) => {
    setFieldValidations(prev => ({
      ...prev,
      [fieldName]: isValid,
    }));
  }, []);

  const handleFormSubmit = useCallback(async (data: any) => {
    if (confirmOnSubmit) {
      const confirmed = window.confirm('Are you sure you want to submit this form?');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await onSubmit(data, isValid);
      setSubmitSuccess('Form submitted successfully!');
      
      if (resetOnSubmit) {
        reset();
        setFieldValidations({});
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isValid, confirmOnSubmit, resetOnSubmit, reset]);

  const allFieldsValid = Object.values(fieldValidations).every(Boolean);
  const canSubmit = isValid && isDirty && allFieldsValid;

  // Clone children and inject validation props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === ValidatedInput) {
      return React.cloneElement(child, {
        onValidationChange: handleFieldValidation,
      } as any);
    }
    return child;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: \`\${(Object.keys(fieldValidations).length / Object.keys(schema.shape).length) * 100}%\` }}
          />
        </div>
      )}

      {/* Error and success messages */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
      
      {submitSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{submitSuccess}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {enhancedChildren}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setFieldValidations({});
              setSubmitError('');
              setSubmitSuccess('');
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { ValidatedInput, EnhancedForm };
export default ValidatedInput;`;
  
  fs.writeFileSync('src/components/forms/ValidatedForm.tsx', enhancedFormComponents);
  fixesApplied.push('Created enhanced form components with real-time validation feedback');
  
  // 5. Create form index for easy imports
  console.log('\n📦 Creating Form Index...');
  
  const formIndex = `// Form components and utilities export
export { default as Form, FormField, FormActions } from './Form';
export { default as CustomerForm } from './CustomerForm';
export { default as InvoiceForm } from './InvoiceForm';
export { ValidatedInput, EnhancedForm } from './ValidatedForm';

// Re-export UI components for forms
export { default as Button } from '../ui/Button';
export { default as Input } from '../ui/Input';
export { default as Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// Validation utilities
export { 
  validateForm, 
  formatValidationErrors, 
  validateField, 
  customValidations,
  createFormResolver,
  resolvers,
  schemas 
} from '../validations/utils';

// Types
export type { 
  CustomerFormData, 
  InvoiceFormData, 
  UserFormData,
  SignInFormData,
  SignUpFormData 
} from '../validations/utils';`;
  
  fs.writeFileSync('src/components/forms/index.ts', formIndex);
  fixesApplied.push('Created form index for easy imports');
  
  // 6. Summary
  console.log('\n📊 Forms & Validation Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  console.log('\n🎯 Forms & Validation are now optimized for:');
  console.log('  ✅ Comprehensive form components');
  console.log('  ✅ React Hook Form integration');
  console.log('  ✅ Zod validation schemas');
  console.log('  ✅ Real-time validation feedback');
  console.log('  ✅ Accessible form elements');
  console.log('  ✅ Error handling and display');
  console.log('  ✅ Form submission handling');
  console.log('  ✅ Validation utilities');
  
  return {
    success: true,
    fixesApplied
  };
}

if (require.main === module) {
  fixFormsValidation();
}

module.exports = { fixFormsValidation };
