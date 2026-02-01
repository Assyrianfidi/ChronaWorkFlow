// CRITICAL: Tenant-Scoped Feature Flags
// MANDATORY: Database-backed feature flags with strict tenant isolation

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: 'SECURITY' | 'COMPLIANCE' | 'OPERATIONS' | 'INTEGRATIONS' | 'UI' | 'API';
  defaultValue: boolean;
  isGlobal: boolean;
  requiredPermissions: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantFeatureFlag {
  id: string;
  tenantId: string;
  flagId: string;
  enabled: boolean;
  enabledAt?: Date;
  enabledBy?: string;
  disabledAt?: Date;
  disabledBy?: string;
  reason?: string;
  correlationId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCheckResult {
  flagName: string;
  enabled: boolean;
  source: 'DEFAULT' | 'TENANT' | 'GLOBAL';
  tenantId: string;
  cached: boolean;
  metadata?: Record<string, any>;
}

export interface FeatureFlagChangeRequest {
  tenantId: string;
  flagName: string;
  enabled: boolean;
  reason: string;
  correlationId: string;
  requestedBy: string;
}

/**
 * CRITICAL: Feature Flag Manager
 * 
 * This class manages tenant-scoped feature flags with strict isolation,
 * caching, and comprehensive audit logging.
 */
export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private prisma: PrismaClient;
  private auditLogger: any;
  private flagCache: Map<string, FeatureFlag> = new Map();
  private tenantFlagCache: Map<string, Map<string, boolean>> = new Map();
  private cacheTimeoutMs = 300000; // 5 minutes
  private lastCacheRefresh: Map<string, Date> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogger = getImmutableAuditLogger(prisma);
    this.initializeDefaultFlags();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(prisma?: PrismaClient): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      if (!prisma) {
        throw new Error('Prisma client required for first initialization');
      }
      FeatureFlagManager.instance = new FeatureFlagManager(prisma);
    }
    return FeatureFlagManager.instance;
  }

  /**
   * CRITICAL: Check if feature flag is enabled for tenant
   */
  async isFeatureEnabled(
    flagName: string,
    tenantContext: TenantContext
  ): Promise<FeatureFlagCheckResult> {
    const startTime = Date.now();
    
    try {
      // CRITICAL: Get flag definition
      const flag = await this.getFlagDefinition(flagName);
      if (!flag) {
        logger.warn('Feature flag not found', { flagName, tenantId: tenantContext.tenantId });
        return {
          flagName,
          enabled: false,
          source: 'DEFAULT',
          tenantId: tenantContext.tenantId,
          cached: false
        };
      }

      // CRITICAL: Check cache first
      const cacheKey = `${tenantContext.tenantId}:${flagName}`;
      const cached = this.getCachedValue(cacheKey);
      if (cached !== null) {
        return {
          flagName,
          enabled: cached,
          source: 'TENANT',
          tenantId: tenantContext.tenantId,
          cached: true
        };
      }

      // CRITICAL: Get tenant-specific flag value
      const tenantFlag = await this.getTenantFlag(tenantContext.tenantId, flag.id);
      let enabled = flag.defaultValue;
      let source: 'DEFAULT' | 'TENANT' | 'GLOBAL' = 'DEFAULT';

      if (tenantFlag) {
        enabled = tenantFlag.enabled;
        source = 'TENANT';
      } else if (flag.isGlobal) {
        source = 'GLOBAL';
      }

      // CRITICAL: Cache the result
      this.setCachedValue(cacheKey, enabled);

      const result = {
        flagName,
        enabled,
        source,
        tenantId: tenantContext.tenantId,
        cached: false,
        metadata: flag.metadata
      };

      // CRITICAL: Log flag check
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'system',
        action: 'FEATURE_FLAG_CHECK',
        resourceType: 'FEATURE_FLAG',
        resourceId: flagName,
        outcome: 'SUCCESS',
        correlationId: 'flag_check_' + Date.now(),
        metadata: {
          enabled,
          source,
          category: flag.category,
          duration: Date.now() - startTime
        }
      });

      return result;

    } catch (error) {
      logger.error('Failed to check feature flag', error as Error, {
        flagName,
        tenantId: tenantContext.tenantId
      });

      // CRITICAL: Fail safe - return disabled
      return {
        flagName,
        enabled: false,
        source: 'DEFAULT',
        tenantId: tenantContext.tenantId,
        cached: false
      };
    }
  }

  /**
   * CRITICAL: Require feature flag to be enabled
   */
  async requireFeatureFlag(
    flagName: string,
    tenantContext: TenantContext,
    errorMessage?: string
  ): Promise<void> {
    const result = await this.isFeatureEnabled(flagName, tenantContext);
    
    if (!result.enabled) {
      const message = errorMessage || `Feature flag '${flagName}' is not enabled for tenant ${tenantContext.tenantId}`;
      
      // CRITICAL: Log failed requirement
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext.tenantId,
        actorId: (tenantContext as any).user?.id || 'system',
        action: 'FEATURE_FLAG_REQUIRED',
        resourceType: 'FEATURE_FLAG',
        resourceId: flagName,
        outcome: 'FAILURE',
        correlationId: 'flag_required_' + Date.now(),
        metadata: {
          source: result.source,
          category: 'SECURITY',
          error: message
        }
      });

      throw new Error(message);
    }
  }

  /**
   * CRITICAL: Enable feature flag for tenant
   */
  async enableFeatureFlag(
    request: FeatureFlagChangeRequest,
    tenantContext: TenantContext
  ): Promise<void> {
    await this.setFeatureFlag(request, true, tenantContext);
  }

  /**
   * CRITICAL: Disable feature flag for tenant
   */
  async disableFeatureFlag(
    request: FeatureFlagChangeRequest,
    tenantContext: TenantContext
  ): Promise<void> {
    await this.setFeatureFlag(request, false, tenantContext);
  }

  /**
   * CRITICAL: Set feature flag value
   */
  private async setFeatureFlag(
    request: FeatureFlagChangeRequest,
    enabled: boolean,
    tenantContext: TenantContext
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // CRITICAL: Validate tenant context
      if (tenantContext.tenantId !== request.tenantId) {
        throw new Error('Tenant context mismatch');
      }

      // CRITICAL: Get flag definition
      const flag = await this.getFlagDefinition(request.flagName);
      if (!flag) {
        throw new Error(`Feature flag '${request.flagName}' not found`);
      }

      // CRITICAL: Check permissions
      await this.checkFlagPermissions(flag, tenantContext);

      // CRITICAL: Check if global flag (cannot be modified per tenant)
      if (flag.isGlobal) {
        throw new Error(`Global feature flag '${request.flagName}' cannot be modified per tenant`);
      }

      // CRITICAL: Get existing tenant flag
      const existingFlag = await this.getTenantFlag(request.tenantId, flag.id);

      if (existingFlag) {
        // CRITICAL: Update existing flag
        await this.updateTenantFlag(existingFlag.id, enabled, request);
      } else {
        // CRITICAL: Create new tenant flag
        await this.createTenantFlag(flag.id, request, enabled);
      }

      // CRITICAL: Clear cache for this tenant and flag
      const cacheKey = `${request.tenantId}:${request.flagName}`;
      this.clearCachedValue(cacheKey);

      // CRITICAL: Log flag change
      this.auditLogger.logDataMutation({
        tenantId: request.tenantId,
        actorId: request.requestedBy,
        action: enabled ? 'ENABLE' : 'DISABLE',
        resourceType: 'FEATURE_FLAG',
        resourceId: request.flagName,
        outcome: 'SUCCESS',
        correlationId: request.correlationId,
        metadata: {
          flagCategory: flag.category,
          reason: request.reason,
          duration: Date.now() - startTime
        }
      });

      logger.info('Feature flag updated', {
        tenantId: request.tenantId,
        flagName: request.flagName,
        enabled,
        requestedBy: request.requestedBy,
        reason: request.reason,
        duration: Date.now() - startTime
      });

    } catch (error) {
      // CRITICAL: Log failed flag change
      this.auditLogger.logDataMutation({
        tenantId: request.tenantId,
        actorId: request.requestedBy,
        action: enabled ? 'ENABLE' : 'DISABLE',
        resourceType: 'FEATURE_FLAG',
        resourceId: request.flagName,
        outcome: 'FAILURE',
        correlationId: request.correlationId,
        metadata: {
          error: (error as Error).message,
          flagCategory: (await this.getFlagDefinition(request.flagName))?.category
        }
      });

      logger.error('Failed to update feature flag', error as Error, {
        tenantId: request.tenantId,
        flagName: request.flagName,
        enabled,
        requestedBy: request.requestedBy
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get all feature flags for tenant
   */
  async getTenantFlags(tenantId: string): Promise<Array<FeatureFlagCheckResult>> {
    try {
      // CRITICAL: Get all flag definitions
      const flags = await this.getAllFlagDefinitions();
      const results: FeatureFlagCheckResult[] = [];

      for (const flag of flags) {
        const result = await this.isFeatureEnabled(flag.name, { tenantId, userRole: 'ADMIN' } as TenantContext);
        results.push(result);
      }

      return results;

    } catch (error) {
      logger.error('Failed to get tenant flags', error as Error, { tenantId });
      throw error;
    }
  }

  /**
   * CRITICAL: Get feature flag statistics
   */
  async getFlagStatistics(): Promise<{
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    flagsByCategory: Record<string, number>;
    tenantUsage: Record<string, number>;
  }> {
    try {
      const flags = await this.getAllFlagDefinitions();
      const categoryCounts: Record<string, number> = {};
      let enabledCount = 0;

      for (const flag of flags) {
        categoryCounts[flag.category] = (categoryCounts[flag.category] || 0) + 1;
        if (flag.defaultValue) {
          enabledCount++;
        }
      }

      // CRITICAL: Get tenant usage (simplified)
      const tenantUsage: Record<string, number> = {};
      const tenantFlags = await this.prisma.$queryRaw`
        SELECT tenant_id, COUNT(*) as count
        FROM tenant_feature_flags
        WHERE enabled = true
        GROUP BY tenant_id
      ` as Array<{ tenant_id: string; count: bigint }>;

      for (const row of tenantFlags) {
        tenantUsage[row.tenant_id] = Number(row.count);
      }

      return {
        totalFlags: flags.length,
        enabledFlags: enabledCount,
        disabledFlags: flags.length - enabledCount,
        flagsByCategory: categoryCounts,
        tenantUsage
      };

    } catch (error) {
      logger.error('Failed to get flag statistics', error as Error);
      throw error;
    }
  }

  /**
   * CRITICAL: Get flag definition
   */
  private async getFlagDefinition(flagName: string): Promise<FeatureFlag | null> {
    try {
      // CRITICAL: Check cache first
      const cached = this.flagCache.get(flagName);
      if (cached) {
        return cached;
      }

      // CRITICAL: Get from database
      const result = await this.prisma.$queryRaw`
        SELECT id, name, description, category, default_value, is_global,
               required_permissions, metadata, created_at, updated_at
        FROM feature_flags
        WHERE name = ${flagName}
      ` as FeatureFlag[];

      if (result.length === 0) {
        return null;
      }

      const flag = result[0];
      
      // CRITICAL: Parse JSON fields
      if (typeof flag.requiredPermissions === 'string') {
        flag.requiredPermissions = JSON.parse(flag.requiredPermissions);
      }
      if (typeof flag.metadata === 'string') {
        flag.metadata = JSON.parse(flag.metadata);
      }

      // CRITICAL: Cache the flag
      this.flagCache.set(flagName, flag);

      return flag;

    } catch (error) {
      logger.error('Failed to get flag definition', error as Error, { flagName });
      return null;
    }
  }

  /**
   * CRITICAL: Get all flag definitions
   */
  private async getAllFlagDefinitions(): Promise<FeatureFlag[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, name, description, category, default_value, is_global,
               required_permissions, metadata, created_at, updated_at
        FROM feature_flags
        ORDER BY category, name
      ` as FeatureFlag[];

      // CRITICAL: Parse JSON fields
      for (const flag of result) {
        if (typeof flag.requiredPermissions === 'string') {
          flag.requiredPermissions = JSON.parse(flag.requiredPermissions);
        }
        if (typeof flag.metadata === 'string') {
          flag.metadata = JSON.parse(flag.metadata);
        }
      }

      return result;

    } catch (error) {
      logger.error('Failed to get all flag definitions', error as Error);
      throw error;
    }
  }

  /**
   * CRITICAL: Get tenant flag
   */
  private async getTenantFlag(tenantId: string, flagId: string): Promise<TenantFeatureFlag | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, tenant_id, flag_id, enabled, enabled_at, enabled_by,
               disabled_at, disabled_by, reason, correlation_id, metadata,
               created_at, updated_at
        FROM tenant_feature_flags
        WHERE tenant_id = ${tenantId} AND flag_id = ${flagId}
      ` as TenantFeatureFlag[];

      if (result.length === 0) {
        return null;
      }

      const tenantFlag = result[0];
      
      // CRITICAL: Parse JSON fields
      if (typeof tenantFlag.metadata === 'string') {
        tenantFlag.metadata = JSON.parse(tenantFlag.metadata);
      }

      return tenantFlag;

    } catch (error) {
      logger.error('Failed to get tenant flag', error as Error, { tenantId, flagId });
      return null;
    }
  }

  /**
   * CRITICAL: Create tenant flag
   */
  private async createTenantFlag(
    flagId: string,
    request: FeatureFlagChangeRequest,
    enabled: boolean
  ): Promise<void> {
    const now = new Date();
    
    await this.prisma.$executeRaw`
      INSERT INTO tenant_feature_flags (
        id, tenant_id, flag_id, enabled, enabled_at, enabled_by,
        reason, correlation_id, metadata, created_at, updated_at
      ) VALUES (
        gen_random_bytes(16)::text, ${request.tenantId}, ${flagId}, ${enabled},
        ${enabled ? now : null}, ${enabled ? request.requestedBy : null},
        ${request.reason}, ${request.correlationId}, '{}', ${now}, ${now}
      )
    `;
  }

  /**
   * CRITICAL: Update tenant flag
   */
  private async updateTenantFlag(
    tenantFlagId: string,
    enabled: boolean,
    request: FeatureFlagChangeRequest
  ): Promise<void> {
    const now = new Date();
    
    await this.prisma.$executeRaw`
      UPDATE tenant_feature_flags
      SET 
        enabled = ${enabled},
        enabled_at = CASE WHEN ${enabled} THEN ${now} ELSE enabled_at END,
        enabled_by = CASE WHEN ${enabled} THEN ${request.requestedBy} ELSE enabled_by END,
        disabled_at = CASE WHEN NOT ${enabled} THEN ${now} ELSE disabled_at END,
        disabled_by = CASE WHEN NOT ${enabled} THEN ${request.requestedBy} ELSE disabled_by END,
        reason = ${request.reason},
        correlation_id = ${request.correlationId},
        updated_at = ${now}
      WHERE id = ${tenantFlagId}
    `;
  }

  /**
   * CRITICAL: Check flag permissions
   */
  private async checkFlagPermissions(
    flag: FeatureFlag,
    tenantContext: TenantContext
  ): Promise<void> {
    // CRITICAL: Check required permissions
    for (const permission of flag.requiredPermissions) {
      const hasPermission = await this.checkPermission(tenantContext, permission);
      if (!hasPermission) {
        throw new Error(`Insufficient permissions for feature flag '${flag.name}'. Required: ${permission}`);
      }
    }
  }

  /**
   * CRITICAL: Check permission (simplified - would integrate with RBAC)
   */
  private async checkPermission(tenantContext: TenantContext, permission: string): Promise<boolean> {
    // CRITICAL: In a real implementation, this would integrate with the RBAC system
    const userRole = tenantContext.userRole;
    
    const permissionMap: Record<string, string[]> = {
      'feature:manage': ['OWNER', 'ADMIN'],
      'feature:manage:security': ['OWNER'],
      'feature:manage:compliance': ['OWNER', 'ADMIN'],
      'feature:manage:operations': ['OWNER', 'ADMIN', 'MANAGER'],
      'feature:manage:integrations': ['OWNER', 'ADMIN'],
      'feature:manage:ui': ['OWNER', 'ADMIN', 'MANAGER'],
      'feature:manage:api': ['OWNER', 'ADMIN', 'MANAGER']
    };

    const allowedRoles = permissionMap[permission] || [];
    return allowedRoles.includes(userRole);
  }

  /**
   * CRITICAL: Initialize default feature flags
   */
  private async initializeDefaultFlags(): Promise<void> {
    const defaultFlags = [
      {
        name: 'DANGEROUS_OPERATIONS',
        description: 'Enable dangerous operations requiring approval',
        category: 'SECURITY' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:security'],
        metadata: { riskLevel: 'HIGH', requiresApproval: true }
      },
      {
        name: 'TENANT_DELETION',
        description: 'Enable tenant deletion operations',
        category: 'OPERATIONS' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:operations'],
        metadata: { riskLevel: 'CRITICAL', irreversible: true }
      },
      {
        name: 'DATA_PURGE',
        description: 'Enable data purge operations',
        category: 'COMPLIANCE' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:compliance'],
        metadata: { riskLevel: 'CRITICAL', irreversible: true }
      },
      {
        name: 'LEGAL_HOLD_OVERRIDE',
        description: 'Enable legal hold override operations',
        category: 'COMPLIANCE' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:compliance'],
        metadata: { riskLevel: 'HIGH', requiresApproval: true }
      },
      {
        name: 'AUDIT_LOG_OVERRIDE',
        description: 'Enable audit log verification override',
        category: 'COMPLIANCE' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:compliance'],
        metadata: { riskLevel: 'CRITICAL', requiresApproval: true }
      },
      {
        name: 'ADVANCED_INTEGRATIONS',
        description: 'Enable advanced third-party integrations',
        category: 'INTEGRATIONS' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:integrations'],
        metadata: { riskLevel: 'MEDIUM' }
      },
      {
        name: 'BULK_OPERATIONS',
        description: 'Enable bulk data operations',
        category: 'OPERATIONS' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:operations'],
        metadata: { riskLevel: 'MEDIUM' }
      },
      {
        name: 'EXPERIMENTAL_FEATURES',
        description: 'Enable experimental features',
        category: 'UI' as const,
        defaultValue: false,
        isGlobal: false,
        requiredPermissions: ['feature:manage:ui'],
        metadata: { riskLevel: 'LOW' }
      }
    ];

    try {
      for (const flag of defaultFlags) {
        // CRITICAL: Check if flag already exists
        const existing = await this.getFlagDefinition(flag.name);
        if (!existing) {
          // CRITICAL: Create flag
          await this.createFlag(flag);
        }
      }

      logger.info('Default feature flags initialized', { count: defaultFlags.length });

    } catch (error) {
      logger.error('Failed to initialize default feature flags', error as Error);
    }
  }

  /**
   * CRITICAL: Create feature flag
   */
  private async createFlag(flag: Partial<FeatureFlag>): Promise<void> {
    const now = new Date();
    
    await this.prisma.$executeRaw`
      INSERT INTO feature_flags (
        id, name, description, category, default_value, is_global,
        required_permissions, metadata, created_at, updated_at
      ) VALUES (
        gen_random_bytes(16)::text, ${flag.name}, ${flag.description}, ${flag.category},
        ${flag.defaultValue}, ${flag.isGlobal}, ${JSON.stringify(flag.requiredPermissions)},
        ${JSON.stringify(flag.metadata)}, ${now}, ${now}
      )
    `;
  }

  /**
   * CRITICAL: Cache management
   */
  private getCachedValue(key: string): boolean | null {
    const tenantCache = this.tenantFlagCache.get(key.split(':')[0]);
    if (!tenantCache) return null;
    
    const value = tenantCache.get(key.split(':')[1]);
    if (value === undefined) return null;
    
    return value;
  }

  private setCachedValue(key: string, value: boolean): void {
    const [tenantId, flagName] = key.split(':');
    
    let tenantCache = this.tenantFlagCache.get(tenantId);
    if (!tenantCache) {
      tenantCache = new Map();
      this.tenantFlagCache.set(tenantId, tenantCache);
    }
    
    tenantCache.set(flagName, value);
    this.lastCacheRefresh.set(key, new Date());
  }

  private clearCachedValue(key: string): void {
    const [tenantId, flagName] = key.split(':');
    
    const tenantCache = this.tenantFlagCache.get(tenantId);
    if (tenantCache) {
      tenantCache.delete(flagName);
    }
    
    this.lastCacheRefresh.delete(key);
  }

  /**
   * CRITICAL: Clear all caches
   */
  clearCache(): void {
    this.flagCache.clear();
    this.tenantFlagCache.clear();
    this.lastCacheRefresh.clear();
    logger.info('Feature flag cache cleared');
  }

  /**
   * CRITICAL: Get cache statistics
   */
  getCacheStatistics(): {
    flagCacheSize: number;
    tenantCacheSize: number;
    lastRefreshCount: number;
  } {
    let tenantCacheSize = 0;
    for (const cache of this.tenantFlagCache.values()) {
      tenantCacheSize += cache.size;
    }

    return {
      flagCacheSize: this.flagCache.size,
      tenantCacheSize,
      lastRefreshCount: this.lastCacheRefresh.size
    };
  }
}

/**
 * CRITICAL: Global feature flag manager instance
 */
let globalFeatureFlagManager: FeatureFlagManager | null = null;

export const createFeatureFlagManager = (prisma: PrismaClient): FeatureFlagManager => {
  return new FeatureFlagManager(prisma);
};

export const getFeatureFlagManager = (prisma?: PrismaClient): FeatureFlagManager => {
  if (!globalFeatureFlagManager) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalFeatureFlagManager = new FeatureFlagManager(prisma);
  }
  return globalFeatureFlagManager!;
};

/**
 * CRITICAL: Convenience functions
 */
export const isFeatureEnabled = async (
  flagName: string,
  tenantContext: TenantContext
): Promise<boolean> => {
  const manager = getFeatureFlagManager();
  const result = await manager.isFeatureEnabled(flagName, tenantContext);
  return result.enabled;
};

export const requireFeatureFlag = async (
  flagName: string,
  tenantContext: TenantContext,
  errorMessage?: string
): Promise<void> => {
  const manager = getFeatureFlagManager();
  await manager.requireFeatureFlag(flagName, tenantContext, errorMessage);
};
