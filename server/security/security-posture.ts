// CRITICAL: Security Posture Enforcement
// MANDATORY: Enforce secure-by-default production posture

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger.js';
import { environmentValidator } from './env-validator.js';
import { secretRedactor } from './secret-redaction.js';

export interface SecurityPostureConfig {
  enforceHttps: boolean;
  secureCookies: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  securityHeaders: {
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    csp: {
      enabled: boolean;
      policy: string;
    };
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    contentTypeOptions: 'nosniff';
    referrerPolicy: 'strict-origin-when-cross-origin';
    permissionsPolicy: string;
  };
  runtimeFlags: {
    disableEval: boolean;
    disableUnsafeEval: boolean;
    disableUnsafeFragments: boolean;
    disableNodeEnv: boolean;
    disableNodeInspect: boolean;
  };
}

export interface SecurityHeaderResult {
  header: string;
  value: string;
  enforced: boolean;
  category: 'HTTPS' | 'COOKIES' | 'HSTS' | 'CSP' | 'FRAME_OPTIONS' | 'CONTENT_TYPE' | 'REFERRER' | 'PERMISSIONS';
}

export interface SecurityPostureValidation {
  isValid: boolean;
  errors: Array<{
    category: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
  }>;
  warnings: Array<{
    category: string;
    message: string;
  }>;
  enforcedHeaders: SecurityHeaderResult[];
}

/**
 * CRITICAL: Security Posture Manager
 * 
 * This class enforces secure-by-default production posture with
 * HTTPS enforcement, secure cookies, and strict security headers.
 */
export class SecurityPostureManager {
  private static instance: SecurityPostureManager;
  private config: SecurityPostureConfig;
  private isProduction: boolean;
  private validationCache: Map<string, SecurityPostureValidation> = new Map();

  private constructor() {
    this.config = this.loadConfiguration();
    this.isProduction = this.detectProductionEnvironment();
    this.validateConfiguration();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): SecurityPostureManager {
    if (!SecurityPostureManager.instance) {
      SecurityPostureManager.instance = new SecurityPostureManager();
    }
    return SecurityPostureManager.instance;
  }

