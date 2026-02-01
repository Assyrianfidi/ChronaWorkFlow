// CRITICAL: Environment Validation Tests
// MANDATORY: Prove secrets never appear in logs and validation works correctly

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { EnvironmentValidator } from '../env-validator.js';
import { secretRedactor, redact, redactObject, redactError, safeStringify } from '../secret-redaction.js';

describe('Environment Validation and Secret Redaction', () => {
  let originalEnv: NodeJS.ProcessEnv;

  const STRONG_JWT_SECRET = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/`~';
  const STRONG_SESSION_SECRET = 'ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAa9876543210~`/?><.,:;|}{][=-+_)(*&^%$#@!';
  const STRONG_ENCRYPTION_KEY = '0a1b2c3d4e5f6g7h8i9jKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?/`~';

  beforeAll(() => {
    // Store original environment
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('EnvironmentValidator', () => {
    let validator: EnvironmentValidator;

    beforeEach(() => {
      validator = EnvironmentValidator.getInstance();
    });

    it('should validate required environment variables', () => {
      // Set valid environment
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: STRONG_JWT_SECRET,
        SESSION_SECRET: STRONG_SESSION_SECRET,
        ENCRYPTION_KEY: STRONG_ENCRYPTION_KEY,
        DATABASE_URL: 'postgres://user:password@localhost:5432/testdb',
        PORT: '3000',
        ENFORCE_HTTPS: 'true',
        COOKIE_SECURE: 'true'
      };

      const result = validator.validateAll();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing required variables', () => {
      // Set incomplete environment
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: '', // Missing required secret
        PORT: '3000'
      };

      const result = validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const jwtError = result.errors.find(e => e.variable === 'JWT_SECRET');
      expect(jwtError).toBeDefined();
      if (jwtError) {
        expect(jwtError.message).toContain('missing');
      }
    });

    it('should fail on weak secrets', () => {
      // Set weak secrets
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: 'weak', // Too short
        SESSION_SECRET: 'weak',
        ENCRYPTION_KEY: 'weak',
        PORT: '3000',
        ENFORCE_HTTPS: 'true',
        COOKIE_SECURE: 'true'
      };

      const result = validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const jwtError = result.errors.find(e => e.variable === 'JWT_SECRET');
      expect(jwtError).toBeDefined();
      if (jwtError) {
        expect(jwtError.message).toContain('too short');
      }
    });

    it('should fail on default values in production', () => {
      // Set default values in production
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: 'password',
        SESSION_SECRET: 'secret',
        ENCRYPTION_KEY: 'key',
        PORT: '3000',
        ENFORCE_HTTPS: 'true',
        COOKIE_SECURE: 'true'
      };

      const result = validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const jwtError = result.errors.find(e => e.variable === 'JWT_SECRET');
      expect(jwtError).toBeDefined();
      if (jwtError) {
        expect(
          jwtError.message.includes('default/placeholder') || jwtError.message.includes('Value too short')
        ).toBe(true);
      }
    });

    it('should validate allowed values', () => {
      // Set invalid NODE_ENV
      process.env = {
        ...originalEnv,
        NODE_ENV: 'invalid' as any, // Not in allowed values
        JWT_SECRET: 'super-secret-jwt-key-with-256-bits-entropy-ABC123def456',
        PORT: '3000'
      };

      const result = validator.validateAll();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const nodeError = result.errors.find(e => e.variable === 'NODE_ENV');
      expect(nodeError).toBeDefined();
      if (nodeError) {
        expect(nodeError.message).toContain('must be one of');
      }
    });

    it('should calculate security posture correctly', () => {
      // Set valid environment
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: STRONG_JWT_SECRET,
        SESSION_SECRET: STRONG_SESSION_SECRET,
        ENCRYPTION_KEY: STRONG_ENCRYPTION_KEY,
        DATABASE_URL: 'postgres://user:password@localhost:5432/testdb',
        PORT: '3000',
        ENFORCE_HTTPS: 'true',
        COOKIE_SECURE: 'true'
      };

      validator.validateAll();
      const posture = validator.getSecurityPosture();
      
      expect(posture).toBeDefined();
      expect(posture!.environment).toBe('production');
      expect(posture!.isProduction).toBe(true);
      expect(['HIGH', 'MEDIUM']).toContain(posture!.securityLevel);
      expect(posture!.secretsCount).toBeGreaterThan(0);
    });
  });

  describe('SecretRedactor', () => {
    it('should redact JWT secrets', () => {
      const input = 'jwt_secret=super-secret-jwt-key';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe('jwt_secret=[REDACTED]');
      expect(result.secretsDetected).toBe(1);
      expect(result.patternsApplied).toContain('JWT_SECRET');
      expect(result.severity).toBe('HIGH');
    });

    it('should redact multiple secrets', () => {
      const input = 'jwt_secret=secret1&session_secret=secret2&api_key=key123';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe('jwt_secret=[REDACTED]&session_secret=[REDACTED]&api_key=[REDACTED]');
      expect(result.secretsDetected).toBe(3);
      expect(result.patternsApplied).toHaveLength(3);
    });

    it('should redact email addresses', () => {
      const input = 'Contact: user@example.com for support';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe('Contact: [REDACTED EMAIL] for support');
      expect(result.secretsDetected).toBe(1);
      expect(result.patternsApplied).toContain('EMAIL_ADDRESSES');
    });

    it('should redact IP addresses', () => {
      const input = 'Request from 192.168.1.1 at 2023-01-01';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe('Request from [REDACTED IP] at 2023-01-01');
      expect(result.secretsDetected).toBe(1);
      expect(result.patternsApplied).toContain('IP_ADDRESSES');
    });

    it('should redact private keys', () => {
      const input = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe('[REDACTED PRIVATE KEY]');
      expect(result.secretsDetected).toBe(1);
      expect(result.patternsApplied).toContain('PRIVATE_KEY');
      expect(result.severity).toBe('HIGH');
    });

    it('should redact objects recursively', () => {
      const input = {
        user: 'john.doe@example.com',
        config: {
          jwt_secret: 'secret123',
          database_url: 'postgresql://user:password@localhost/db'
        },
        array: ['token1', 'token2']
      };
      
      const result = secretRedactor.redactObject(input);
      
      expect(result.user).toBe('[REDACTED EMAIL]');
      expect(result.config.jwt_secret).toBe('[REDACTED]');
      expect(result.array).toEqual(['[REDACTED TOKEN]', '[REDACTED TOKEN]']);
    });

    it('should redact errors', () => {
      const error = new Error('Authentication failed with jwt_secret=secret123');
      error.stack = 'Error: Authentication failed with jwt_secret=secret123\n    at test.js:1:1';
      
      const redactedError = secretRedactor.redactError(error);
      
      expect(redactedError.message).toBe('Authentication failed with jwt_secret=[REDACTED]');
      expect(redactedError.stack).toContain('jwt_secret=[REDACTED]');
    });

    it('should redact JSON strings', () => {
      const input = '{"user":"john@example.com","token":"secret123"}';
      const result = secretRedactor.redactJSON(input);
      
      expect(result).toBe('{"user":"[REDACTED EMAIL]","token":"[REDACTED TOKEN]"}');
    });

    it('should safe stringify objects', () => {
      const input = {
        user: 'john.doe@example.com',
        secret: 'password123'
      };
      
      const result = safeStringify(input, 2);
      
      expect(result).toContain('[REDACTED EMAIL]');
      expect(result).toContain('[REDACTED SECRET]');
    });

    it('should detect secrets in strings', () => {
      expect(secretRedactor.containsSecrets('normal text')).toBe(false);
      expect(secretRedactor.containsSecrets('jwt_secret=secret')).toBe(true);
      expect(secretRedactor.containsSecrets('user@example.com')).toBe(true);
    });

    it('should cache redaction results', () => {
      const input = 'jwt_secret=secret123';
      
      // First call
      const result1 = secretRedactor.redact(input);
      expect(result1.secretsDetected).toBeGreaterThan(0);
      
      // Second call should use cache
      const result2 = secretRedactor.redact(input);
      expect(result2.secretsDetected).toBeGreaterThan(0);
      
      // Results should be identical
      expect(result1.redacted).toBe(result2.redacted);
    });

    it('should handle empty/null inputs', () => {
      expect(secretRedactor.redact('').redacted).toBe('');
      expect(secretRedactor.redact(null as any).redacted).toBe('');
      expect(secretRedactor.redact(undefined as any).redacted).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should validate environment and redact in combination', () => {
      // Set environment with secrets
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        JWT_SECRET: STRONG_JWT_SECRET,
        SESSION_SECRET: STRONG_SESSION_SECRET,
        ENCRYPTION_KEY: STRONG_ENCRYPTION_KEY,
        DATABASE_URL: 'postgres://user:password@localhost:5432/testdb',
        PORT: '3000',
        ENFORCE_HTTPS: 'true',
        COOKIE_SECURE: 'true'
      };

      // Validate environment
      const validator = EnvironmentValidator.getInstance();
      const validationResult = validator.validateAll();
      expect(validationResult.isValid).toBe(true);

      // Redact validation result (should not contain secrets)
      const safeResult = safeStringify(validationResult);
      expect(safeResult).not.toContain(STRONG_JWT_SECRET);
      expect(safeResult).not.toContain(STRONG_SESSION_SECRET);
      expect(safeResult).not.toContain(STRONG_ENCRYPTION_KEY);
    });

    it('should prevent secrets from appearing in error logs', () => {
      const error = new Error('Database connection failed: jwt_secret=secret123, session_secret=secret456');
      
      // Redact error
      const redactedError = redactError(error);
      
      // Verify secrets are redacted
      expect(redactedError.message).not.toContain('secret123');
      expect(redactedError.message).not.toContain('secret456');
      expect(redactedError.message).toContain('[REDACTED');
      
      // Verify error still contains useful information
      expect(redactedError.message).toContain('Database connection failed');
    });

    it('should handle complex nested objects with secrets', () => {
      const complexObject = {
        request: {
          headers: {
            authorization: 'Bearer token123',
            'x-api-key': 'secret456'
          },
          body: {
            user: 'john@example.com',
            credentials: {
              password: 'password789',
              jwt_secret: 'jwt_secret_abc'
            }
          }
        },
        metadata: {
          database_url: 'postgresql://user:password@localhost/db',
          redis_url: 'redis://localhost:6379'
        }
      };

      const redacted = redactObject(complexObject);
      
      // Verify all secrets are redacted
      expect(redacted.request.headers.authorization).toBe('bearer [REDACTED]');
      expect(redacted.request.headers['x-api-key']).toBe('[REDACTED]');
      expect(redacted.request.body.user).toBe('[REDACTED EMAIL]');
      expect(redacted.request.body.credentials.password).toBe('[REDACTED]');
      expect(redacted.request.body.credentials.jwt_secret).toBe('[REDACTED]');
      expect(redacted.metadata.database_url).toContain('[REDACTED]');
      expect(redacted.metadata.redis_url).toBe('redis://localhost:6379');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malformed secrets gracefully', () => {
      const inputs = [
        'jwt_secret=', // Empty secret
        'jwt_secret=123', // Too short
        'jwt_secret=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // Low entropy
        'jwt_secret=ALLUPPERCASE123', // No lowercase
        'jwt_secret=alllowercase123', // No uppercase
        'jwt_secret=NoNumbersHere', // No numbers
        'jwt_secret=NoSpecialChars123', // No special chars
      ];

      inputs.forEach(input => {
        const result = secretRedactor.redact(input);
        // Should still redact even if weak
        expect(result.redacted).toBe('jwt_secret=[REDACTED]');
      });
    });

    it('should handle very large inputs', () => {
      const largeSecret = 'a'.repeat(10000);
      const input = `jwt_secret=${largeSecret}`;
      
      const result = secretRedactor.redact(input);
      expect(result.redacted).toBe('jwt_secret=[REDACTED]');
      expect(result.secretsDetected).toBe(1);
    });

    it('should handle unicode characters', () => {
      const input = 'user=测试@example.com&secret=密码123';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toContain('[REDACTED');
      expect(result.secretsDetected).toBeGreaterThan(0);
    });

    it('should preserve non-sensitive data', () => {
      const input = 'status=success&count=42&message=Operation completed';
      const result = secretRedactor.redact(input);
      
      expect(result.redacted).toBe(input); // Should remain unchanged
      expect(result.secretsDetected).toBe(0);
    });
  });
});
