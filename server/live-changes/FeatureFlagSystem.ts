/**
 * ACCUBOOKS FEATURE FLAG SYSTEM
 * Owner-Level Change Authority - Core Mechanism #1
 * 
 * Mandatory for ALL changes:
 * - Every new/modified behavior wrapped in feature flag
 * - Default OFF
 * - Toggleable per: Company, User Role, Percentage Rollout, Environment
 * - Instant enable/disable (no redeploy)
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  defaultValue: boolean;
  scope: 'global' | 'company' | 'user' | 'role';
  
  // Rollout configuration
  rolloutPercentage: number; // 0-100
  companyIds?: string[]; // Specific companies
  userIds?: string[]; // Specific users
  roles?: string[]; // Specific roles (owner, admin, accountant, etc.)
  environments?: string[]; // dev, staging, production
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Auto-cleanup
  
  // Safety
  requiresAccountingCheck: boolean;
  killSwitchEnabled: boolean;
}

export interface FlagEvaluationContext {
  companyId: string;
  userId: string;
  role: string;
  environment: string;
  userHash?: number; // For percentage-based rollouts
}

export class FeatureFlagSystem extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private localCache: Map<string, FeatureFlag> = new Map();
  private cacheTTL = 30000; // 30 seconds

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
    this.startCacheRefresh();
  }

  /**
   * CREATE FEATURE FLAG
   * All new features MUST call this before deployment
   */
  async createFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const id = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFlag: FeatureFlag = {
      ...flag,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      enabled: false, // ALWAYS default to OFF
      defaultValue: false,
      rolloutPercentage: 0
    };

    // Persist to database
    await this.db.query(`
      INSERT INTO feature_flags (
        id, name, description, enabled, default_value, scope,
        rollout_percentage, company_ids, user_ids, roles, environments,
        created_by, created_at, updated_at, requires_accounting_check, kill_switch_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      newFlag.id, newFlag.name, newFlag.description, newFlag.enabled, 
      newFlag.defaultValue, newFlag.scope, newFlag.rolloutPercentage,
      JSON.stringify(newFlag.companyIds || []), 
      JSON.stringify(newFlag.userIds || []),
      JSON.stringify(newFlag.roles || []),
      JSON.stringify(newFlag.environments || []),
      newFlag.createdBy, newFlag.createdAt, newFlag.updatedAt,
      newFlag.requiresAccountingCheck, newFlag.killSwitchEnabled
    ]);

    // Cache it
    await this.cacheFlag(newFlag);
    
    this.emit('flag-created', newFlag);
    console.log(`🚩 Feature flag created: ${newFlag.name} (${newFlag.id}) - DISABLED by default`);
    
    return newFlag;
  }

  /**
   * EVALUATE FLAG - Check if feature is enabled for context
   * This is called at runtime to determine feature availability
   */
  async isEnabled(flagName: string, context: FlagEvaluationContext): Promise<boolean> {
    const flag = await this.getFlag(flagName);
    
    if (!flag) {
      console.warn(`⚠️  Feature flag not found: ${flagName}`);
      return false; // Fail closed (safe)
    }

    // Check kill switch (emergency disable)
    if (flag.killSwitchEnabled && await this.isKillSwitchActive(flag.id)) {
      console.log(`🚨 Feature ${flagName} killed via emergency switch`);
      return false;
    }

    // Check environment
    if (flag.environments && flag.environments.length > 0) {
      if (!flag.environments.includes(context.environment)) {
        return false;
      }
    }

    // Global scope - simple check
    if (flag.scope === 'global') {
      return flag.enabled && this.isInRollout(flag.rolloutPercentage, context);
    }

    // Company scope
    if (flag.scope === 'company') {
      if (flag.companyIds?.includes(context.companyId)) {
        return flag.enabled;
      }
      return flag.defaultValue;
    }

    // User scope
    if (flag.scope === 'user') {
      if (flag.userIds?.includes(context.userId)) {
        return flag.enabled;
      }
      return flag.defaultValue;
    }

    // Role scope
    if (flag.scope === 'role') {
      if (flag.roles?.includes(context.role)) {
        return flag.enabled && this.isInRollout(flag.rolloutPercentage, context);
      }
      return flag.defaultValue;
    }

    return flag.defaultValue;
  }

  /**
   * ENABLE FLAG - Gradual rollout support
   */
  async enableFlag(flagName: string, config: {
    percentage?: number;
    companyIds?: string[];
    roles?: string[];
    instant?: boolean;
  } = {}): Promise<void> {
    const flag = await this.getFlag(flagName);
    if (!flag) throw new Error(`Flag not found: ${flagName}`);

    // Validate accounting safety if required
    if (flag.requiresAccountingCheck && !config.instant) {
      const accountingSafe = await this.validateAccountingSafety();
      if (!accountingSafe) {
        throw new Error('Accounting safety check failed - cannot enable flag');
      }
    }

    const updates: any = {
      enabled: true,
      updatedAt: new Date()
    };

    if (config.percentage !== undefined) {
      updates.rolloutPercentage = Math.min(100, Math.max(0, config.percentage));
    }

    if (config.companyIds) {
      updates.companyIds = config.companyIds;
    }

    if (config.roles) {
      updates.roles = config.roles;
    }

    // Update database
    await this.db.query(`
      UPDATE feature_flags 
      SET enabled = $1, 
          rollout_percentage = $2, 
          company_ids = $3, 
          roles = $4, 
          updated_at = $5
      WHERE name = $6
    `, [
      updates.enabled,
      updates.rolloutPercentage || flag.rolloutPercentage,
      JSON.stringify(updates.companyIds || flag.companyIds || []),
      JSON.stringify(updates.roles || flag.roles || []),
      updates.updatedAt,
      flagName
    ]);

    // Invalidate cache
    await this.invalidateCache(flagName);

    this.emit('flag-enabled', { flagName, config });
    console.log(`✅ Feature flag enabled: ${flagName} (${config.percentage || 100}% rollout)`);
  }

  /**
   * DISABLE FLAG - Instant kill switch
   */
  async disableFlag(flagName: string, reason?: string): Promise<void> {
    await this.db.query(`
      UPDATE feature_flags 
      SET enabled = false, updated_at = NOW()
      WHERE name = $1
    `, [flagName]);

    await this.invalidateCache(flagName);

    this.emit('flag-disabled', { flagName, reason });
    console.log(`🚫 Feature flag disabled: ${flagName}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * GRADUAL ROLLOUT - Increase percentage over time
   */
  async rollout(flagName: string, stages: number[] = [1, 5, 10, 25, 50, 100]): Promise<void> {
    console.log(`🚀 Starting gradual rollout for ${flagName}: ${stages.join('% → ')}%`);

    for (const percentage of stages) {
      console.log(`  → Rolling out to ${percentage}%...`);
      
      await this.enableFlag(flagName, { percentage });
      
      // Monitor for 5 minutes between stages
      if (percentage < 100) {
        await this.monitorRolloutHealth(flagName, 300000); // 5 minutes
      }
    }

    console.log(`✅ Rollout complete: ${flagName} at 100%`);
  }

  /**
   * EMERGENCY KILL SWITCH - Disable immediately
   */
  async emergencyKill(flagName: string, reason: string): Promise<void> {
    await this.db.query(`
      UPDATE feature_flags 
      SET enabled = false, 
          kill_switch_enabled = true,
          updated_at = NOW()
      WHERE name = $1
    `, [flagName]);

    await this.redis.setex(`kill:${flagName}`, 86400, JSON.stringify({
      timestamp: new Date(),
      reason,
      active: true
    }));

    await this.invalidateCache(flagName);

    this.emit('emergency-kill', { flagName, reason });
    console.log(`🚨 EMERGENCY KILL: ${flagName} - ${reason}`);
  }

  /**
   * UTILITY METHODS
   */
  private async getFlag(name: string): Promise<FeatureFlag | null> {
    // Check local cache first
    if (this.localCache.has(name)) {
      return this.localCache.get(name)!;
    }

    // Check Redis
    const cached = await this.redis.get(`flag:${name}`);
    if (cached) {
      const flag = JSON.parse(cached);
      this.localCache.set(name, flag);
      return flag;
    }

    // Fetch from database
    const result = await this.db.query(`
      SELECT * FROM feature_flags WHERE name = $1
    `, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    const flag = this.rowToFlag(result.rows[0]);
    await this.cacheFlag(flag);
    return flag;
  }

  private async cacheFlag(flag: FeatureFlag): Promise<void> {
    this.localCache.set(flag.name, flag);
    await this.redis.setex(`flag:${flag.name}`, this.cacheTTL / 1000, JSON.stringify(flag));
  }

  private async invalidateCache(flagName: string): Promise<void> {
    this.localCache.delete(flagName);
    await this.redis.del(`flag:${flagName}`);
  }

  private startCacheRefresh(): void {
    setInterval(async () => {
      // Clear local cache periodically to force refresh
      this.localCache.clear();
    }, this.cacheTTL);
  }

  private isInRollout(percentage: number, context: FlagEvaluationContext): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use user hash for consistent bucketing
    const hash = this.hashCode(`${context.userId}-${context.companyId}`);
    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private async isKillSwitchActive(flagId: string): Promise<boolean> {
    const kill = await this.redis.get(`kill:${flagId}`);
    if (kill) {
      const data = JSON.parse(kill);
      return data.active;
    }
    return false;
  }

  private async validateAccountingSafety(): Promise<boolean> {
    // Check if TB is balanced
    const result = await this.db.query(`
      SELECT COUNT(*) as imbalances
      FROM (
        SELECT company_id, SUM(debit_cents - credit_cents) as net
        FROM transaction_lines tl
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.status = 'posted'
        GROUP BY company_id
        HAVING ABS(SUM(debit_cents - credit_cents)) > 0
      ) as imbalances
    `);

    return parseInt(result.rows[0].imbalances) === 0;
  }

  private async monitorRolloutHealth(flagName: string, durationMs: number): Promise<void> {
    console.log(`    Monitoring health for ${durationMs / 1000}s...`);
    
    // In production: Check error rates, latency during rollout
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    // Check metrics
    const health = await this.checkFlagHealth(flagName);
    if (!health.healthy) {
      console.error(`    ❌ Health check failed - pausing rollout`);
      throw new Error(`Rollout health check failed for ${flagName}`);
    }
    console.log(`    ✅ Health check passed`);
  }

  private async checkFlagHealth(flagName: string): Promise<{ healthy: boolean; errors?: number }> {
    // Fetch error metrics for this flag
    const result = await this.redis.get(`flag:${flagName}:metrics`);
    if (result) {
      const metrics = JSON.parse(result);
      return { healthy: metrics.errorRate < 0.01, errors: metrics.errorCount };
    }
    return { healthy: true };
  }

  private rowToFlag(row: any): FeatureFlag {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      defaultValue: row.default_value,
      scope: row.scope,
      rolloutPercentage: row.rollout_percentage,
      companyIds: row.company_ids,
      userIds: row.user_ids,
      roles: row.roles,
      environments: row.environments,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      requiresAccountingCheck: row.requires_accounting_check,
      killSwitchEnabled: row.kill_switch_enabled
    };
  }

  /**
   * LIST ALL FLAGS - For dashboard
   */
  async listFlags(): Promise<FeatureFlag[]> {
    const result = await this.db.query(`
      SELECT * FROM feature_flags ORDER BY updated_at DESC
    `);
    return result.rows.map(r => this.rowToFlag(r));
  }

  /**
   * GET FLAG STATUS - For dashboard
   */
  async getFlagStatus(flagName: string): Promise<any> {
    const flag = await this.getFlag(flagName);
    if (!flag) return null;

    const killActive = await this.isKillSwitchActive(flag.id);
    const metrics = await this.redis.get(`flag:${flagName}:metrics`);

    return {
      ...flag,
      killSwitchActive: killActive,
      metrics: metrics ? JSON.parse(metrics) : null
    };
  }
}

// SQL for feature_flags table:
export const FEATURE_FLAGS_SCHEMA = `
CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  default_value BOOLEAN DEFAULT false,
  scope VARCHAR(20) DEFAULT 'global',
  rollout_percentage INTEGER DEFAULT 0,
  company_ids JSONB DEFAULT '[]',
  user_ids JSONB DEFAULT '[]',
  roles JSONB DEFAULT '[]',
  environments JSONB DEFAULT '["production"]',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  requires_accounting_check BOOLEAN DEFAULT false,
  kill_switch_enabled BOOLEAN DEFAULT false
);

CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
`;

export default FeatureFlagSystem;