  /**
   * CRITICAL: Validate security posture
   */
  validatePosture(): SecurityPostureValidation {
    const cacheKey = `${this.isProduction ? 'prod' : 'dev'}_${JSON.stringify(this.config)}`;
    
    const cached = this.validationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const errors: SecurityPostureValidation['errors'] = [];
    const warnings: SecurityPostureValidation['warnings'] = [];
    const enforcedHeaders: SecurityHeaderResult[] = [];

    // CRITICAL: HTTPS enforcement
    if (this.isProduction && this.config.enforceHttps) {
      if (process.env.HTTPS_ENABLED !== 'true') {
        errors.push({
          category: 'HTTPS',
          message: 'HTTPS enforcement is required in production',
          severity: 'ERROR'
        });
      }
    }

    // CRITICAL: Secure cookies validation
    if (this.config.secureCookies.httpOnly !== true) {
      const severity = this.isProduction ? 'ERROR' : 'WARNING';
      errors.push({
        category: 'COOKIES',
        message: 'HttpOnly cookies should be enabled',
        severity
      });
    }

    if (this.isProduction && this.config.secureCookies.secure !== true) {
      errors.push({
        category: 'COOKIES',
        message: 'Secure cookies must be enabled in production',
        severity: 'ERROR' as const
      });
    }

    if (this.config.secureCookies.sameSite !== 'strict') {
      const severity = this.isProduction ? 'WARNING' : 'INFO';
      warnings.push({
        category: 'COOKIES',
        message: 'Consider using SameSite=strict for better security',
        severity
      });
    }

    // CRITICAL: Security headers validation
    if (this.config.securityHeaders.hsts.enabled) {
      if (this.config.securityHeaders.hsts.maxAge < 31536000) { // 1 year minimum
        warnings.push({
          category: 'HSTS',
          message: 'HSTS max-age should be at least 1 year (31536000 seconds)',
          severity: 'WARNING'
        });
      }

      if (!this.config.securityHeaders.hsts.includeSubDomains) {
        warnings.push({
          category: 'HSTS',
          message: 'Consider including subdomains in HSTS',
          severity: 'WARNING'
        });
      }
    }

    if (!this.config.securityHeaders.csp.enabled) {
      const severity = this.isProduction ? 'WARNING' : 'INFO';
      warnings.push({
        category: 'CSP',
        message: 'Content Security Policy should be enabled',
        severity
      });
    }

    if (this.config.securityHeaders.frameOptions !== 'DENY') {
      const severity = this.isProduction ? 'WARNING' : 'INFO';
      warnings.push({
        category: 'FRAME_OPTIONS',
        message: 'Consider using DENY for X-Frame-Options',
        severity
      });
    }

    // CRITICAL: Runtime flags validation
    if (this.config.runtimeFlags.disableEval !== true) {
      errors.push({
        category: 'RUNTIME',
        message: 'Eval must be disabled for security',
        severity: 'ERROR' as const
      });
    }

    if (this.config.runtimeFlags.disableUnsafeEval !== true) {
      errors.push({
        category: 'RUNTIME',
        message: 'Unsafe eval must be disabled for security',
        severity: 'ERROR' as const
      });
    }

    if (this.config.runtimeFlags.disableUnsafeFragments !== true) {
      errors.push({
        category: 'RUNTIME',
        message: 'Unsafe fragments must be disabled for security',
        severity: 'ERROR' as const
      });
    }

    if (this.isProduction && this.config.runtimeFlags.disableNodeEnv !== true) {
      errors.push({
        category: 'RUNTIME',
        message: 'NODE_ENV must be disabled in production',
        severity: 'ERROR' as const
      });
    }

    // CRITICAL: Build enforced headers list
    if (this.config.enforceHttps) {
      enforcedHeaders.push({
        header: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
        enforced: true,
        category: 'HTTPS'
      });
    }

    if (this.config.secureCookies.httpOnly) {
      enforcedHeaders.push({
        header: 'Set-Cookie',
        value: 'HttpOnly; Secure; SameSite=strict',
        enforced: true,
        category: 'COOKIES'
      });
    }

    if (this.config.securityHeaders.hsts.enabled) {
      const hstsValue = [
        `max-age=${this.config.securityHeaders.hsts.maxAge}`,
        this.config.securityHeaders.hsts.includeSubDomains ? 'includeSubDomains' : '',
        this.config.securityHeaders.hsts.preload ? 'preload' : ''
      ].filter(Boolean).join('; ');
      
      enforcedHeaders.push({
        header: 'Strict-Transport-Security',
        value: hstsValue,
        enforced: true,
        category: 'HSTS'
      });
    }

    if (this.config.securityHeaders.csp.enabled) {
      enforcedHeaders.push({
        header: 'Content-Security-Policy',
        value: this.config.securityHeaders.csp.policy,
        enforced: true,
        category: 'CSP'
      });
    }

    enforcedHeaders.push({
      header: 'X-Frame-Options',
      value: this.config.securityHeaders.frameOptions,
      enforced: true,
      category: 'FRAME_OPTIONS'
    });

    enforcedHeaders.push({
      header: 'X-Content-Type-Options',
      value: this.config.securityHeaders.contentTypeOptions,
      enforced: true,
      category: 'CONTENT_TYPE'
    });

    enforcedHeaders.push({
      header: 'Referrer-Policy',
      value: this.config.securityHeaders.referrerPolicy,
      enforced: true,
      category: 'REFERRER'
    });

    if (this.config.securityHeaders.permissionsPolicy) {
      enforcedHeaders.push({
        header: 'Permissions-Policy',
        value: this.config.securityHeaders.permissionsPolicy,
        enforced: true,
        category: 'PERMISSIONS'
      });
    }

      const result: SecurityPostureValidation = {
        isValid: errors.length === 0,
        errors,
        warnings,
        enforcedHeaders
      };

    // CRITICAL: Cache result
    this.validationCache.set(cacheKey, result);

    // CRITICAL: Log validation results
    if (result.isValid) {
      logger.info('Security posture validation passed', {
        environment: this.isProduction ? 'production' : 'development',
        enforcedHeadersCount: result.enforcedHeaders.length,
        warningsCount: warnings.length
      });
    } else {
      logger.error('Security posture validation failed', new Error('SECURITY_POSTURE_VALIDATION_FAILED'), {
        environment: this.isProduction ? 'production' : 'development',
        errorsCount: errors.length,
        warningsCount: warnings.length,
        errors: errors.map(e => ({ category: e.category, message: e.message, severity: e.severity }))
      });
    }

    return result;
  }

