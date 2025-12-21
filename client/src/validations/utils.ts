import { z } from "zod";
import { schemas } from "./index";

// Validation utilities
export const validateForm = <T extends z.ZodSchema>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: z.ZodIssue[] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error.issues };
};

// Format validation errors for form display
export const formatValidationErrors = (
  issues: z.ZodIssue[],
): Record<string, string> => {
  const errors: Record<string, string> = {};

  issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return errors;
};

// Real-time validation for form fields
export const validateField = <T extends z.ZodSchema>(
  schema: T,
  fieldName: string,
  value: unknown,
): string | null => {
  try {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const fieldSchema = (shape as Record<string, z.ZodTypeAny>)[
        fieldName
      ];
      if (!fieldSchema) return "Invalid field";

      const result = fieldSchema.safeParse(value);

      if (result.success) {
        return null;
      }

      return result.error.issues[0]?.message || "Invalid value";
    }

    const result = schema.safeParse({ [fieldName]: value });

    if (result.success) {
      return null;
    }

    return result.error.issues[0]?.message || "Invalid value";
  } catch {
    return "Invalid field";
  }
};

// Async validation utilities
export const validateEmailUnique = async (email: string): Promise<boolean> => {
  // Simulate API call to check email uniqueness
  await new Promise((resolve) => setTimeout(resolve, 500));
  return !email.includes("taken");
};

export const validateInvoiceNumberUnique = async (
  invoiceNumber: string,
): Promise<boolean> => {
  // Simulate API call to check invoice number uniqueness
  await new Promise((resolve) => setTimeout(resolve, 500));
  return !invoiceNumber.includes("existing");
};

// Custom validation rules
export const customValidations = {
  passwordStrength: (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  futureDate: (date: string): boolean => {
    return new Date(date) > new Date();
  },

  positiveAmount: (amount: number): boolean => {
    return amount > 0;
  },

  validPhone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
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
      const path = issue.path.join(".");
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
};
