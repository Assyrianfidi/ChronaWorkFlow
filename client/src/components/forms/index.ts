// Comprehensive form components and utilities export
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
} from '../validations/utils';