// CRITICAL: Secret Redaction Module
// MANDATORY: Prevent secrets from appearing in logs, errors, and stack traces

import { logger } from '../utils/structured-logger.js';
import crypto from 'crypto';

export interface RedactionPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RedactionResult {
  original: string;
  redacted: string;
  patternsApplied: string[];
  secretsDetected: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * CRITICAL: Secret Redactor
 * 
 * This class provides comprehensive secret redaction for all logs,
 * error messages, and stack traces to prevent accidental exposure.
 */
export class SecretRedactor {
  private static instance: SecretRedactor;
  private patterns: RedactionPattern[] = [];
  private cache: Map<string, RedactionResult> = new Map();
  private readonly maxCacheSize = 1000;

  private constructor() {
    this.initializePatterns();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): SecretRedactor {
    if (!SecretRedactor.instance) {
      SecretRedactor.instance = new SecretRedactor();
    }
    return SecretRedactor.instance;
  }

  /**
   * CRITICAL: Redact secrets from string
   */
  redact(input: string): RedactionResult {
    if (!input || typeof input !== 'string') {
      return {
        original: input || '',
        redacted: input || '',
        patternsApplied: [],
        secretsDetected: 0,
        severity: 'LOW'
      };
    }

    // CRITICAL: Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let redacted = input;
    const patternsApplied: string[] = [];
    let secretsDetected = 0;
    let maxSeverity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // CRITICAL: Apply all redaction patterns
    for (const pattern of this.patterns) {
      const matches = redacted.match(pattern.pattern);
      if (matches && matches.length > 0) {
        redacted = redacted.replace(pattern.pattern, pattern.replacement);
        patternsApplied.push(pattern.name);
        secretsDetected += matches.length;
        
        // CRITICAL: Track highest severity
        if (pattern.severity === 'HIGH') {
          maxSeverity = 'HIGH';
        } else if (pattern.severity === 'MEDIUM' && maxSeverity === 'LOW') {
          maxSeverity = 'MEDIUM';
        }
      }
    }

    const result: RedactionResult = {
      original: input,
      redacted,
      patternsApplied,
      secretsDetected,
      severity: maxSeverity
    };

    // CRITICAL: Cache result
    this.cacheResult(cacheKey, result);

    // CRITICAL: Log redaction if secrets were detected
    if (secretsDetected > 0) {
      logger.warn('Secrets detected and redacted', {
        secretsDetected,
        patternsApplied,
        severity: maxSeverity,
        originalLength: input.length,
        redactedLength: redacted.length
      });
    }

    return result;
  }

