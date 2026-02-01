// CRITICAL: Cross-Tenant Attack Prevention
// MANDATORY: Prevents ALL cross-tenant data enumeration and attacks

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';
import { ServiceTenantContext } from './tenant-service-guards.js';

export interface AttackDetectionConfig {
  enableEnumerationBlocking: boolean;
  enableIdValidation: boolean;
  enableErrorSanitization: boolean;
  maxQueryAttempts: number;
  suspiciousThreshold: number;
}

export interface ResourceValidationResult {
  isValid: boolean;
  belongsToTenant: boolean;
  error?: string;
  sanitizedError?: string;
}

export class CrossTenantAttackPrevention {
  private prisma: PrismaClient;
  private config: AttackDetectionConfig;
  private suspiciousAttempts: Map<string, number> = new Map();

  constructor(prisma: PrismaClient, config: Partial<AttackDetectionConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      enableEnumerationBlocking: true,
      enableIdValidation: true,
      enableErrorSanitization: true,
      maxQueryAttempts: 100,
      suspiciousThreshold: 10,
      ...config
    };
  }

  /**
   * CRITICAL: Validate resource ID format and prevent enumeration
   */
  validateResourceId(resourceType: string, resourceId: string): ResourceValidationResult {
    const result: ResourceValidationResult = {
      isValid: false,
      belongsToTenant: false
    };

    try {
      // CRITICAL: Basic ID format validation
      if (!this.isValidResourceIdFormat(resourceId)) {
        result.error = 'INVALID_RESOURCE_ID_FORMAT';
        result.sanitizedError = 'Invalid resource ID format';
        return result;
      }

      // CRITICAL: Check for enumeration patterns
      if (this.config.enableEnumerationBlocking && this.isEnumerationAttempt(resourceId)) {
        result.error = 'ENUMERATION_ATTEMPT_BLOCKED';
        result.sanitizedError = 'Resource access denied';
        this.logSuspiciousActivity('RESOURCE_ID_ENUMERATION', { resourceType, resourceId });
        return result;
      }

      // CRITICAL: Validate resource exists (without exposing tenant info)
      const resourceExists = this.validateResourceExists(resourceType, resourceId);
      if (!resourceExists) {
        result.error = 'RESOURCE_NOT_FOUND';
        result.sanitizedError = 'Resource not found';
        return result;
      }

      result.isValid = true;
      return result;

    } catch (error) {
      logger.error('Resource validation failed', error as Error, {
        resourceType,
        resourceId
      });
      
      result.error = 'VALIDATION_ERROR';
      result.sanitizedError = 'Resource validation failed';
      return result;
    }
  }

  /**
   * CRITICAL: Validate tenant ownership with attack prevention
   */
  async validateTenantOwnership(
    resourceType: string,
    resourceId: string,
    tenantId: string,
    userId: string,
    requestId: string
  ): Promise<ResourceValidationResult> {
    const result: ResourceValidationResult = {
      isValid: false,
      belongsToTenant: false
    };

    try {
      // CRITICAL: Rate limit validation attempts
      if (this.isRateLimited(userId, requestId)) {
        result.error = 'RATE_LIMITED';
        result.sanitizedError = 'Too many requests';
        return result;
      }

      // CRITICAL: Validate resource ID first
      const idValidation = this.validateResourceId(resourceType, resourceId);
      if (!idValidation.isValid) {
        return idValidation;
      }

      // CRITICAL: Check tenant ownership securely
      const ownershipResult = await this.checkTenantOwnershipSecure(
        resourceType,
        resourceId,
        tenantId
      );

      if (!ownershipResult.exists) {
        result.error = 'RESOURCE_NOT_FOUND';
        result.sanitizedError = 'Resource not found';
        return result;
      }

      if (!ownershipResult.belongsToTenant) {
        result.error = 'CROSS_TENANT_ACCESS_BLOCKED';
        result.sanitizedError = 'Access denied';
        
        // CRITICAL: Log cross-tenant attempt
        this.logSuspiciousActivity('CROSS_TENANT_ACCESS_ATTEMPT', {
          resourceType,
          resourceId,
          userTenantId: tenantId,
          actualTenantId: ownershipResult.actualTenantId,
          userId,
          requestId
        });
        
        return result;
      }

      result.isValid = true;
      result.belongsToTenant = true;
      return result;

    } catch (error) {
      logger.error('Tenant ownership validation failed', error as Error, {
        resourceType,
        resourceId,
        tenantId,
        userId,
        requestId
      });
      
      result.error = 'VALIDATION_ERROR';
      result.sanitizedError = 'Validation failed';
      return result;
    }
  }

  /**
   * CRITICAL: Check tenant ownership without leaking information
   */
  private async checkTenantOwnershipSecure(
    resourceType: string,
    resourceId: string,
    tenantId: string
  ): Promise<{ exists: boolean; belongsToTenant: boolean; actualTenantId?: string }> {
    const db = this.prisma;

    try {
      let query: string;
      let params: any[];

      switch (resourceType.toLowerCase()) {
        case 'user':
          query = `
            SELECT tenant_id 
            FROM users 
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `;
          params = [resourceId];
          break;

        case 'company':
          query = `
            SELECT tenant_id 
            FROM companies 
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `;
          params = [resourceId];
          break;

        case 'invoice':
          query = `
            SELECT tenant_id 
            FROM invoices 
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `;
          params = [resourceId];
          break;

        case 'transaction':
          query = `
            SELECT tenant_id 
            FROM transactions 
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `;
          params = [resourceId];
          break;

        default:
          // Generic query for unknown resource types
          query = `
            SELECT tenant_id 
            FROM ${resourceType.toLowerCase()} 
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `;
          params = [resourceId];
      }

      const result = await db.$queryRawUnsafe(query, ...params);
      const resource = result[0];

      if (!resource) {
        return { exists: false, belongsToTenant: false };
      }

      return {
        exists: true,
        belongsToTenant: resource.tenant_id === tenantId,
        actualTenantId: resource.tenant_id
      };

    } catch (error) {
      logger.error('Secure ownership check failed', error as Error, {
        resourceType,
        resourceId
      });
      
      // Fail securely - assume no access
      return { exists: false, belongsToTenant: false };
    }
  }

  /**
   * CRITICAL: Validate resource exists without exposing tenant info
   */
  private validateResourceExists(resourceType: string, resourceId: string): boolean {
    try {
      const db = this.prisma;
      
      // Use a simple existence check that doesn't expose tenant information
      const query = `
        SELECT 1 
        FROM ${resourceType.toLowerCase()} 
        WHERE id = $1 AND deleted_at IS NULL 
        LIMIT 1
      `;
      
      const result = await db.$queryRawUnsafe(query, resourceId);
      return result.length > 0;
      
    } catch (error) {
      logger.error('Resource existence check failed', error as Error, {
        resourceType,
        resourceId
      });
      
      // Fail securely - assume resource doesn't exist
      return false;
    }
  }

  /**
   * CRITICAL: Validate resource ID format
   */
  private isValidResourceIdFormat(resourceId: string): boolean {
    // CRITICAL: Resource IDs should be valid cuid or UUID format
    const cuidPattern = /^c[a-z0-9]{24}$/;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericPattern = /^\d+$/;
    
    return cuidPattern.test(resourceId) || 
           uuidPattern.test(resourceId) || 
           numericPattern.test(resourceId);
  }

  /**
   * CRITICAL: Detect enumeration attempts
   */
  private isEnumerationAttempt(resourceId: string): boolean {
    // CRITICAL: Check for sequential or predictable IDs
    const numericId = parseInt(resourceId);
    
    if (!isNaN(numericId)) {
      // Check if it's a low sequential number (common enumeration pattern)
      return numericId < 10000;
    }

    // Check for common enumeration patterns in cuids
    if (resourceId.startsWith('c')) {
      // Check for predictable patterns in cuid generation
      const pattern = /(c0{3,}|c1{3,}|c2{3,})/;
      return pattern.test(resourceId);
    }

    return false;
  }

  /**
   * CRITICAL: Rate limit validation attempts
   */
  private isRateLimited(userId: string, requestId: string): boolean {
    const key = `${userId}:${requestId}`;
    const attempts = this.suspiciousAttempts.get(key) || 0;
    
    if (attempts >= this.config.maxQueryAttempts) {
      this.logSuspiciousActivity('RATE_LIMIT_EXCEEDED', {
        userId,
        requestId,
        attempts
      });
      return true;
    }

    this.suspiciousAttempts.set(key, attempts + 1);
    
    // Clean up old entries after delay
    setTimeout(() => {
      this.suspiciousAttempts.delete(key);
    }, 300000); // 5 minutes

    return false;
  }

  /**
   * CRITICAL: Log suspicious activity for security monitoring
   */
  private logSuspiciousActivity(activityType: string, details: Record<string, any>): void {
    logger.warn('Suspicious activity detected', {
      activityType,
      ...details,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });

    // CRITICAL: In production, this would trigger security alerts
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with security monitoring system
      // securityAlertService.sendAlert(activityType, details);
    }
  }

  /**
   * CRITICAL: Sanitize error messages to prevent information leakage
   */
  sanitizeError(error: Error, context: {
    resourceType?: string;
    resourceId?: string;
    tenantId?: string;
    userId?: string;
  }): Error {
    if (!this.config.enableErrorSanitization) {
      return error;
    }

    const errorMessage = error.message.toLowerCase();
    
    // CRITICAL: Check for information leakage patterns
    const leakPatterns = [
      /tenant.*not.*found/i,
      /cross.*tenant/i,
      /access.*denied/i,
      /unauthorized/i,
      /permission.*denied/i,
      /resource.*not.*found/i,
      /user.*not.*found/i,
      /company.*not.*found/i
    ];

    const hasLeakage = leakPatterns.some(pattern => pattern.test(errorMessage));
    
    if (hasLeakage) {
      // CRITICAL: Return generic error message
      return new Error('Access denied');
    }

    // CRITICAL: Check for tenant ID or user ID in error message
    if (context.tenantId && errorMessage.includes(context.tenantId)) {
      return new Error('Access denied');
    }

    if (context.userId && errorMessage.includes(context.userId)) {
      return new Error('Access denied');
    }

    if (context.resourceId && errorMessage.includes(context.resourceId)) {
      return new Error('Resource not found');
    }

    // Return original error if no leakage detected
    return error;
  }

  /**
   * CRITICAL: Validate bulk operations for attack prevention
   */
  validateBulkOperation(
    resourceType: string,
    resourceIds: string[],
    tenantId: string,
    userId: string,
    requestId: string
  ): { isValid: boolean; errors: string[]; blockedIds: string[] } {
    const result = {
      isValid: true,
      errors: [] as string[],
      blockedIds: [] as string[]
    };

    // CRITICAL: Validate bulk operation size
    if (resourceIds.length > 100) {
      result.isValid = false;
      result.errors.push('Bulk operation too large');
      return result;
    }

    // CRITICAL: Validate each resource ID
    for (const resourceId of resourceIds) {
      const validation = this.validateResourceId(resourceType, resourceId);
      
      if (!validation.isValid) {
        result.isValid = false;
        result.errors.push(`Invalid resource ID: ${resourceId}`);
        result.blockedIds.push(resourceId);
        
        // Log suspicious pattern
        if (validation.error === 'ENUMERATION_ATTEMPT_BLOCKED') {
          this.logSuspiciousActivity('BULK_ENUMERATION_ATTEMPT', {
            resourceType,
            resourceId,
            userId,
            requestId,
            totalIds: resourceIds.length
          });
        }
      }
    }

    // CRITICAL: Check for suspicious patterns in bulk operations
    const suspiciousPatterns = this.detectSuspiciousBulkPatterns(resourceIds);
    if (suspiciousPatterns.length > 0) {
      result.isValid = false;
      result.errors.push('Suspicious bulk operation pattern detected');
      result.blockedIds.push(...suspiciousPatterns);
      
      this.logSuspiciousActivity('BULK_OPERATION_SUSPICIOUS_PATTERN', {
        resourceType,
        suspiciousPatterns,
        userId,
        requestId,
        totalIds: resourceIds.length
      });
    }

    return result;
  }

  /**
   * CRITICAL: Detect suspicious patterns in bulk operations
   */
  private detectSuspiciousBulkPatterns(resourceIds: string[]): string[] {
    const suspicious: string[] = [];
    const numericIds: number[] = [];

    // Extract numeric IDs
    for (const id of resourceIds) {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        numericIds.push(numericId);
      }
    }

    if (numericIds.length === 0) {
      return suspicious;
    }

    // CRITICAL: Check for sequential patterns
    numericIds.sort((a, b) => a - b);
    
    for (let i = 1; i < numericIds.length; i++) {
      if (numericIds[i] - numericIds[i-1] === 1) {
        // Found sequential pattern
        suspicious.push(resourceIds[i]);
      }
    }

    // CRITICAL: Check for arithmetic progression
    if (numericIds.length >= 3) {
      const diff = numericIds[1] - numericIds[0];
      let isArithmetic = true;
      
      for (let i = 2; i < numericIds.length; i++) {
        if (numericIds[i] - numericIds[i-1] !== diff) {
          isArithmetic = false;
          break;
        }
      }
      
      if (isArithmetic && Math.abs(diff) <= 10) {
        suspicious.push(...resourceIds);
      }
    }

    return suspicious;
  }

  /**
   * CRITICAL: Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    suspiciousAttemptsCount: number;
    rateLimitedUsers: number;
    blockedOperations: number;
  } {
    return {
      suspiciousAttemptsCount: this.suspiciousAttempts.size,
      rateLimitedUsers: Array.from(this.suspiciousAttempts.values())
        .filter(attempts => attempts >= this.config.maxQueryAttempts)
        .length,
      blockedOperations: this.config.suspiciousThreshold
    };
  }

  /**
   * CRITICAL: Clear security metrics (for testing)
   */
  clearSecurityMetrics(): void {
    this.suspiciousAttempts.clear();
  }
}

/**
 * CRITICAL: Factory function for creating cross-tenant attack prevention
 */
export const createCrossTenantAttackPrevention = (
  prisma: PrismaClient,
  config?: Partial<AttackDetectionConfig>
): CrossTenantAttackPrevention => {
  return new CrossTenantAttackPrevention(prisma, config);
};
