const fs = require('fs');
const path = require('path');

function finalFormsFix() {
  console.log('🎯 Final Forms & Validation Fix - Phase 6 Completion\n');
  
  let fixesApplied = [];
  
  // 1. Create additional form components
  console.log('📝 Creating Additional Form Components...');
  
  // UserForm component
  const userFormComponent = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Form, { FormField, FormActions } from './Form';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  role: z.enum(['Admin', 'User', 'Manager', 'Accountant']),
  department: z.string().optional(),
  phone: z.string().regex(/^[\\d\\s\\-\\(\\)]+$/, 'Invalid phone number').optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const UserForm: React.FC<UserFormProps> = ({
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
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'User',
      department: '',
      phone: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      title={initialData ? 'Edit User' : 'Add New User'}
      description="Fill in the user information below"
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
          placeholder="Enter user name"
          aria-label="User full name"
          aria-invalid={errors.name ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Email Address"
        error={errors.email?.message}
        required
      >
        <Input
          {...register('email')}
          type="email"
          placeholder="user@example.com"
          aria-label="User email address"
          aria-invalid={errors.email ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Role"
        error={errors.role?.message}
        required
      >
        <select
          {...register('role')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          aria-label="User role"
          aria-invalid={errors.role ? 'true' : 'false'}
        >
          <option value="User">User</option>
          <option value="Manager">Manager</option>
          <option value="Accountant">Accountant</option>
          <option value="Admin">Admin</option>
        </select>
      </FormField>

      <FormField
        label="Department"
        error={errors.department?.message}
      >
        <Input
          {...register('department')}
          placeholder="Department (optional)"
          aria-label="User department"
        />
      </FormField>

      <FormField
        label="Phone Number"
        error={errors.phone?.message}
      >
        <Input
          {...register('phone')}
          type="tel"
          placeholder="(555) 123-4567"
          aria-label="User phone number"
          aria-invalid={errors.phone ? 'true' : 'false'}
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? 'Update user' : 'Create user'}
        >
          {isSubmitting 
            ? 'Saving...' 
            : initialData 
              ? 'Update User' 
              : 'Create User'
          }
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(initialData)}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default UserForm;`;
  
  fs.writeFileSync('src/components/forms/UserForm.tsx', userFormComponent);
  fixesApplied.push('Created UserForm with React Hook Form and Zod validation');
  
  // ReportForm component
  const reportFormComponent = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Form, { FormField, FormActions } from './Form';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  type: z.enum(['financial', 'sales', 'inventory', 'payroll', 'custom']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  parameters: z.record(z.any()).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  initialData?: Partial<ReportFormData>;
  onSubmit: (data: ReportFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const ReportForm: React.FC<ReportFormProps> = ({
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
    watch,
    setValue,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      type: 'financial',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      parameters: {},
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      title={initialData ? 'Edit Report' : 'Generate New Report'}
      description="Configure your report parameters below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField
        label="Report Title"
        error={errors.title?.message}
        required
      >
        <Input
          {...register('title')}
          placeholder="Enter report title"
          aria-label="Report title"
          aria-invalid={errors.title ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Report Type"
        error={errors.type?.message}
        required
      >
        <select
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          aria-label="Report type"
          aria-invalid={errors.type ? 'true' : 'false'}
        >
          <option value="financial">Financial Report</option>
          <option value="sales">Sales Report</option>
          <option value="inventory">Inventory Report</option>
          <option value="payroll">Payroll Report</option>
          <option value="custom">Custom Report</option>
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          error={errors.startDate?.message}
          required
        >
          <Input
            {...register('startDate')}
            type="date"
            aria-label="Report start date"
            aria-invalid={errors.startDate ? 'true' : 'false'}
          />
        </FormField>

        <FormField
          label="End Date"
          error={errors.endDate?.message}
          required
        >
          <Input
            {...register('endDate')}
            type="date"
            aria-label="Report end date"
            aria-invalid={errors.endDate ? 'true' : 'false'}
          />
        </FormField>
      </div>

      <FormField
        label="Additional Parameters"
        error={errors.parameters?.message}
        description="JSON format for additional report parameters"
      >
        <textarea
          {...register('parameters')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder='{"key": "value"}'
          aria-label="Report parameters"
        />
      </FormField>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? 'Update report' : 'Generate report'}
        >
          {isSubmitting 
            ? 'Generating...' 
            : initialData 
              ? 'Update Report' 
              : 'Generate Report'
          }
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(initialData)}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default ReportForm;`;
  
  fs.writeFileSync('src/components/forms/ReportForm.tsx', reportFormComponent);
  fixesApplied.push('Created ReportForm with React Hook Form and Zod validation');
  
  // ProductForm component
  const productFormComponent = `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Form, { FormField, FormActions } from './Form';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  category: z.string().optional(),
  supplier: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
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
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      price: 0,
      cost: 0,
      quantity: 0,
      category: '',
      supplier: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      title={initialData ? 'Edit Product' : 'Add New Product'}
      description="Fill in the product information below"
      loading={loading || isSubmitting}
      error={error}
      success={success}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FormField
        label="Product Name"
        error={errors.name?.message}
        required
      >
        <Input
          {...register('name')}
          placeholder="Enter product name"
          aria-label="Product name"
          aria-invalid={errors.name ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="SKU"
        error={errors.sku?.message}
        required
      >
        <Input
          {...register('sku')}
          placeholder="Enter product SKU"
          aria-label="Product SKU"
          aria-invalid={errors.sku ? 'true' : 'false'}
        />
      </FormField>

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Product description (optional)"
          aria-label="Product description"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Price"
          error={errors.price?.message}
          required
        >
          <Input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Product price"
            aria-invalid={errors.price ? 'true' : 'false'}
          />
        </FormField>

        <FormField
          label="Cost"
          error={errors.cost?.message}
          required
        >
          <Input
            {...register('cost', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            aria-label="Product cost"
            aria-invalid={errors.cost ? 'true' : 'false'}
          />
        </FormField>
      </div>

      <FormField
        label="Quantity"
        error={errors.quantity?.message}
        required
      >
        <Input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          placeholder="0"
          aria-label="Product quantity"
          aria-invalid={errors.quantity ? 'true' : 'false'}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Category"
          error={errors.category?.message}
        >
          <Input
            {...register('category')}
            placeholder="Product category"
            aria-label="Product category"
          />
        </FormField>

        <FormField
          label="Supplier"
          error={errors.supplier?.message}
        >
          <Input
            {...register('supplier')}
            placeholder="Supplier name"
            aria-label="Product supplier"
          />
        </FormField>
      </div>

      <FormActions>
        <Button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          loading={isSubmitting}
          aria-label={initialData ? 'Update product' : 'Add product'}
        >
          {isSubmitting 
            ? 'Saving...' 
            : initialData 
              ? 'Update Product' 
              : 'Add Product'
          }
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(initialData)}
          disabled={isSubmitting}
          aria-label="Reset form"
        >
          Reset
        </Button>
      </FormActions>
    </Form>
  );
};

export default ProductForm;`;
  
  fs.writeFileSync('src/components/forms/ProductForm.tsx', productFormComponent);
  fixesApplied.push('Created ProductForm with React Hook Form and Zod validation');
  
  // 2. Create additional validation schemas
  console.log('\n✅ Creating Additional Validation Schemas...');
  
  const additionalSchemas = `// Additional validation schemas for comprehensive form support
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
export type SearchFilterFormData = z.infer<typeof searchFilterSchema>;`;
  
  fs.writeFileSync('src/validations/additional.ts', additionalSchemas);
  fixesApplied.push('Created additional validation schemas for comprehensive form support');
  
  // 3. Create enhanced form validation hooks
  console.log('\n🎣 Creating Enhanced Form Validation Hooks...');
  
  const validationHooks = `import { useState, useCallback, useEffect } from 'react';
import { useForm, FormState } from 'react-hook-form';
import { z } from 'zod';
import { validateField, validateForm } from './utils';

// Real-time validation hook
export const useRealTimeValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema,
  initialData?: T
) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldValidities, setFieldValidities] = useState<Record<string, boolean>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateFieldRealTime = useCallback((fieldName: string, value: any) => {
    const error = validateField(schema, fieldName as any, value);
    const isValid = !error;
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error || '',
    }));
    
    setFieldValidities(prev => ({
      ...prev,
      [fieldName]: isValid,
    }));
    
    return isValid;
  }, [schema]);

  const validateAllFields = useCallback((data: T) => {
    const result = validateForm(schema, data);
    
    if (result.success) {
      setFieldErrors({});
      setFieldValidities(
        Object.keys(data).reduce((acc, key) => ({
          ...acc,
          [key]: true,
        }), {})
      );
      setIsFormValid(true);
      return true;
    } else {
      const errors = formatValidationErrors(result.errors);
      setFieldErrors(errors);
      setFieldValidities(
        Object.keys(data).reduce((acc, key) => ({
          ...acc,
          [key]: !errors[key],
        }), {})
      );
      setIsFormValid(false);
      return false;
    }
  }, [schema]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    
    setFieldValidities(prev => ({
      ...prev,
      [fieldName]: false,
    }));
  }, []);

  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setFieldValidities({});
    setIsFormValid(false);
  }, []);

  return {
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    resetValidation,
  };
};

// Form submission with validation hook
export const useFormSubmission = <T extends Record<string, any>>(
  schema: z.ZodSchema,
  onSubmit: (data: T) => Promise<void>,
  options?: {
    resetOnSubmit?: boolean;
    validateOnChange?: boolean;
    showConfirmDialog?: boolean;
  }
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  const {
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    resetValidation,
  } = useRealTimeValidation(schema);

  const handleSubmit = useCallback(async (data: T) => {
    if (!validateAllFields(data)) {
      setSubmitError('Please fix validation errors before submitting');
      return;
    }

    if (options?.showConfirmDialog) {
      const confirmed = window.confirm('Are you sure you want to submit this form?');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await onSubmit(data);
      setSubmitSuccess('Form submitted successfully!');
      
      if (options?.resetOnSubmit) {
        resetValidation();
        setIsDirty(false);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllFields, onSubmit, options, resetValidation]);

  const handleReset = useCallback(() => {
    resetValidation();
    setIsDirty(false);
    setSubmitError('');
    setSubmitSuccess('');
  }, [resetValidation]);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    isDirty,
    setIsDirty,
    fieldErrors,
    fieldValidities,
    isFormValid,
    validateFieldRealTime,
    validateAllFields,
    clearFieldError,
    handleSubmit,
    handleReset,
  };
};

// Auto-save form hook
export const useAutoSave = <T extends Record<string, any>>(
  key: string,
  data: T,
  interval: number = 30000 // 30 seconds default
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveToStorage = useCallback(async (dataToSave: T) => {
    setIsSaving(true);
    try {
      localStorage.setItem(key, JSON.stringify({
        data: dataToSave,
        timestamp: new Date().toISOString(),
      }));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [key]);

  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.error('Load from storage failed:', error);
    }
    return null;
  }, [key]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(key);
    setLastSaved(null);
  }, [key]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setInterval(() => {
      if (data && Object.keys(data).length > 0) {
        saveToStorage(data);
      }
    }, interval);

    return () => clearInterval(saveTimer);
  }, [data, interval, saveToStorage]);

  return {
    lastSaved,
    isSaving,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
};

// Form progress tracking hook
export const useFormProgress = (fields: string[], fieldValidities: Record<string, boolean>) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const validFields = Object.entries(fieldValidities)
      .filter(([field, isValid]) => fields.includes(field) && isValid)
      .length;
    
    const totalFields = fields.length;
    const progressPercentage = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
    
    setProgress(progressPercentage);
  }, [fields, fieldValidities]);

  const getProgressStatus = useCallback(() => {
    if (progress === 0) return 'not-started';
    if (progress < 50) return 'in-progress';
    if (progress < 100) return 'almost-complete';
    return 'complete';
  }, [progress]);

  return {
    progress,
    progressStatus: getProgressStatus(),
    isComplete: progress === 100,
    isInProgress: progress > 0 && progress < 100,
  };
};

export {
  useRealTimeValidation,
  useFormSubmission,
  useAutoSave,
  useFormProgress,
};`;
  
  fs.writeFileSync('src/validations/hooks.ts', validationHooks);
  fixesApplied.push('Created enhanced form validation hooks for real-time validation');
  
  // 4. Update form index with new components
  console.log('\n📦 Updating Form Index...');
  
  const updatedFormIndex = `// Comprehensive form components and utilities export
export { default as Form, FormField, FormActions } from './Form';
export { default as CustomerForm } from './CustomerForm';
export { default as InvoiceForm } from './InvoiceForm';
export { default as UserForm } from './UserForm';
export { default as ReportForm } from './ReportForm';
export { default as ProductForm } from './ProductForm';
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

// Additional validation schemas
export { 
  additionalSchemas,
  TransactionFormData,
  VendorFormData,
  PayrollFormData,
  EnhancedSettingsFormData,
  ContactFormFormData,
  PasswordChangeFormData,
  SearchFilterFormData
} from '../validations/additional';

// Validation hooks
export {
  useRealTimeValidation,
  useFormSubmission,
  useAutoSave,
  useFormProgress
} from '../validations/hooks';

// Types
export type { 
  CustomerFormData, 
  InvoiceFormData, 
  UserFormData,
  SignInFormData,
  SignUpFormData,
  ReportFormData,
  ProductFormData
} from '../validations/utils';`;
  
  fs.writeFileSync('src/components/forms/index.ts', updatedFormIndex);
  fixesApplied.push('Updated form index with all new components and utilities');
  
  // 5. Create form documentation
  console.log('\n📚 Creating Form Documentation...');
  
  const formDocumentation = `# AccuBooks Form Components Documentation

## Overview
The AccuBooks application features a comprehensive form system with React Hook Form integration, Zod validation, and real-time feedback.

## Form Components

### 1. Base Form Component (\`Form.tsx\`)
- **Purpose**: Base form wrapper with error/success message handling
- **Features**:
  - Title and description support
  - Error and success message display
  - Loading state indicator
  - Accessibility support

#### Usage:
\`\`\`tsx
import Form, { FormField, FormActions } from '@/components/forms/Form';

const MyForm = () => {
  return (
    <Form
      title="Form Title"
      description="Form description"
      onSubmit={handleSubmit}
      error={error}
      success={success}
      loading={loading}
    >
      <FormField label="Field Label" error={errorMessage}>
        <Input {...register('field')} />
      </FormField>
      
      <FormActions>
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline">Cancel</Button>
      </FormActions>
    </Form>
  );
};
\`\`\`

### 2. CustomerForm (\`CustomerForm.tsx\`)
- **Purpose**: Customer creation and editing form
- **Features**:
  - React Hook Form integration
  - Zod validation schema
  - Real-time validation feedback
  - Accessibility support

### 3. InvoiceForm (\`InvoiceForm.tsx\`)
- **Purpose**: Invoice creation and editing form
- **Features**:
  - Date picker integration
  - Status selection
  - Tax calculation support
  - Real-time validation

### 4. UserForm (\`UserForm.tsx\`)
- **Purpose**: User management form
- **Features**:
  - Role selection
  - Department assignment
  - Email and phone validation

### 5. ReportForm (\`ReportForm.tsx\`)
- **Purpose**: Report generation configuration
- **Features**:
  - Report type selection
  - Date range configuration
  - JSON parameter support

### 6. ProductForm (\`ProductForm.tsx\`)
- **Purpose**: Product/inventory management
- **Features**:
  - SKU validation
  - Price and cost tracking
  - Quantity management

### 7. ValidatedInput (\`ValidatedForm.tsx\`)
- **Purpose**: Enhanced input with real-time validation
- **Features**:
  - Real-time validation feedback
  - Success/error indicators
  - Accessibility support

## Validation System

### 1. Zod Schemas (\`validations/index.ts\`)
- **Customer Schema**: Name, email, phone, address validation
- **Invoice Schema**: Invoice number, dates, amounts, status
- **User Schema**: User information, role, department
- **Report Schema**: Report configuration and parameters
- **Product Schema**: Product details, pricing, inventory

### 2. Additional Schemas (\`validations/additional.ts\`)
- **Transaction Schema**: Financial transaction validation
- **Vendor Schema**: Supplier information validation
- **Payroll Schema**: Employee payroll validation
- **Settings Schema**: Application settings validation
- **Contact Form Schema**: Contact form validation
- **Password Change Schema**: Password update validation

### 3. Validation Utilities (\`validations/utils.ts\`)
- **validateForm**: Form-level validation
- **validateField**: Field-level validation
- **formatValidationErrors**: Error formatting
- **customValidations**: Custom validation rules
- **createFormResolver**: React Hook Form resolver

## Validation Hooks

### 1. useRealTimeValidation
- **Purpose**: Real-time field validation
- **Features**:
  - Field-by-field validation
  - Error tracking
  - Validity tracking

### 2. useFormSubmission
- **Purpose**: Form submission with validation
- **Features**:
  - Pre-submission validation
  - Error handling
  - Success handling
  - Loading states

### 3. useAutoSave
- **Purpose**: Automatic form saving
- **Features**:
  - Local storage persistence
  - Configurable save intervals
  - Load/save functionality

### 4. useFormProgress
- **Purpose**: Form completion tracking
- **Features**:
  - Progress percentage
  - Status tracking
  - Completion detection

## Best Practices

### 1. Form Structure
- Always use the base \`Form\` component for consistency
- Use \`FormField\` for proper label/error association
- Implement real-time validation for better UX

### 2. Validation
- Use Zod schemas for type-safe validation
- Implement both field-level and form-level validation
- Provide clear, actionable error messages

### 3. Accessibility
- Include proper ARIA labels
- Use semantic HTML elements
- Ensure keyboard navigation support

### 4. User Experience
- Show loading states during submission
- Provide success/error feedback
- Implement auto-save for long forms

## Examples

### Basic Form with Validation
\`\`\`tsx
import { useFormSubmission } from '@/validations/hooks';
import { customerSchema } from '@/validations/utils';

const CustomerFormExample = () => {
  const {
    isSubmitting,
    submitError,
    submitSuccess,
    fieldErrors,
    validateFieldRealTime,
    handleSubmit,
  } = useFormSubmission(customerSchema, async (data) => {
    await api.createCustomer(data);
  });

  return (
    <Form onSubmit={handleSubmit} error={submitError} success={submitSuccess}>
      <FormField label="Name" error={fieldErrors.name}>
        <Input
          onChange={(e) => validateFieldRealTime('name', e.target.value)}
          placeholder="Customer name"
        />
      </FormField>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Create Customer'}
      </Button>
    </Form>
  );
};
\`\`\`

### Form with Auto-Save
\`\`\`tsx
import { useAutoSave } from '@/validations/hooks';

const AutoSaveForm = () => {
  const [formData, setFormData] = useState(initialData);
  
  const { lastSaved, isSaving } = useAutoSave('customer-form', formData);
  
  return (
    <Form>
      {/* Form fields */}
      {lastSaved && (
        <p className="text-sm text-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </p>
      )}
    </Form>
  );
};
\`\`\`

## Testing

### Form Testing
- Test validation rules
- Test form submission
- Test error handling
- Test accessibility

### Example Test
\`\`\`tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerForm from './CustomerForm';

describe('CustomerForm', () => {
  it('validates required fields', async () => {
    const mockSubmit = jest.fn();
    render(<CustomerForm onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /create customer/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
\`\`\`

## Troubleshooting

### Common Issues
1. **Validation not working**: Check schema integration and resolver setup
2. **Form not submitting**: Verify validation passes and onSubmit handler
3. **Error messages not showing**: Check error state and FormField usage
4. **Auto-save not working**: Verify localStorage availability and key uniqueness

### Debug Tips
- Use React DevTools to inspect form state
- Check validation schema for incorrect rules
- Verify form data structure matches schema
- Test with different user inputs`;
  
  fs.writeFileSync('src/components/forms/FORMS.md', formDocumentation);
  fixesApplied.push('Created comprehensive form documentation');
  
  // 6. Summary
  console.log('\n📊 Final Forms & Validation Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  console.log('\n🎯 Forms & Validation are now optimized for:');
  console.log('  ✅ 5+ comprehensive form components');
  console.log('  ✅ React Hook Form integration');
  console.log('  ✅ Zod validation schemas');
  console.log('  ✅ Real-time validation feedback');
  console.log('  ✅ Enhanced validation hooks');
  console.log('  ✅ Auto-save functionality');
  console.log('  ✅ Progress tracking');
  console.log('  ✅ Comprehensive documentation');
  
  return {
    success: true,
    fixesApplied
  };
}

if (require.main === module) {
  finalFormsFix();
}

module.exports = { finalFormsFix };
