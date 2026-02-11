/**
 * ACCUBOOKS OWNER KILL SWITCHES
 * Owner-Level Change Authority - Emergency Controls
 * 
 * Immediate controls for owner:
 * - Disable any feature flag (instant)
 * - Freeze writes globally (instant)
 * - Freeze writes per company (instant)
 * - Roll back last deployment (< 60 seconds)
 * - Revert to last known safe state
 * 
 * All actions: Logged, Timestamped, Auditable
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface KillSwitchAction {
  id: string;
  type: 'disable_feature' | 'freeze_global' | 'freeze_company' | 'rollback_deployment' | 'revert_state';
  initiatedBy: string;
  initiatedAt: Date;
  reason: string;
  scope: 'global' | 'company' | 'feature';
  target?: string; // Company ID, feature name, etc.
  executedAt?: Date;
  duration?: number; // milliseconds
  success: boolean;
  rollbackAvailable: boolean;
  auditHash: string; // SHA-256 for immutability
}

export class OwnerKillSwitches extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private actionLog: KillSwitchAction[] = [];

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * DISABLE FEATURE FLAG - Instant
   */
  async disableFeatureFlag(flagName: string, reason: string, ownerId: string): Promise<KillSwitchAction> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🚫 KILL SWITCH: Disable Feature Flag                ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Flag: ${flagName}`);
    console.log(`Reason: ${reason}`);
    console.log(`Initiated by: ${ownerId}`);

    const startTime = Date.now();
    const actionId = `kill-${Date.now()}`;

    try {
      // Instant disable via Redis (no DB round-trip needed)
      await this.redis.setex(`flag:${flagName}:killed`, 86400, JSON.stringify({
        killedAt: new Date(),
        reason,
        ownerId,
        active: true
      }));

      // Also update database
      await this.db.query(`
        UPDATE feature_flags 
        SET enabled = false, 
            kill_switch_enabled = true,
            updated_at = NOW()
        WHERE name = $1
      `, [flagName]);

      const duration = Date.now() - startTime;

      const action: KillSwitchAction = {
        id: actionId,
        type: 'disable_feature',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        executedAt: new Date(),
        duration,
        reason,
        scope: 'feature',
        target: flagName,
        success: true,
        rollbackAvailable: true,
        auditHash: await this.generateAuditHash(actionId)
      };

      await this.logAction(action);

      console.log(`✅ Feature flag ${flagName} disabled in ${duration}ms`);
      this.emit('kill-switch-executed', action);

      return action;

    } catch (error) {
      const failedAction: KillSwitchAction = {
        id: actionId,
        type: 'disable_feature',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        reason,
        scope: 'feature',
        target: flagName,
        success: false,
        rollbackAvailable: false,
        auditHash: ''
      };

      await this.logAction(failedAction);
      throw error;
    }
  }

  /**
   * FREEZE WRITES GLOBALLY - Instant
   * Emergency stop all write operations
   */
  async freezeWritesGlobal(reason: string, ownerId: string): Promise<KillSwitchAction> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🥶 KILL SWITCH: Freeze Writes GLOBALLY                ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Reason: ${reason}`);
    console.log(`Initiated by: ${ownerId}`);

    const startTime = Date.now();
    const actionId = `kill-${Date.now()}`;

    try {
      // Set global circuit breaker (instant via Redis)
      await this.redis.setex('circuit-breaker:global', 3600, JSON.stringify({
        state: 'OPEN',
        reason,
        ownerId,
        frozenAt: new Date(),
        allowsReads: true,
        allowsWrites: false
      }));

      // Set read-only mode in database
      await this.db.query(`
        INSERT INTO system_settings (key, value, updated_at, updated_by)
        VALUES ('global_readonly', 'true', NOW(), $1)
        ON CONFLICT (key) DO UPDATE SET
          value = 'true',
          updated_at = NOW(),
          updated_by = $1
      `, [ownerId]);

      // Notify all application servers
      await this.redis.publish('system:freeze', JSON.stringify({
        scope: 'global',
        reason,
        ownerId,
        timestamp: new Date()
      }));

      const duration = Date.now() - startTime;

      const action: KillSwitchAction = {
        id: actionId,
        type: 'freeze_global',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        executedAt: new Date(),
        duration,
        reason,
        scope: 'global',
        success: true,
        rollbackAvailable: true,
        auditHash: await this.generateAuditHash(actionId)
      };

      await this.logAction(action);

      console.log(`✅ Global write freeze active in ${duration}ms`);
      console.log('⚠️  All write operations are now blocked');
      console.log('💡 Use unfreezeWritesGlobal() to restore');

      this.emit('kill-switch-executed', action);

      return action;

    } catch (error) {
      console.error('🆘 Global freeze failed:', error);
      throw error;
    }
  }

  /**
   * FREEZE WRITES PER COMPANY - Instant
   */
  async freezeWritesCompany(companyId: string, reason: string, ownerId: string): Promise<KillSwitchAction> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🥶 KILL SWITCH: Freeze Writes per Company           ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Company: ${companyId}`);
    console.log(`Reason: ${reason}`);
    console.log(`Initiated by: ${ownerId}`);

    const startTime = Date.now();
    const actionId = `kill-${Date.now()}`;

    try {
      // Set company-specific circuit breaker
      await this.redis.setex(`circuit-breaker:company:${companyId}`, 3600, JSON.stringify({
        state: 'OPEN',
        reason,
        ownerId,
        frozenAt: new Date(),
        allowsReads: true,
        allowsWrites: false
      }));

      // Log in database
      await this.db.query(`
        INSERT INTO company_freezes (company_id, reason, frozen_by, frozen_at)
        VALUES ($1, $2, $3, NOW())
      `, [companyId, reason, ownerId]);

      const duration = Date.now() - startTime;

      const action: KillSwitchAction = {
        id: actionId,
        type: 'freeze_company',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        executedAt: new Date(),
        duration,
        reason,
        scope: 'company',
        target: companyId,
        success: true,
        rollbackAvailable: true,
        auditHash: await this.generateAuditHash(actionId)
      };

      await this.logAction(action);

      console.log(`✅ Company ${companyId} write freeze active in ${duration}ms`);

      this.emit('kill-switch-executed', action);

      return action;

    } catch (error) {
      console.error('🆘 Company freeze failed:', error);
      throw error;
    }
  }

  /**
   * ROLLBACK DEPLOYMENT - < 60 seconds
   */
  async rollbackDeployment(reason: string, ownerId: string): Promise<KillSwitchAction> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🔄 KILL SWITCH: Rollback Deployment                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Reason: ${reason}`);
    console.log(`Initiated by: ${ownerId}`);

    const startTime = Date.now();
    const actionId = `kill-${Date.now()}`;

    try {
      // Trigger deployment orchestrator rollback
      const { DeploymentOrchestrator } = require('./DeploymentOrchestrator');
      const orchestrator = new DeploymentOrchestrator(this.db, this.redis);
      await orchestrator.rollback();

      const duration = Date.now() - startTime;

      const action: KillSwitchAction = {
        id: actionId,
        type: 'rollback_deployment',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        executedAt: new Date(),
        duration,
        reason,
        scope: 'global',
        success: true,
        rollbackAvailable: false, // Can't rollback a rollback
        auditHash: await this.generateAuditHash(actionId)
      };

      await this.logAction(action);

      console.log(`✅ Deployment rolled back in ${duration}ms`);

      this.emit('kill-switch-executed', action);

      return action;

    } catch (error) {
      console.error('🆘 Rollback failed:', error);
      throw error;
    }
  }

  /**
   * REVERT TO SAFE STATE
   */
  async revertToSafeState(reason: string, ownerId: string): Promise<KillSwitchAction> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     ⏮️  KILL SWITCH: Revert to Safe State               ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Reason: ${reason}`);
    console.log(`Initiated by: ${ownerId}`);

    const startTime = Date.now();
    const actionId = `kill-${Date.now()}`;

    try {
      // Step 1: Get last known safe state
      const safeState = await this.db.query(`
        SELECT * FROM system_safe_states
        ORDER BY created_at DESC
        LIMIT 1
      `);

      if (safeState.rows.length === 0) {
        throw new Error('No safe state snapshot available');
      }

      // Step 2: Disable all feature flags enabled after safe state
      await this.db.query(`
        UPDATE feature_flags
        SET enabled = false
        WHERE created_at > $1
      `, [safeState.rows[0].created_at]);

      // Step 3: Rollback any pending migrations
      await this.db.query(`
        UPDATE schema_migrations
        SET rolled_back = true
        WHERE executed_at > $1
      `, [safeState.rows[0].created_at]);

      // Step 4: Restore configuration
      await this.redis.set('system:config', safeState.rows[0].config_snapshot);

      const duration = Date.now() - startTime;

      const action: KillSwitchAction = {
        id: actionId,
        type: 'revert_state',
        initiatedBy: ownerId,
        initiatedAt: new Date(startTime),
        executedAt: new Date(),
        duration,
        reason,
        scope: 'global',
        success: true,
        rollbackAvailable: false,
        auditHash: await this.generateAuditHash(actionId)
      };

      await this.logAction(action);

      console.log(`✅ Reverted to safe state in ${duration}ms`);
      console.log(`Restored to: ${safeState.rows[0].created_at}`);

      this.emit('kill-switch-executed', action);

      return action;

    } catch (error) {
      console.error('🆘 Revert failed:', error);
      throw error;
    }
  }

  /**
   * UNFREEZE WRITES (global)
   */
  async unfreezeWritesGlobal(ownerId: string): Promise<void> {
    await this.redis.del('circuit-breaker:global');
    
    await this.db.query(`
      UPDATE system_settings
      SET value = 'false', updated_at = NOW(), updated_by = $1
      WHERE key = 'global_readonly'
    `, [ownerId]);

    await this.redis.publish('system:unfreeze', JSON.stringify({
      scope: 'global',
      timestamp: new Date()
    }));

    console.log('✅ Global write freeze lifted');
  }

  /**
   * UNFREEZE WRITES (company)
   */
  async unfreezeWritesCompany(companyId: string, ownerId: string): Promise<void> {
    await this.redis.del(`circuit-breaker:company:${companyId}`);
    
    await this.db.query(`
      DELETE FROM company_freezes
      WHERE company_id = $1
    `, [companyId]);

    console.log(`✅ Company ${companyId} write freeze lifted`);
  }

  /**
   * UTILITY METHODS
   */
  private async logAction(action: KillSwitchAction): Promise<void> {
    // Store in database (immutable)
    await this.db.query(`
      INSERT INTO kill_switch_actions (
        id, type, initiated_by, initiated_at, executed_at,
        duration, reason, scope, target, success, rollback_available, audit_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      action.id, action.type, action.initiatedBy, action.initiatedAt,
      action.executedAt, action.duration, action.reason, action.scope,
      action.target, action.success, action.rollbackAvailable, action.auditHash
    ]);

    // Store in Redis for quick access
    await this.redis.lpush('kill-switches:history', JSON.stringify(action));
    
    // Emit for dashboard
    this.emit('action-logged', action);
  }

  private async generateAuditHash(actionId: string): Promise<string> {
    const crypto = require('crypto');
    const data = JSON.stringify({
      actionId,
      timestamp: new Date(),
      previousHash: await this.getLastAuditHash()
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async getLastAuditHash(): Promise<string> {
    const result = await this.db.query(`
      SELECT audit_hash FROM kill_switch_actions
      ORDER BY initiated_at DESC
      LIMIT 1
    `);
    
    return result.rows[0]?.audit_hash || '0';
  }

  /**
   * GET ACTIVE KILL SWITCHES
   */
  async getActiveSwitches(): Promise<KillSwitchAction[]> {
    // Get from database
    const result = await this.db.query(`
      SELECT * FROM kill_switch_actions
      WHERE success = true
        AND rollback_available = true
        AND type IN ('freeze_global', 'freeze_company', 'disable_feature')
      ORDER BY initiated_at DESC
      LIMIT 100
    `);

    return result.rows;
  }

  /**
   * GET ACTION HISTORY
   */
  async getActionHistory(limit: number = 100): Promise<KillSwitchAction[]> {
    const result = await this.db.query(`
      SELECT * FROM kill_switch_actions
      ORDER BY initiated_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}

// SQL for kill switch tracking:
export const KILL_SWITCH_SCHEMA = `
CREATE TABLE IF NOT EXISTS kill_switch_actions (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  initiated_by VARCHAR(100) NOT NULL,
  initiated_at TIMESTAMP NOT NULL,
  executed_at TIMESTAMP,
  duration INTEGER,
  reason TEXT NOT NULL,
  scope VARCHAR(20) NOT NULL,
  target VARCHAR(100),
  success BOOLEAN DEFAULT false,
  rollback_available BOOLEAN DEFAULT false,
  audit_hash VARCHAR(64) NOT NULL
);

CREATE INDEX idx_kill_switches_initiated_at ON kill_switch_actions(initiated_at DESC);
CREATE INDEX idx_kill_switches_type ON kill_switch_actions(type);

CREATE TABLE IF NOT EXISTS company_freezes (
  id SERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  reason TEXT NOT NULL,
  frozen_by VARCHAR(100) NOT NULL,
  frozen_at TIMESTAMP DEFAULT NOW(),
  unfrozen_at TIMESTAMP,
  unfrozen_by VARCHAR(100)
);

CREATE INDEX idx_company_freezes_company_id ON company_freezes(company_id);
`;

export default OwnerKillSwitches;
