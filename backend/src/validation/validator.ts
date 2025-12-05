/**
 * Validator Implementation
 * Simple validation engine
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule | ValidationSchema;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data: any;
}

export class Validator {
  /**
   * Validate data against schema
   */
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    this.validateObject(data, schema, '', errors, validatedData);

    return {
      isValid: errors.length === 0,
      errors,
      data: validatedData
    };
  }

  /**
   * Validate an object
   */
  private validateObject(
    data: any,
    schema: ValidationSchema,
    prefix: string,
    errors: ValidationError[],
    validatedData: any
  ): void {
    for (const [field, rule] of Object.entries(schema)) {
      const fieldPath = prefix ? `${prefix}.${field}` : field;
      const value = data?.[field];

      if (this.isValidationRule(rule)) {
        this.validateField(value, rule as ValidationRule, fieldPath, errors, validatedData);
      } else {
        // Nested object
        if (value && typeof value === 'object') {
          validatedData[field] = {};
          this.validateObject(value, rule as ValidationSchema, fieldPath, errors, validatedData[field]);
        } else if ((rule as ValidationSchema)[field]?.required) {
          errors.push({
            field: fieldPath,
            message: 'This field is required',
            value
          });
        }
      }
    }
  }

  /**
   * Validate a single field
   */
  private validateField(
    value: any,
    rule: ValidationRule,
    fieldPath: string,
    errors: ValidationError[],
    validatedData: any
  ): void {
    const fieldName = fieldPath.split('.').pop()!;

    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: `${fieldName} is required`,
        value
      });
      return;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return;
    }

    // Type validation
    if (rule.type && !this.validateType(value, rule.type)) {
      errors.push({
        field: fieldPath,
        message: `${fieldName} must be a ${rule.type}`,
        value
      });
      return;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: fieldPath,
          message: `${fieldName} must be at least ${rule.minLength} characters long`,
          value
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: fieldPath,
          message: `${fieldName} must be no more than ${rule.maxLength} characters long`,
          value
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: fieldPath,
          message: `${fieldName} format is invalid`,
          value
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldPath,
          message: `${fieldName} must be at least ${rule.min}`,
          value
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldPath,
          message: `${fieldName} must be no more than ${rule.max}`,
          value
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: fieldPath,
          message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`,
          value
        });
      }
    }

    // If no errors, add to validated data
    if (errors.filter(e => e.field === fieldPath).length === 0) {
      validatedData[fieldName] = value;
    }
  }

  /**
   * Validate type
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      default:
        return true;
    }
  }

  /**
   * Check if rule is a ValidationRule
   */
  private isValidationRule(rule: any): rule is ValidationRule {
    return rule && typeof rule === 'object' && !Array.isArray(rule) && !this.isSchema(rule);
  }

  /**
   * Check if rule is a schema
   */
  private isSchema(rule: any): rule is ValidationSchema {
    return rule && typeof rule === 'object' && !Array.isArray(rule) && Object.keys(rule).some(key => {
      const value = rule[key];
      return value && typeof value === 'object' && !Array.isArray(value);
    });
  }

  /**
   * Create common validation schemas
   */
  static schemas = {
    email: {
      type: 'email' as const,
      required: true
    },
    password: {
      type: 'string' as const,
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      custom: (value: string) => {
        if (!/(?=.*[!@#$%^&*])/.test(value)) {
          return 'Password must contain at least one special character';
        }
        return true;
      }
    },
    name: {
      type: 'string' as const,
      required: true,
      minLength: 2,
      maxLength: 100
    },
    positiveNumber: {
      type: 'number' as const,
      required: true,
      min: 0
    }
  };
}

export default Validator;