  /**
   * CRITICAL: Redact secrets from object
   */
  redactObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return this.redact(obj).redacted;
      }
      return obj;
    }

    if (obj instanceof Error) {
      return this.redactError(obj);
    }

    // CRITICAL: Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item));
    }

    // CRITICAL: Handle plain objects
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const k = String(key);
      const lk = k.toLowerCase();

      if (typeof value === 'string') {
        if (lk === 'jwt_secret' || lk === 'jwt-secret' || lk === 'session_secret' || lk === 'session-secret') {
          redacted[key] = '[REDACTED]';
          continue;
        }
        if (lk === 'encryption_key' || lk === 'encryption-key') {
          redacted[key] = '[REDACTED]';
          continue;
        }
        if (lk === 'token' || lk.endsWith('_token') || lk.endsWith('-token')) {
          redacted[key] = '[REDACTED TOKEN]';
          continue;
        }
        if (lk === 'password' || lk.endsWith('_password') || lk.endsWith('-password')) {
          redacted[key] = '[REDACTED]';
          continue;
        }
        if (lk === 'api_key' || lk === 'api-key' || lk === 'x-api-key') {
          redacted[key] = '[REDACTED]';
          continue;
        }
        if (lk === 'database_url' || lk === 'database-url') {
          redacted[key] = value.replace(/:\/\/([^:]+):([^@]+)@/g, '://$1:[REDACTED]@');
          continue;
        }
        if (lk === 'redis_url' || lk === 'redis-url') {
          redacted[key] = this.redact(value).redacted;
          continue;
        }
        if (lk.includes('secret')) {
          redacted[key] = '[REDACTED SECRET]';
          continue;
        }

        redacted[key] = this.redact(value).redacted;
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactObject(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * CRITICAL: Redact secrets from error
   */
  redactError(error: Error): Error {
    const redactedMessage = this.redact(error.message).redacted;
    const redactedStack = error.stack ? this.redact(error.stack).redacted : undefined;

    // CRITICAL: Create new error with redacted information
    const redactedError = new Error(redactedMessage);
    redactedError.stack = redactedStack;
    
    // CRITICAL: Copy other properties
    Object.getOwnPropertyNames(error).forEach(prop => {
      if (prop !== 'message' && prop !== 'stack') {
        const value = (error as any)[prop];
        if (typeof value === 'string') {
          (redactedError as any)[prop] = this.redact(value).redacted;
        } else if (typeof value === 'object') {
          (redactedError as any)[prop] = this.redactObject(value);
        } else {
          (redactedError as any)[prop] = value;
        }
      }
    });

    return redactedError;
  }

  /**
   * CRITICAL: Redact secrets from JSON string
   */
  redactJSON(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      const redacted = this.redactObject(parsed);
      return JSON.stringify(redacted);
    } catch (error) {
      // CRITICAL: If JSON parsing fails, redact the string directly
      return this.redact(jsonString).redacted;
    }
  }

  /**
   * CRITICAL: Safe stringification with redaction
   */
  safeStringify(obj: any, space?: number): string {
    try {
      const redactedObj = this.redactObject(obj);
      return JSON.stringify(redactedObj, null, space);
    } catch (error) {
      // CRITICAL: Fallback to string representation with redaction
      return this.redact(String(obj)).redacted;
    }
  }

  /**
   * CRITICAL: Check if string contains secrets
   */
  containsSecrets(input: string): boolean {
    const result = this.redact(input);
    return result.secretsDetected > 0;
  }

  /**
   * CRITICAL: Get redaction statistics
   */
  getStatistics(): {
    totalRedactions: number;
    patternsUsed: Record<string, number>;
    cacheSize: number;
    severityBreakdown: Record<string, number>;
  } {
    const patternsUsed: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    // CRITICAL: Analyze cache
    for (const result of this.cache.values()) {
      for (const pattern of result.patternsApplied) {
        patternsUsed[pattern] = (patternsUsed[pattern] || 0) + 1;
      }
      severityBreakdown[result.severity]++;
    }

    return {
      totalRedactions: this.cache.size,
      patternsUsed,
      cacheSize: this.cache.size,
      severityBreakdown
    };
  }

  /**
   * CRITICAL: Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Secret redaction cache cleared');
  }

  /**
   * CRITICAL: Add custom redaction pattern
   */
  addPattern(pattern: RedactionPattern): void {
    this.patterns.push(pattern);
    logger.info('Custom redaction pattern added', {
      name: pattern.name,
      severity: pattern.severity
    });
  }

  /**
   * CRITICAL: Remove redaction pattern
   */
  removePattern(name: string): boolean {
    const index = this.patterns.findIndex(p => p.name === name);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      logger.info('Redaction pattern removed', { name });
      return true;
    }
    return false;
  }

  /**
   * CRITICAL: Get all patterns
   */
  getPatterns(): RedactionPattern[] {
    return [...this.patterns];
  }

  /**
   * CRITICAL: Initialize redaction patterns
   */
  private initializePatterns(): void {
    // CRITICAL: High severity patterns - most sensitive
    this.patterns.push({
      name: 'JWT_SECRET',
      pattern: /"?jwt[_-]?secret"?\s*[=:]\s*"?[^"\s&;]*"?/gi,
      replacement: 'jwt_secret=[REDACTED]',
      description: 'JWT signing secrets',
      severity: 'HIGH'
    });

    this.patterns.push({
      name: 'SESSION_SECRET',
      pattern: /"?session[_-]?secret"?\s*[=:]\s*"?[^"\s&;]*"?/gi,
      replacement: 'session_secret=[REDACTED]',
      description: 'Session encryption secrets',
      severity: 'HIGH'
    });

    this.patterns.push({
      name: 'ENCRYPTION_KEY',
      pattern: /"?encryption[_-]?key"?\s*[=:]\s*"?[^"\s&;]*"?/gi,
      replacement: 'encryption_key=[REDACTED]',
      description: 'Data encryption keys',
      severity: 'HIGH'
    });

    this.patterns.push({
      name: 'PRIVATE_KEY',
      pattern: /-----BEGIN\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+PRIVATE\s+KEY-----/gi,
      replacement: '[REDACTED PRIVATE KEY]',
      description: 'Private keys',
      severity: 'HIGH'
    });

    this.patterns.push({
      name: 'API_KEY',
      pattern: /"?api[_-]?key"?\s*[=:]\s*"?[^"\s&;]*"?/gi,
      replacement: 'api_key=[REDACTED]',
      description: 'API keys',
      severity: 'HIGH'
    });

    this.patterns.push({
      name: 'DATABASE_PASSWORD',
      pattern: /"?password"?\s*[=:]\s*"?[^"\s&;]*"?/gi,
      replacement: 'password=[REDACTED]',
      description: 'Database passwords',
      severity: 'HIGH'
    });

    // CRITICAL: Medium severity patterns - sensitive but less critical
    this.patterns.push({
      name: 'AUTH_TOKEN',
      pattern: /bearer\s+[a-zA-Z0-9\-_\.]+/gi,
      replacement: 'bearer [REDACTED]',
      description: 'Bearer tokens',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'TOKEN_STANDALONE',
      pattern: /\btoken[a-zA-Z0-9\-_]*\b/gi,
      replacement: '[REDACTED TOKEN]',
      description: 'Standalone token-like strings',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'GOOGLE_CLIENT_SECRET',
      pattern: /google[_-]?client[_-]?secret[=:]\s*[^\s&;]+/gi,
      replacement: 'google_client_secret=[REDACTED]',
      description: 'Google OAuth client secrets',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'REDIS_PASSWORD',
      pattern: /redis[:@][^\s&;]*password[=:]\s*[^\s&;]+/gi,
      replacement: 'redis://[REDACTED]',
      description: 'Redis passwords',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'EMAIL_ADDRESSES',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      replacement: '[REDACTED EMAIL]',
      description: 'Email addresses',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'IP_ADDRESSES',
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      replacement: '[REDACTED IP]',
      description: 'IP addresses',
      severity: 'MEDIUM'
    });

    // CRITICAL: Low severity patterns - general PII
    this.patterns.push({
      name: 'PHONE_NUMBERS',
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      replacement: '[REDACTED PHONE]',
      description: 'Phone numbers',
      severity: 'LOW'
    });

    this.patterns.push({
      name: 'SSN',
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[REDACTED SSN]',
      description: 'Social Security Numbers',
      severity: 'LOW'
    });

    this.patterns.push({
      name: 'CREDIT_CARD',
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: '[REDACTED CARD]',
      description: 'Credit card numbers',
      severity: 'LOW'
    });

    // CRITICAL: Generic secret patterns
    this.patterns.push({
      name: 'SECRET_GENERIC',
      pattern:
        /(^|[\s"'\{,;&])(?!jwt[_-]?secret\b)(?!session[_-]?secret\b)(?!encryption[_-]?key\b)(?!api[_-]?key\b)[a-zA-Z0-9_-]*secret[a-zA-Z0-9_-]*\b\s*[=:]\s*"?[^"\s&;]*"?/gim,
      replacement: '$1[REDACTED SECRET]',
      description: 'Generic secret patterns',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'TOKEN_GENERIC',
      pattern: /(^|[\s"'\{,;&])[a-zA-Z0-9_-]*token[a-zA-Z0-9_-]*\b\s*[=:]\s*"?[^"\s&;]*"?/gim,
      replacement: '$1[REDACTED TOKEN]',
      description: 'Generic token patterns',
      severity: 'MEDIUM'
    });

    this.patterns.push({
      name: 'KEY_GENERIC',
      pattern: /(^|[\s"'\{,;&])(?!encryption[_-]?key\b)(?!api[_-]?key\b)[a-zA-Z0-9_-]*key[a-zA-Z0-9_-]*\b\s*[=:]\s*"?[^"\s&;]*"?/gim,
      replacement: '$1[REDACTED KEY]',
      description: 'Generic key patterns',
      severity: 'MEDIUM'
    });
  }

  /**
   * CRITICAL: Generate cache key
   */
  private generateCacheKey(input: string): string {
    // CRITICAL: Use hash for cache key to avoid storing full strings
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * CRITICAL: Cache result
   */
  private cacheResult(key: string, result: RedactionResult): void {
    // CRITICAL: Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }
}

/**
 * CRITICAL: Global redactor instance
 */
export const secretRedactor = SecretRedactor.getInstance();

/**
 * CRITICAL: Convenience functions for immediate use
 */
export const redact = (input: string): string => secretRedactor.redact(input).redacted;
export const redactObject = (obj: any): any => secretRedactor.redactObject(obj);
export const redactError = (error: Error): Error => secretRedactor.redactError(error);
export const redactJSON = (jsonString: string): string => secretRedactor.redactJSON(jsonString);
export const safeStringify = (obj: any, space?: number): string => secretRedactor.safeStringify(obj, space);
export const containsSecrets = (input: string): boolean => secretRedactor.containsSecrets(input);

/**
 * CRITICAL: Enhanced console methods with automatic redaction
 */
export const safeConsole = {
  log: (...args: any[]) => {
    const redactedArgs = args.map(arg => 
      typeof arg === 'string' ? redact(arg) : redactObject(arg)
    );
    console.log(...redactedArgs);
  },

  error: (...args: any[]) => {
    const redactedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return redactError(arg);
      }
      return typeof arg === 'string' ? redact(arg) : redactObject(arg);
    });
    console.error(...redactedArgs);
  },

  warn: (...args: any[]) => {
    const redactedArgs = args.map(arg => 
      typeof arg === 'string' ? redact(arg) : redactObject(arg)
    );
    console.warn(...redactedArgs);
  },

  info: (...args: any[]) => {
    const redactedArgs = args.map(arg => 
      typeof arg === 'string' ? redact(arg) : redactObject(arg)
    );
    console.info(...redactedArgs);
  },

  debug: (...args: any[]) => {
    const redactedArgs = args.map(arg => 
      typeof arg === 'string' ? redact(arg) : redactObject(arg)
    );
    console.debug(...redactedArgs);
  }
};
