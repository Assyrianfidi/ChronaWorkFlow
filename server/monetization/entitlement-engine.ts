// CRITICAL: Entitlement Engine - Runtime Feature Enforcement
// MANDATORY: Zero-trust entitlement validation with audit trails

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { productTiersManager, ProductTier, FeatureDefinition } from './product-tiers.js';
import { governanceModelManager } from '../governance/governance-model.js';
import * as crypto from 'crypto';

export type EntitlementStatus = 'GRANTED' | 'DENIED' | 'LIMITED' | 'COMPLIANCE_REQUIRED' | 'UPGRADE_REQUIRED';
export type EnforcementAction = 'ALLOW' | 'BLOCK' | 'THROTTLE' | 'WARN' | 'UPGRADE_PROMPT';
export type CacheLevel = 'NONE' | 'MEMORY' | 'REDIS' | 'DISTRIBUTED';

export interface EntitlementCheck {
  tenantId: string;
  userId: string;
  featureId: string;
  tier: ProductTier;
  context: Record<string, any>;
  timestamp: Date;
  requestId: string;
  correlationId: string;
}

export interface EntitlementResult {
  status: EntitlementStatus;
  action: EnforcementAction;
  granted: boolean;
  reason: string;
  limits?: {
    current: number;
    maximum: number | string;
    resetDate?: Date;
  };
  compliance?: {
    required: string[];
    missing: string[];
    blocking: boolean;
  };
  upgrade?: {
    currentTier: ProductTier;
    requiredTier: ProductTier;
    features: string[];
    pricing: {
      monthly: number;
      annual: number;
    };
  };
  metadata: {
    checkDuration: number;
    cacheHit: boolean;
    enforcementLevel: string;
    auditLogged: boolean;
  };
}

export interface EntitlementCache {
  key: string;
  result: EntitlementResult;
  expiresAt: Date;
  tier: ProductTier;
  lastUpdated: Date;
}

export interface FeatureUsage {
  tenantId: string;
  featureId: string;
  currentUsage: number;
  periodStart: Date;
  periodEnd: Date;
  limit: number | string;
  resetSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  lastReset: Date;
}

/**
 * CRITICAL: Entitlement Engine
 * 
 * Provides runtime entitlement validation with zero-trust security model.
 * Enforces feature access, limits, and compliance requirements with audit trails.
 */
