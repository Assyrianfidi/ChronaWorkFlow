// CRITICAL: Environment Validation Module
// MANDATORY: Centralized validation of all environment variables and secrets

import { logger } from '../utils/structured-logger.js';

export interface EnvironmentVariableDefinition {
  name: string;
  required: boolean;
  description: string;
  category: 'SECURITY' | 'DATABASE' | 'AUTHENTICATION' | 'EXTERNAL_SERVICES' | 'APPLICATION';
  isSecret: boolean;
  validationRules: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: string[];
    forbiddenPatterns?: RegExp[];
    entropy?: {
      minBits: number;
      requireMixedCase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    };
  };
  examples?: string[];
  productionOnly?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    variable: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
    category: string;
  }>;
  warnings: Array<{
    variable: string;
    message: string;
    category: string;
  }>;
}

export interface SecurityPosture {
  environment: string;
  isProduction: boolean;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  validatedAt: Date;
  secretsCount: number;
  warningsCount: number;
  errorsCount: number;
}

/**
 * CRITICAL: Environment Validator
 * 
 * This class validates all environment variables and secrets at startup.
 * ALL validation failures result in immediate application termination.
 */
export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private definitions: Map<string, EnvironmentVariableDefinition> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();
  private securityPosture: SecurityPosture | null = null;

  private constructor() {
    this.initializeDefinitions();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * CRITICAL: Validate all environment variables
   */
  validateAll(): ValidationResult {
    const startTime = Date.now();
    const allErrors: ValidationResult['errors'] = [];
    const allWarnings: ValidationResult['warnings'] = [];

    // CRITICAL: Get environment
    const environment = process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';

    // CRITICAL: Validate each defined variable
    for (const [name, definition] of this.definitions) {
      const result = this.validateVariable(name, definition, isProduction);
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      
      allWarnings.push(...result.warnings);
    }

    // CRITICAL: Check for undefined variables that might be security risks
    this.checkForUndefinedVariables(allErrors, allWarnings);

    // CRITICAL: Validate production-specific requirements
    if (isProduction) {
      this.validateProductionRequirements(allErrors, allWarnings);
    }

    const isValid = allErrors.length === 0;
    const duration = Date.now() - startTime;

    // CRITICAL: Store security posture
    this.securityPosture = {
      environment,
      isProduction,
      securityLevel: this.calculateSecurityLevel(isProduction, allErrors.length, allWarnings.length),
      validatedAt: new Date(),
      secretsCount: Array.from(this.definitions.values()).filter(d => d.isSecret).length,
      warningsCount: allWarnings.length,
      errorsCount: allErrors.length
    };

    // CRITICAL: Log validation results
    if (isValid) {
      logger.info('Environment validation passed', {
        environment,
        variablesValidated: this.definitions.size,
        warningsCount: allWarnings.length,
        duration,
        securityLevel: this.securityPosture.securityLevel
      });
    } else {
      logger.error('Environment validation failed', new Error('ENVIRONMENT_VALIDATION_FAILED'), {
        environment,
        errorsCount: allErrors.length,
        warningsCount: allWarnings.length,
        duration,
        errors: allErrors.map(e => ({ variable: e.variable, message: e.message, severity: e.severity }))
      });
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * CRITICAL: Validate single environment variable
   */
  private validateVariable(
    name: string,
    definition: EnvironmentVariableDefinition,
    isProduction: boolean
  ): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    const value = process.env[name];

    // CRITICAL: Check if required variable is missing
    if (definition.required && !value) {
      errors.push({
        variable: name,
        message: `Required environment variable is missing`,
        severity: 'ERROR',
        category: definition.category
      });
      return { isValid: false, errors, warnings };
    }

    // CRITICAL: Skip validation if variable is not provided and not required
    if (!value && !definition.required) {
      return { isValid: true, errors, warnings };
    }

    // CRITICAL: Validate length constraints
    if (definition.validationRules.minLength && value && value.length < definition.validationRules.minLength) {
      errors.push({
        variable: name,
        message: `Value too short (minimum ${definition.validationRules.minLength} characters)`,
        severity: 'ERROR' as const,
        category: definition.category
      });
    }

    if (definition.validationRules.maxLength && value && value.length > definition.validationRules.maxLength) {
      errors.push({
        variable: name,
        message: `Value too long (maximum ${definition.validationRules.maxLength} characters)`,
        severity: 'ERROR' as const,
        category: definition.category
      });
    }

    // CRITICAL: Validate pattern
    if (definition.validationRules.pattern && value && !definition.validationRules.pattern.test(value)) {
      errors.push({
        variable: name,
        message: `Value does not match required pattern`,
        severity: 'ERROR' as const,
        category: definition.category
      });
    }

    // CRITICAL: Validate allowed values
    if (definition.validationRules.allowedValues && value && !definition.validationRules.allowedValues.includes(value)) {
      errors.push({
        variable: name,
        message: `Value must be one of: ${definition.validationRules.allowedValues.join(', ')}`,
        severity: 'ERROR' as const,
        category: definition.category
      });
    }

    // CRITICAL: Check forbidden patterns
    if (definition.validationRules.forbiddenPatterns && value) {
      for (const pattern of definition.validationRules.forbiddenPatterns) {
        if (pattern.test(value)) {
          errors.push({
            variable: name,
            message: `Value contains forbidden pattern`,
            severity: 'ERROR' as const,
            category: definition.category
          });
        }
      }
    }

    // CRITICAL: Validate secret strength
    if (definition.isSecret && definition.validationRules.entropy && value) {
      const entropyResult = this.validateSecretStrength(value, definition.validationRules.entropy!);
      
      if (!entropyResult.isValid) {
        errors.push(...entropyResult.errors.map(error => ({
          variable: name,
          message: error.message,
          severity: 'ERROR' as const,
          category: definition.category
        })));
      }

      warnings.push(...entropyResult.warnings.map(warning => ({
        variable: name,
        message: warning.message,
        category: definition.category
      })));
    }

    // CRITICAL: Check for default/placeholder values in production
    // Only applies to secrets; non-secret flags (e.g., 'true'/'false') should not be rejected.
    if (isProduction && value && definition.isSecret && this.isDefaultValue(value)) {
      errors.push({
        variable: name,
        message: 'Default/placeholder value detected in production',
        severity: 'ERROR' as const,
        category: definition.category
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * CRITICAL: Validate secret strength
   */
  private validateSecretStrength(
    value: string,
    entropyRules: NonNullable<EnvironmentVariableDefinition['validationRules']['entropy']>
  ): { isValid: boolean; errors: Array<{ message: string }>; warnings: Array<{ message: string }> } {
    const errors: Array<{ message: string }> = [];
    const warnings: Array<{ message: string }> = [];

    // CRITICAL: Calculate entropy
    const entropy = this.calculateEntropy(value);
    
    if (entropy < entropyRules.minBits) {
      errors.push({
        message: `Insufficient entropy (${entropy.toFixed(2)} bits, minimum ${entropyRules.minBits} bits required)`
      });
    }

    // CRITICAL: Check character requirements
    if (entropyRules.requireMixedCase) {
      if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
        errors.push({
          message: 'Secret must contain both uppercase and lowercase letters'
        });
      }
    }

    if (entropyRules.requireNumbers) {
      if (!/[0-9]/.test(value)) {
        errors.push({
          message: 'Secret must contain at least one number'
        });
      }
    }

    if (entropyRules.requireSpecialChars) {
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.push({
          message: 'Secret must contain at least one special character'
        });
      }
    }

    // CRITICAL: Check for common weak patterns
    const weakPatterns = [
      /password/i,
      /secret/i,
      /admin/i,
      /test/i,
      /123/i,
      /qwerty/i,
      /abc/i
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(value)) {
        warnings.push({
          message: 'Secret contains potentially weak pattern'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * CRITICAL: Calculate entropy of a string
   */
  private calculateEntropy(value: string): number {
    const charset = new Set(value.split(''));
    const charsetSize = charset.size;
    
    if (charsetSize <= 1) return 0;
    
    return value.length * Math.log2(charsetSize);
  }

  /**
   * CRITICAL: Check if value is a default/placeholder
   */
  private isDefaultValue(value: string): boolean {
    const defaultPatterns = [
      /^(password|secret|key|token)$/i,
      /^(your_|change_|replace_|set_)/i,
      /^(example|test|demo|sample|default)$/i,
      /^(xxx|yyy|zzz|abc|123|456|789)$/i,
      /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i,
      /^(true|false)$/i,
      /^(none|null|undefined)$/i
    ];

    return defaultPatterns.some(pattern => pattern.test(value));
  }

  /**
   * CRITICAL: Check for undefined variables that might be security risks
   */
  private checkForUndefinedVariables(
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // CRITICAL: Check for potentially sensitive variables that aren't defined
    const sensitivePatterns = [
      /^SECRET_/,
      /^KEY_/,
      /^TOKEN_/,
      /^PASSWORD_/,
      /^PRIVATE_/,
      /^CERT_/,
      /^API_/,
      /^DATABASE_/,
      /^REDIS_/,
      /^SMTP_/
    ];

    for (const [key] of Object.entries(process.env)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        if (!this.definitions.has(key)) {
          warnings.push({
            variable: key,
            message: 'Potentially sensitive variable not defined in validation rules',
            category: 'SECURITY'
          });
        }
      }
    }
  }

  /**
   * CRITICAL: Validate production-specific requirements
   */
  private validateProductionRequirements(
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // CRITICAL: Ensure HTTPS is enforced
    if (process.env.ENFORCE_HTTPS !== 'true') {
      errors.push({
        variable: 'ENFORCE_HTTPS',
        message: 'HTTPS enforcement must be enabled in production',
        severity: 'ERROR',
        category: 'SECURITY'
      });
    }

    // CRITICAL: Ensure secure cookies
    if (process.env.COOKIE_SECURE !== 'true') {
      errors.push({
        variable: 'COOKIE_SECURE',
        message: 'Secure cookies must be enabled in production',
        severity: 'ERROR',
        category: 'SECURITY'
      });
    }

    // CRITICAL: Ensure debug mode is disabled
    if (process.env.DEBUG === 'true') {
      errors.push({
        variable: 'DEBUG',
        message: 'Debug mode must be disabled in production',
        severity: 'ERROR',
        category: 'SECURITY'
      });
    }

    // CRITICAL: Ensure logging level is appropriate
    const logLevel = process.env.LOG_LEVEL || 'info';
    const allowedLogLevels = ['error', 'warn'];
    if (!allowedLogLevels.includes(logLevel)) {
      warnings.push({
        variable: 'LOG_LEVEL',
        message: 'Consider using more restrictive log level in production',
        category: 'SECURITY'
      });
    }
  }

  /**
   * CRITICAL: Calculate security level
   */
  private calculateSecurityLevel(
    isProduction: boolean,
    errorsCount: number,
    warningsCount: number
  ): SecurityPosture['securityLevel'] {
    if (errorsCount > 0) {
      return 'CRITICAL';
    }

    if (isProduction && warningsCount > 5) {
      return 'HIGH';
    }

    if (isProduction && warningsCount > 0) {
      return 'MEDIUM';
    }

    if (!isProduction && warningsCount > 10) {
      return 'LOW';
    }

    return 'HIGH';
  }

  /**
   * CRITICAL: Get security posture
   */
  getSecurityPosture(): SecurityPosture | null {
    return this.securityPosture;
  }

  /**
   * CRITICAL: Get variable definition
   */
  getVariableDefinition(name: string): EnvironmentVariableDefinition | undefined {
    return this.definitions.get(name);
  }

  /**
   * CRITICAL: Get all variable definitions
   */
  getAllDefinitions(): Map<string, EnvironmentVariableDefinition> {
    return new Map(this.definitions);
  }

  /**
   * CRITICAL: Initialize environment variable definitions
   */
  private initializeDefinitions(): void {
    // CRITICAL: Security variables
    this.addDefinition({
      name: 'JWT_SECRET',
      required: true,
      description: 'JWT signing secret',
      category: 'SECURITY',
      isSecret: true,
      validationRules: {
        minLength: 32,
        entropy: {
          minBits: 256,
          requireMixedCase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      },
      examples: ['your-super-secret-jwt-key-with-256-bits-entropy']
    });

    this.addDefinition({
      name: 'SESSION_SECRET',
      required: true,
      description: 'Session encryption secret',
      category: 'SECURITY',
      isSecret: true,
      validationRules: {
        minLength: 32,
        entropy: {
          minBits: 256,
          requireMixedCase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      },
      examples: ['your-super-secret-session-key-with-256-bits-entropy']
    });

    this.addDefinition({
      name: 'ENCRYPTION_KEY',
      required: true,
      description: 'Data encryption key',
      category: 'SECURITY',
      isSecret: true,
      validationRules: {
        minLength: 32,
        entropy: {
          minBits: 256,
          requireMixedCase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      },
      examples: ['your-super-secret-encryption-key-with-256-bits-entropy']
    });

    // CRITICAL: Database variables
    this.addDefinition({
      name: 'DATABASE_URL',
      required: true,
      description: 'Database connection string',
      category: 'DATABASE',
      isSecret: true,
      validationRules: {
        pattern: /^postgres:\/\/.+/,
        forbiddenPatterns: [/password=([^&]+)/] // Password should be in connection string but not exposed
      },
      examples: ['postgresql://user:password@localhost:5432/database']
    });

    // CRITICAL: Authentication variables
    this.addDefinition({
      name: 'GOOGLE_CLIENT_ID',
      required: false,
      description: 'Google OAuth client ID',
      category: 'AUTHENTICATION',
      isSecret: false,
      validationRules: {
        pattern: /^[0-9-]+\.apps\.googleusercontent\.com$/,
        minLength: 50
      },
      examples: ['1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com']
    });

    this.addDefinition({
      name: 'GOOGLE_CLIENT_SECRET',
      required: false,
      description: 'Google OAuth client secret',
      category: 'AUTHENTICATION',
      isSecret: true,
      validationRules: {
        minLength: 24,
        forbiddenPatterns: [/test/i, /demo/i, /example/i]
      },
      examples: ['GOCSPX-abcdefghijklmnopqrstuvwxyz123456']
    });

    // CRITICAL: External services
    this.addDefinition({
      name: 'REDIS_URL',
      required: false,
      description: 'Redis connection string',
      category: 'EXTERNAL_SERVICES',
      isSecret: false,
      validationRules: {
        pattern: /^redis:\/\/.+/,
        forbiddenPatterns: [/password=([^&]+)/]
      },
      examples: ['redis://localhost:6379']
    });

    // CRITICAL: Application variables
    this.addDefinition({
      name: 'NODE_ENV',
      required: true,
      description: 'Node.js environment',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        allowedValues: ['development', 'test', 'staging', 'production']
      },
      examples: ['development', 'production']
    });

    this.addDefinition({
      name: 'PORT',
      required: true,
      description: 'Application port',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        pattern: /^[0-9]+$/,
        minLength: 1,
        maxLength: 5
      },
      examples: ['3000', '5000', '8080']
    });

    this.addDefinition({
      name: 'ENFORCE_HTTPS',
      required: true,
      description: 'Enforce HTTPS connections',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        allowedValues: ['true', 'false']
      },
      examples: ['true']
    });

    this.addDefinition({
      name: 'COOKIE_SECURE',
      required: true,
      description: 'Enable secure cookies',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        allowedValues: ['true', 'false']
      },
      examples: ['true']
    });

    this.addDefinition({
      name: 'LOG_LEVEL',
      required: false,
      description: 'Application log level',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        allowedValues: ['error', 'warn', 'info', 'debug']
      },
      examples: ['info', 'error']
    });

    this.addDefinition({
      name: 'DEBUG',
      required: false,
      description: 'Enable debug mode',
      category: 'APPLICATION',
      isSecret: false,
      validationRules: {
        allowedValues: ['true', 'false']
      },
      examples: ['false']
    });
  }

  /**
   * CRITICAL: Add environment variable definition
   */
  private addDefinition(definition: EnvironmentVariableDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  /**
   * CRITICAL: Validate environment and throw if invalid
   */
  static validateOrFail(): void {
    const validator = EnvironmentValidator.getInstance();
    const result = validator.validateAll();

    if (!result.isValid) {
      const errorMessage = [
        'Environment validation failed!',
        '',
        'Errors:',
        ...result.errors.map(error => `  ${error.variable}: ${error.message}`),
        '',
        'Please fix these errors before starting the application.'
      ].join('\n');

      // CRITICAL: Fail fast on validation errors
      throw new Error(errorMessage);
    }
  }

  /**
   * CRITICAL: Get environment variable with validation
   */
  static getValidatedVariable(name: string): string | undefined {
    const validator = EnvironmentValidator.getInstance();
    const definition = validator.getVariableDefinition(name);

    if (!definition) {
      logger.warn('Environment variable not defined in validation rules', { name });
      return process.env[name];
    }

    const value = process.env[name];
    if (!value && definition.required) {
      throw new Error(`Required environment variable ${name} is missing`);
    }

    return value;
  }

  /**
   * CRITICAL: Check if running in production
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * CRITICAL: Get security posture
   */
  static getSecurityPosture(): SecurityPosture | null {
    const validator = EnvironmentValidator.getInstance();
    return validator.getSecurityPosture();
  }
}

/**
 * CRITICAL: Export singleton instance for immediate use
 */
export const environmentValidator = EnvironmentValidator.getInstance();
