#!/usr/bin/env node
/**
 * ACCUBOOKS LIVE CHANGES ORCHESTRATOR
 * Owner-Level Change Authority - Main Control System
 * 
 * Integrates all 5 core mechanisms:
 * 1. Feature Flag System
 * 2. Versioned API System
 * 3. Safe Migration Framework
 * 4. Blue-Green/Canary Deployment Orchestrator
 * 5. Owner Kill Switches & Dashboard Panel
 * 
 * Plus: Accounting Safety Guards & Audit System
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { Application } from 'express';
import { EventEmitter } from 'events';

// Import all live-change components
import FeatureFlagSystem, { FEATURE_FLAGS_SCHEMA } from './FeatureFlagSystem';
import VersionedAPISystem from './VersionedAPISystem';
import SafeMigrationFramework, { MIGRATIONS_SCHEMA } from './SafeMigrationFramework';
import DeploymentOrchestrator from './DeploymentOrchestrator';
import OwnerKillSwitches, { KILL_SWITCH_SCHEMA } from './OwnerKillSwitches';
import LiveChangesDashboardPanel from './LiveChangesDashboardPanel';

export class LiveChangesOrchestrator extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private app: Application;

  // Core systems
  public featureFlags: FeatureFlagSystem;
  public versionedAPIs: VersionedAPISystem;
  public migrations: SafeMigrationFramework;
  public deployments: DeploymentOrchestrator;
  public killSwitches: OwnerKillSwitches;
  public dashboardPanel: LiveChangesDashboardPanel;

  // Accounting safety
  private accountingSafe: boolean = true;

  constructor(db: Pool, redis: Redis, app: Application) {
    super();
    this.db = db;
    this.redis = redis;
    this.app = app;

    // Initialize all systems
    this.featureFlags = new FeatureFlagSystem(db, redis);
    this.versionedAPIs = new VersionedAPISystem(app, { 
      defaultVersion: 'v1', 
      supportedVersions: ['v1'], 
      deprecationWarnings: true,
      sunsetWarnings: true 
    });
    this.migrations = new SafeMigrationFramework(db);
    this.deployments = new DeploymentOrchestrator(db, redis);
    this.killSwitches = new OwnerKillSwitches(db, redis);
    this.dashboardPanel = new LiveChangesDashboardPanel(
      db, redis, this.featureFlags, this.deployments, this.killSwitches
    );

    // Setup accounting safety hooks
    this.setupAccountingSafetyGuards();
    this.setupAuditTrail();
  }

  /**
   * START LIVE CHANGES SYSTEM
   */
  async start(): Promise<void> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║     ACCUBOOKS LIVE CHANGES ORCHESTRATOR                       ║');
    console.log('║     Owner-Level Change Authority                              ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔓 Owner can:');
    console.log('   • Deploy new features (with feature flags)');
    console.log('   • Modify existing logic (backward compatible)');
    console.log('   • Fix bugs (versioned APIs)');
    console.log('   • Change workflows (safe migrations)');
    console.log('   • Improve performance (canary deployments)');
    console.log('   • Experiment safely (A/B testing)');
    console.log('');
    console.log('🛡️  All changes enforced to be:');
    console.log('   • Backward compatible');
    console.log('   • Reversible');
    console.log('   • Audited');
    console.log('   • Financially safe');
    console.log('');

    // Initialize database schemas
    await this.initializeSchemas();

    // Start accounting safety monitoring
    this.startAccountingSafetyChecks();

    // Setup event handlers
    this.setupEventHandlers();

    console.log('✅ Live Changes System Active');
    console.log('');
    console.log('📊 Dashboard Panel: http://localhost:8080/api/live-changes');
    console.log('🚨 Kill Switches: Available instantly');
    console.log('');
  }

  /**
   * INITIALIZE DATABASE SCHEMAS
   */
  private async initializeSchemas(): Promise<void> {
    console.log('🔧 Initializing database schemas...');

    await this.db.query(FEATURE_FLAGS_SCHEMA);
    await this.db.query(MIGRATIONS_SCHEMA);
    await this.db.query(KILL_SWITCH_SCHEMA);

    console.log('✅ Schemas initialized');
  }

  /**
   * SETUP ACCOUNTING SAFETY GUARDS
   */
  private setupAccountingSafetyGuards(): void {
    // Before any deployment, verify accounting safety
    this.deployments.on('deployment-starting', async (config) => {
      if (config.accountingSafe) {
        const safe = await this.checkAccountingSafety();
        if (!safe) {
          throw new Error('Accounting safety check failed - deployment blocked');
        }
      }
    });

    // During deployment, monitor TB
    this.deployments.on('canary-stage-complete', async ({ stage, health }) => {
      if (health.errorRate > 0.001) { // Even small error rate
        const tbOK = await this.checkTrialBalance();
        if (!tbOK) {
          console.error('🚨 Trial Balance compromised during deployment - initiating rollback');
          await this.deployments.rollback();
        }
      }
    });
  }

  /**
   * START ACCOUNTING SAFETY CHECKS
   */
  private startAccountingSafetyChecks(): void {
    // Check every 5 minutes during active changes
    setInterval(async () => {
      const deploymentActive = this.deployments.getStatus() !== null;
      const migrationsRunning = await this.migrations.getMigrationStatus();
      
      if (deploymentActive || migrationsRunning.pending > 0) {
        const safe = await this.checkAccountingSafety();
        this.accountingSafe = safe;
        
        if (!safe) {
          console.error('🚨 ACCOUNTING SAFETY VIOLATION DETECTED');
          console.error('   Auto-freezing all changes...');
          
          // Freeze everything
          await this.killSwitches.freezeWritesGlobal(
            'Accounting safety violation detected',
            'system'
          );
          
          this.emit('accounting-safety-violation', {
            timestamp: new Date(),
            action: 'global-freeze'
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * SETUP AUDIT TRAIL
   */
  private setupAuditTrail(): void {
    // Log all changes
    const eventsToLog = [
      'flag-created', 'flag-enabled', 'flag-disabled', 'emergency-kill',
      'deployment-complete', 'deployment-failed', 'rollback-complete',
      'migration-success', 'migration-failed',
      'kill-switch-executed'
    ];

    eventsToLog.forEach(event => {
      this.on(event, async (data) => {
        await this.logAuditEvent(event, data);
      });
    });
  }

  /**
   * SETUP EVENT HANDLERS
   */
  private setupEventHandlers(): void {
    // Feature flag changes trigger dashboard update
    this.featureFlags.on('flag-enabled', () => {
      this.emit('dashboard-update');
    });

    // Kill switches trigger notifications
    this.killSwitches.on('kill-switch-executed', (action) => {
      console.log(`🚨 Kill switch executed: ${action.type}`);
      this.emit('owner-alert', {
        severity: 'CRITICAL',
        message: `Kill switch activated: ${action.type}`,
        action
      });
    });
  }

  /**
   * DEPLOY NEW VERSION (Safe wrapper)
   */
  async deployVersion(config: {
    version: string;
    image: string;
    featureFlags?: string[];
    canaryStages?: number[];
  }): Promise<void> {
    console.log(`🚀 Initiating safe deployment: ${config.version}`);

    // Pre-checks
    await this.validateDeploymentSafety(config);

    // Enable feature flags at 0% first
    for (const flag of config.featureFlags || []) {
      await this.featureFlags.enableFlag(flag, { percentage: 0 });
    }

    // Execute deployment
    const deploymentConfig = {
      version: config.version,
      image: config.image,
      featureFlags: config.featureFlags || [],
      accountingSafe: true,
      canaryStages: config.canaryStages || [1, 10, 50, 100],
      healthCheckDuration: 300,
      autoRollbackOnFailure: true
    };

    await this.deployments.deploy(deploymentConfig);

    // Gradually enable feature flags
    for (const flag of config.featureFlags || []) {
      await this.featureFlags.rollout(flag, [1, 5, 10, 25, 50, 100]);
    }

    console.log(`✅ Deployment ${config.version} complete`);
  }

  /**
   * CREATE FEATURE FLAG (Mandatory for all changes)
   */
  async createFeatureFlag(config: {
    name: string;
    description: string;
    scope: 'global' | 'company' | 'user' | 'role';
    accountingSafe: boolean;
    createdBy: string;
  }): Promise<string> {
    const flag = await this.featureFlags.createFlag({
      name: config.name,
      description: config.description,
      enabled: false,
      defaultValue: false,
      scope: config.scope,
      rolloutPercentage: 0,
      createdBy: config.createdBy,
      requiresAccountingCheck: config.accountingSafe,
      killSwitchEnabled: false
    });

    return flag.id;
  }

  /**
   * EXECUTE MIGRATION (Safe wrapper)
   */
  async executeMigration(migrationConfig: {
    name: string;
    type: 'expand' | 'migrate' | 'contract';
    sql: string;
    rollbackSql: string;
    accountingSafe: boolean;
  }): Promise<void> {
    const migration = {
      id: `migration-${Date.now()}`,
      name: migrationConfig.name,
      description: migrationConfig.name,
      type: migrationConfig.type,
      sql: migrationConfig.sql,
      rollbackSql: migrationConfig.rollbackSql,
      dependencies: [],
      estimatedDuration: 60,
      requiresLock: true,
      accountingSafe: migrationConfig.accountingSafe
    };

    // Validate
    const validation = await this.migrations.validateMigration(migration);
    if (!validation.safe) {
      throw new Error(`Migration validation failed: ${validation.issues.join(', ')}`);
    }

    // Execute
    const result = await this.migrations.executeMigration(migration);
    if (!result.success) {
      throw new Error(`Migration failed: ${result.error}`);
    }
  }

  /**
   * EMERGENCY STOP (Owner kill switch)
   */
  async emergencyStop(reason: string, ownerId: string): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     🛑 EMERGENCY STOP EXECUTED                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    // Disable all feature flags
    const flags = await this.featureFlags.listFlags();
    for (const flag of flags) {
      if (flag.enabled) {
        await this.featureFlags.emergencyKill(flag.name, reason);
      }
    }

    // Freeze writes globally
    await this.killSwitches.freezeWritesGlobal(reason, ownerId);

    // Rollback active deployment
    const deployment = this.deployments.getStatus();
    if (deployment && deployment.status !== 'complete') {
      await this.deployments.rollback();
    }

    console.log('✅ Emergency stop complete');
    console.log('💡 System is now in safe state');
    console.log('💡 Use unfreeze commands to restore gradually');
  }

  /**
   * UTILITY METHODS
   */
  private async validateDeploymentSafety(config: any): Promise<void> {
    // Check system health
    const health = await this.redis.get('health:current');
    if (health) {
      const h = JSON.parse(health);
      if (h.overall === 'critical') {
        throw new Error('System health critical - deployment blocked');
      }
    }

    // Check accounting safety
    const accountingOK = await this.checkAccountingSafety();
    if (!accountingOK) {
      throw new Error('Accounting safety check failed - deployment blocked');
    }
  }

  private async checkAccountingSafety(): Promise<boolean> {
    const tbOK = await this.checkTrialBalance();
    const immutabilityOK = await this.checkLedgerImmutability();
    return tbOK && immutabilityOK;
  }

  private async checkTrialBalance(): Promise<boolean> {
    const result = await this.db.query(`
      SELECT COUNT(*) as imbalances
      FROM (
        SELECT company_id
        FROM transaction_lines tl
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.status = 'posted'
        GROUP BY company_id
        HAVING ABS(SUM(debit_cents - credit_cents)) > 0
      ) as imbalances
    `);
    return parseInt(result.rows[0].imbalances) === 0;
  }

  private async checkLedgerImmutability(): Promise<boolean> {
    const result = await this.db.query(`
      SELECT COUNT(*) as modified
      FROM transactions
      WHERE status = 'posted'
        AND updated_at > posted_at + INTERVAL '1 second'
    `);
    return parseInt(result.rows[0].modified) === 0;
  }

  private async logAuditEvent(event: string, data: any): Promise<void> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({ event, data, timestamp: new Date() }))
      .digest('hex');

    await this.db.query(`
      INSERT INTO live_changes_audit (
        event_type, event_data, timestamp, audit_hash
      ) VALUES ($1, $2, NOW(), $3)
    `, [event, JSON.stringify(data), hash]);

    await this.redis.lpush('live-changes:audit', JSON.stringify({
      event,
      data,
      timestamp: new Date(),
      hash
    }));
  }

  /**
   * GET STATUS
   */
  async getStatus(): Promise<any> {
    return {
      timestamp: new Date(),
      accountingSafe: this.accountingSafe,
      dashboard: await this.dashboardPanel.getState(),
      activeDeployment: this.deployments.getStatus(),
      killSwitches: await this.killSwitches.getActiveSwitches()
    };
  }
}

// SQL for audit table
export const AUDIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS live_changes_audit (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  audit_hash VARCHAR(64) NOT NULL
);

CREATE INDEX idx_live_changes_audit_timestamp ON live_changes_audit(timestamp DESC);
CREATE INDEX idx_live_changes_audit_event ON live_changes_audit(event_type);
`;

export default LiveChangesOrchestrator;