  /**
   * CRITICAL: Get security middleware
   */
  getSecurityMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    // CRITICAL: Validate security posture
    const validation = this.validatePosture();
    
    if (!validation.isValid) {
      // CRITICAL: Fail fast on security issues
      return res.status(500).json({
        error: 'Security validation failed',
        message: 'Application security posture is invalid',
        errors: validation.errors
      });
    }

    // CRITICAL: Apply security headers
    validation.enforcedHeaders.forEach(header => {
      res.setHeader(header.header, header.value);
    });

    // CRITICAL: HTTPS enforcement
    if (this.config.enforceHttps && !req.secure) {
      const host = req.get('host');
      const httpsUrl = `https://${host}${req.originalUrl}`;
      
      logger.warn('Redirecting to HTTPS', {
        originalUrl: req.originalUrl,
        httpsUrl
      });
      
      return res.redirect(301, httpsUrl);
    }

    // CRITICAL: Remove sensitive information from request
    this.sanitizeRequest(req);

    next();
  }

  /**
   * CRITICAL: Get security headers for manual application
   */
  getSecurityHeaders(): Record<string, string> {
    const validation = this.validatePosture();
    const headers: Record<string, string> = {};

    validation.enforcedHeaders.forEach(header => {
      headers[header.header] = header.value;
    });

    return headers;
  }

  /**
   * CRITICAL: Get security posture configuration
   */
  getConfiguration(): SecurityPostureConfig {
    return { ...this.config };
  }

  /**
   * CRITICAL: Check if environment is production
   */
  isProductionEnvironment(): boolean {
    return this.isProduction;
  }

  /**
   * CRITICAL: Validate configuration and throw if invalid
   */
  static validateOrFail(): void {
    const manager = SecurityPostureManager.getInstance();
    const validation = manager.validatePosture();

    if (!validation.isValid) {
      const errorMessage = [
        'Security posture validation failed!',
        '',
        'Errors:',
        ...validation.errors.map(error => `  ${error.category}: ${error.message}`),
        '',
        'Please fix these security issues before starting the application.'
      ].join('\n');

      // CRITICAL: Fail fast on security issues
      throw new Error(errorMessage);
    }
  }

  /**
   * CRITICAL: Load configuration from environment
   */
  private loadConfiguration(): SecurityPostureConfig {
    const isProduction = this.detectProductionEnvironment();

    return {
      enforceHttps: this.getEnvBoolean('ENFORCE_HTTPS', isProduction),
      secureCookies: {
        httpOnly: this.getEnvBoolean('COOKIE_HTTP_ONLY', true),
        secure: this.getEnvBoolean('COOKIE_SECURE', isProduction),
        sameSite: (this.getEnvString('COOKIE_SAME_SITE', 'strict') as 'strict' | 'lax' | 'none') || 'strict'
      },
      securityHeaders: {
        hsts: {
          enabled: this.getEnvBoolean('HSTS_ENABLED', isProduction),
          maxAge: this.getEnvNumber('HSTS_MAX_AGE', isProduction ? 31536000 : 86400),
          includeSubDomains: this.getEnvBoolean('HSTS_INCLUDE_SUBDOMAINS', true),
          preload: this.getEnvBoolean('HSTS_PRELOAD', false)
        },
        csp: {
          enabled: this.getEnvBoolean('CSP_ENABLED', false),
          policy: this.getEnvString('CSP_POLICY', this.getDefaultCSP(isProduction))
        },
        frameOptions: (this.getEnvString('X_FRAME_OPTIONS', 'DENY') as 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM') || 'DENY',
        contentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: this.getEnvString('PERMISSIONS_POLICY', '')
      },
      runtimeFlags: {
        disableEval: true,
        disableUnsafeEval: true,
        disableUnsafeFragments: true,
        disableNodeEnv: isProduction,
        disableNodeInspect: isProduction
      }
    };
  }

  /**
   * CRITICAL: Detect if running in production
   */
  private detectProductionEnvironment(): boolean {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    return nodeEnv === 'production';
  }

  /**
   * CRITICAL: Get boolean environment variable
   */
  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * CRITICAL: Get number environment variable
   */
  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * CRITICAL: Get string environment variable
   */
  private getEnvString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * CRITICAL: Get default CSP policy
   */
  private getDefaultCSP(isProduction: boolean): string {
    if (isProduction) {
      return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ');
    } else {
      return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https: ws:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
    }
  }

  /**
   * CRITICAL: Validate configuration
   */
  private validateConfiguration(): void {
    // CRITICAL: Validate configuration consistency
    if (this.config.enforceHttps && !this.config.secureCookies.secure) {
      throw new Error('HTTPS enforcement requires secure cookies');
    }

    if (this.config.securityHeaders.hsts.enabled && !this.config.enforceHttps) {
      throw new Error('HSTS requires HTTPS enforcement');
    }

    // CRITICAL: Validate CSP policy if enabled
    if (this.config.securityHeaders.csp.enabled && !this.config.securityHeaders.csp.policy) {
      throw new Error('CSP enabled but no policy specified');
    }
  }

  /**
   * CRITICAL: Sanitize request to remove sensitive information
   */
  private sanitizeRequest(req: Request): void {
    // CRITICAL: Redact sensitive query parameters
    if (req.url) {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const redactedParams = new URLSearchParams();
      
      for (const [key, value] of url.searchParams) {
        const redacted = secretRedactor.redact(value);
        redactedParams.set(key, redacted.redacted);
      }
      
      url.search = redactedParams.toString();
      req.url = url.toString();
    }

    // CRITICAL: Redact sensitive headers
    if (req.headers.authorization) {
      req.headers.authorization = secretRedactor.redact(req.headers.authorization).redacted;
    }

    if (req.headers.cookie) {
      req.headers.cookie = secretRedactor.redact(req.headers.cookie).redacted;
    }

    // CRITICAL: Redact request body if present
    if ((req as any).body && typeof (req as any).body === 'string') {
      (req as any).body = secretRedactor.redact((req as any).body).redacted;
    }
  }

  /**
   * CRITICAL: Get security posture statistics
   */
  getStatistics(): {
    validationCacheSize: number;
    enforcedHeadersCount: number;
    isProduction: boolean;
    configuration: SecurityPostureConfig;
  } {
    return {
      validationCacheSize: this.validationCache.size,
      enforcedHeadersCount: this.validatePosture().enforcedHeaders.length,
      isProduction: this.isProduction,
      configuration: this.config
    };
  }

  /**
   * CRITICAL: Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    logger.info('Security posture validation cache cleared');
  }
}

/**
 * CRITICAL: Export singleton instance for immediate use
 */
export const securityPostureManager = SecurityPostureManager.getInstance();

export const securityMiddleware = (): ((req: Request, res: Response, next: NextFunction) => unknown) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return securityPostureManager.getSecurityMiddleware()(req, res, next);
  };
};

/**
 * CRITICAL: Convenience function for security headers
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return securityPostureManager.getSecurityHeaders();
};

/**
 * CRITICAL: Convenience function for configuration
 */
export const getSecurityConfiguration = (): SecurityPostureConfig => {
  return securityPostureManager.getConfiguration();
};

/**
 * CRITICAL: Check if running in production
 */
export const isProduction = (): boolean => {
  return securityPostureManager.isProductionEnvironment();
};