export class EntitlementEngine {
  private static instance: EntitlementEngine;
  private auditLogger: any;
  private cache: Map<string, EntitlementCache> = new Map();
  private usage: Map<string, FeatureUsage> = new Map();
  private cacheLevel: CacheLevel = 'MEMORY';
  private cacheExpiry = 300; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.startPeriodicCleanup();
  }

  static getInstance(): EntitlementEngine {
    if (!EntitlementEngine.instance) {
      EntitlementEngine.instance = new EntitlementEngine();
    }
    return EntitlementEngine.instance;
  }

  /**
   * CRITICAL: Check feature entitlement
   */
  async checkEntitlement(check: EntitlementCheck): Promise<EntitlementResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(check);

    try {
      // CRITICAL: Check cache first
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        cachedResult.metadata.cacheHit = true;
        cachedResult.metadata.checkDuration = Date.now() - startTime;
        
        return cachedResult;
      }

      // CRITICAL: Perform entitlement check
      const result = await this.performEntitlementCheck(check);
      
      // CRITICAL: Cache result
      this.setCache(cacheKey, result);
      
      // CRITICAL: Log audit trail
      await this.logEntitlementCheck(check, result);

      result.metadata.checkDuration = Date.now() - startTime;
      result.metadata.cacheHit = false;

      return result;

    } catch (error) {
      logger.error('Entitlement check failed', {
        tenantId: check.tenantId,
        featureId: check.featureId,
        error: (error as Error).message
      });

      // CRITICAL: Fail secure - deny access on errors
      const failSecureResult: EntitlementResult = {
        status: 'DENIED',
        action: 'BLOCK',
        granted: false,
        reason: 'System error - access denied for security',
        metadata: {
          checkDuration: Date.now() - startTime,
          cacheHit: false,
          enforcementLevel: 'FAIL_SECURE',
          auditLogged: true
        }
      };

      await this.logEntitlementCheck(check, failSecureResult);
      return failSecureResult;
    }
  }

  /**
   * CRITICAL: Check feature usage against limits
   */
  async checkUsageLimit(
    tenantId: string,
    featureId: string,
    tier: ProductTier,
    increment: number = 1
  ): Promise<{
    allowed: boolean;
    currentUsage: number;
    limit: number | string;
    resetDate?: Date;
    blocked: boolean;
  }> {
    const usageKey = `${tenantId}_${featureId}`;
    const limit = productTiersManager.getFeatureLimit(tier, featureId, 'usage') as number;
    
    if (limit === -1 || typeof limit === 'string') {
      return { allowed: true, currentUsage: 0, limit, blocked: false };
    }

    let usage = this.usage.get(usageKey);
    const now = new Date();

    if (!usage || this.shouldResetUsage(usage, now)) {
      usage = {
        tenantId,
        featureId,
        currentUsage: 0,
        periodStart: now,
        periodEnd: this.calculatePeriodEnd(now, 'MONTHLY'),
        limit,
        resetSchedule: 'MONTHLY',
        lastReset: now
      };
      this.usage.set(usageKey, usage);
    }

    const newUsage = usage.currentUsage + increment;
    const allowed = newUsage <= limit;
    const blocked = !allowed;

    if (allowed) {
      usage.currentUsage = newUsage;
    }

    return {
      allowed,
      currentUsage: usage.currentUsage,
      limit,
      resetDate: usage.periodEnd,
      blocked
    };
  }

  /**
   * CRITICAL: Validate compliance requirements
   */
  async validateComplianceRequirements(
    tenantId: string,
    featureId: string,
    tier: ProductTier
  ): Promise<{
    compliant: boolean;
    required: string[];
    missing: string[];
    blocking: boolean;
  }> {
    const feature = productTiersManager.getFeature(featureId);
    if (!feature || !feature.complianceRequired) {
      return { compliant: true, required: [], missing: [], blocking: false };
    }

    const tierCompliance = productTiersManager.getComplianceRequirements(tier);
    const required = feature.complianceRequired;
    const missing = required.filter(f => !tierCompliance.included.includes(f));
    const blocking = missing.length > 0 && feature.enforcementLevel === 'COMPLIANCE';

    return {
      compliant: missing.length === 0,
      required,
      missing,
      blocking
    };
  }

  /**
   * CRITICAL: Get upgrade recommendations
   */
  getUpgradeRecommendation(
    currentTier: ProductTier,
    featureId: string
  ): EntitlementResult['upgrade'] | null {
    const feature = productTiersManager.getFeature(featureId);
    if (!feature) return null;

    // Find the lowest tier that includes this feature
    const tiers: ProductTier[] = ['STARTER', 'PRO', 'ENTERPRISE'];
    
    for (const tier of tiers) {
      if (productTiersManager.hasFeatureEntitlement(tier, featureId)) {
        const pricing = productTiersManager.calculateTierPricing(tier, 'MONTHLY');
        
        return {
          currentTier,
          requiredTier: tier,
          features: [featureId],
          pricing: {
            monthly: pricing.basePrice,
            annual: productTiersManager.calculateTierPricing(tier, 'ANNUAL').basePrice
          }
        };
      }
    }

    return null;
  }

  /**
   * CRITICAL: Clear cache for tenant
   */
  clearTenantCache(tenantId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, cache] of this.cache.entries()) {
      if (key.includes(tenantId)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    logger.info('Tenant cache cleared', {
      tenantId,
      entriesCleared: keysToDelete.length
    });
  }

  /**
   * CRITICAL: Get entitlement statistics
   */
  getEntitlementStatistics(): {
    cacheSize: number;
    usageTracking: number;
    checksPerformed: number;
    averageResponseTime: number;
    cacheHitRate: number;
    denialRate: number;
  } {
    const cacheSize = this.cache.size;
    const usageTracking = this.usage.size;
    
    // In a real implementation, track these metrics over time
    return {
      cacheSize,
      usageTracking,
      checksPerformed: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      denialRate: 0
    };
  }

  /**
   * CRITICAL: Perform entitlement check
   */
  private async performEntitlementCheck(check: EntitlementCheck): Promise<EntitlementResult> {
    const feature = productTiersManager.getFeature(check.featureId);
    if (!feature) {
      return {
        status: 'DENIED',
        action: 'BLOCK',
        granted: false,
        reason: 'Feature not found',
        metadata: {
          checkDuration: 0,
          cacheHit: false,
          enforcementLevel: 'HARD',
          auditLogged: false
        }
      };
    }

    // CRITICAL: Check basic entitlement
    const hasEntitlement = productTiersManager.hasFeatureEntitlement(check.tier, check.featureId);
    if (!hasEntitlement) {
      const upgrade = this.getUpgradeRecommendation(check.tier, check.featureId);
      
      return {
        status: 'UPGRADE_REQUIRED',
        action: 'UPGRADE_PROMPT',
        granted: false,
        reason: `Feature not available in ${check.tier} tier`,
        upgrade,
        metadata: {
          checkDuration: 0,
          cacheHit: false,
          enforcementLevel: feature.enforcementLevel,
          auditLogged: false
        }
      };
    }

    // CRITICAL: Check compliance requirements
    const compliance = await this.validateComplianceRequirements(
      check.tenantId,
      check.featureId,
      check.tier
    );

    if (compliance.blocking) {
      return {
        status: 'COMPLIANCE_REQUIRED',
        action: 'BLOCK',
        granted: false,
        reason: `Compliance requirements not met: ${compliance.missing.join(', ')}`,
        compliance: {
          required: compliance.required,
          missing: compliance.missing,
          blocking: compliance.blocking
        },
        metadata: {
          checkDuration: 0,
          cacheHit: false,
          enforcementLevel: 'COMPLIANCE',
          auditLogged: false
        }
      };
    }

    // CRITICAL: Check usage limits
    if (feature.type === 'LIMITED') {
      const usage = await this.checkUsageLimit(check.tenantId, check.featureId, check.tier, 0);
      
      if (usage.blocked) {
        return {
          status: 'LIMITED',
          action: 'THROTTLE',
          granted: false,
          reason: `Usage limit exceeded: ${usage.currentUsage}/${usage.limit}`,
          limits: {
            current: usage.currentUsage,
            maximum: usage.limit,
            resetDate: usage.resetDate
          },
          metadata: {
            checkDuration: 0,
            cacheHit: false,
            enforcementLevel: feature.enforcementLevel,
            auditLogged: false
          }
        };
      }
    }

    // CRITICAL: Entitlement granted
    return {
      status: 'GRANTED',
      action: 'ALLOW',
      granted: true,
      reason: 'Access granted',
      metadata: {
        checkDuration: 0,
        cacheHit: false,
        enforcementLevel: feature.enforcementLevel,
        auditLogged: false
      }
    };
  }

  /**
   * CRITICAL: Get from cache
   */
  private getFromCache(key: string): EntitlementResult | null {
    if (this.cacheLevel === 'NONE') return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (new Date() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * CRITICAL: Set cache
   */
  private setCache(key: string, result: EntitlementResult): void {
    if (this.cacheLevel === 'NONE') return;

    const cache: EntitlementCache = {
      key,
      result,
      expiresAt: new Date(Date.now() + (this.cacheExpiry * 1000)),
      tier: 'STARTER', // Would be extracted from context
      lastUpdated: new Date()
    };

    this.cache.set(key, cache);
  }

  /**
   * CRITICAL: Generate cache key
   */
  private generateCacheKey(check: EntitlementCheck): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${check.tenantId}_${check.userId}_${check.featureId}_${check.tier}`);
    return hash.digest('hex');
  }

  /**
   * CRITICAL: Log entitlement check
   */
  private async logEntitlementCheck(check: EntitlementCheck, result: EntitlementResult): Promise<void> {
    try {
      this.auditLogger.logAuthorizationDecision({
        tenantId: check.tenantId,
        actorId: check.userId,
        action: 'FEATURE_ACCESS_CHECK',
        resourceType: 'FEATURE',
        resourceId: check.featureId,
        outcome: result.granted ? 'SUCCESS' : 'FAILURE',
        correlationId: check.correlationId,
        metadata: {
          tier: check.tier,
          status: result.status,
          action: result.action,
          reason: result.reason,
          enforcementLevel: result.metadata.enforcementLevel
        }
      });

      result.metadata.auditLogged = true;
    } catch (error) {
      logger.error('Failed to log entitlement check', {
        tenantId: check.tenantId,
        featureId: check.featureId,
        error: (error as Error).message
      });
    }
  }

  /**
   * CRITICAL: Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
      this.resetUsageCounters();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Cleanup expired cache
   */
  private cleanupExpiredCache(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, cache] of this.cache.entries()) {
      if (now > cache.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      logger.debug('Expired cache entries cleaned up', {
        entriesCleaned: keysToDelete.length
      });
    }
  }

  /**
   * CRITICAL: Reset usage counters
   */
  private resetUsageCounters(): void {
    const now = new Date();
    const keysToReset: string[] = [];

    for (const [key, usage] of this.usage.entries()) {
      if (this.shouldResetUsage(usage, now)) {
        keysToReset.push(key);
      }
    }

    for (const key of keysToReset) {
      const usage = this.usage.get(key);
      if (usage) {
        usage.currentUsage = 0;
        usage.lastReset = now;
        usage.periodStart = now;
        usage.periodEnd = this.calculatePeriodEnd(now, usage.resetSchedule);
      }
    }

    if (keysToReset.length > 0) {
      logger.debug('Usage counters reset', {
        countersReset: keysToReset.length
      });
    }
  }

  /**
   * CRITICAL: Check if usage should be reset
   */
  private shouldResetUsage(usage: FeatureUsage, now: Date): boolean {
    return now > usage.periodEnd;
  }

  /**
   * CRITICAL: Calculate period end
   */
  private calculatePeriodEnd(start: Date, schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Date {
    const end = new Date(start);

    switch (schedule) {
      case 'DAILY':
        end.setDate(end.getDate() + 1);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 7);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'YEARLY':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return end;
  }
}

/**
 * CRITICAL: Global entitlement engine instance
 */
export const entitlementEngine = EntitlementEngine.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const checkFeatureEntitlement = async (
  tenantId: string,
  userId: string,
  featureId: string,
  tier: ProductTier,
  context: Record<string, any> = {}
): Promise<EntitlementResult> => {
  const check: EntitlementCheck = {
    tenantId,
    userId,
    featureId,
    tier,
    context,
    timestamp: new Date(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID()
  };

  return entitlementEngine.checkEntitlement(check);
};

export const checkUsageLimit = async (
  tenantId: string,
  featureId: string,
  tier: ProductTier,
  increment: number = 1
) => {
  return entitlementEngine.checkUsageLimit(tenantId, featureId, tier, increment);
};
