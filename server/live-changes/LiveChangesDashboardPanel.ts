/**
 * ACCUBOOKS LIVE CHANGES DASHBOARD PANEL
 * Owner-Level Change Authority - Dashboard Integration
 * 
 * Adds to CEO Dashboard:
 * - Active deployments
 * - Feature flags & rollout %
 * - Experiments running
 * - System stability
 * - Rollback buttons
 * - Financial safety status
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import FeatureFlagSystem from './FeatureFlagSystem';
import DeploymentOrchestrator from './DeploymentOrchestrator';
import OwnerKillSwitches from './OwnerKillSwitches';

export interface LiveChangesState {
  timestamp: Date;
  deployments: DeploymentStatus[];
  featureFlags: FeatureFlagStatus[];
  experiments: ExperimentStatus[];
  migrations: MigrationStatus[];
  killSwitches: KillSwitchStatus[];
  stability: StabilityMetrics;
  financialSafety: FinancialSafetyStatus;
}

export interface DeploymentStatus {
  id: string;
  version: string;
  status: 'pending' | 'deploying' | 'canary' | 'complete' | 'failed' | 'rollingback';
  stage: number; // percentage
  health: { errorRate: number; latency: number };
  startedAt: Date;
  canRollback: boolean;
}

export interface FeatureFlagStatus {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  companiesEnabled: number;
  companiesTotal: number;
  killSwitchActive: boolean;
  canDisable: boolean;
}

export interface ExperimentStatus {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed';
  variant: string;
  participants: number;
  conversionRate: number;
  impact: 'positive' | 'negative' | 'neutral';
  canStop: boolean;
}

export interface MigrationStatus {
  id: string;
  name: string;
  type: 'expand' | 'migrate' | 'contract';
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number; // 0-100
  duration: number; // seconds
  canRollback: boolean;
}

export interface KillSwitchStatus {
  id: string;
  type: string;
  target: string;
  active: boolean;
  initiatedAt: Date;
  initiatedBy: string;
  canRevert: boolean;
}

export interface StabilityMetrics {
  overall: 'healthy' | 'warning' | 'critical';
  apiErrorRate: number;
  dbCpu: number;
  recentIncidents: number;
  lastIncidentAt?: Date;
}

export interface FinancialSafetyStatus {
  trialBalance: 'balanced' | 'unbalanced';
  ledgerImmutability: 'intact' | 'compromised';
  lastValidationAt: Date;
  activeFreezes: number;
}

export class LiveChangesDashboardPanel extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private flagSystem: FeatureFlagSystem;
  private deploymentOrchestrator: DeploymentOrchestrator;
  private killSwitches: OwnerKillSwitches;

  constructor(
    db: Pool,
    redis: Redis,
    flagSystem: FeatureFlagSystem,
    deploymentOrchestrator: DeploymentOrchestrator,
    killSwitches: OwnerKillSwitches
  ) {
    super();
    this.db = db;
    this.redis = redis;
    this.flagSystem = flagSystem;
    this.deploymentOrchestrator = deploymentOrchestrator;
    this.killSwitches = killSwitches;
  }

  /**
   * GET LIVE CHANGES STATE
   * Complete snapshot for dashboard panel
   */
  async getState(): Promise<LiveChangesState> {
    const [
      deployments,
      featureFlags,
      experiments,
      migrations,
      killSwitches,
      stability,
      financialSafety
    ] = await Promise.all([
      this.getDeployments(),
      this.getFeatureFlags(),
      this.getExperiments(),
      this.getMigrations(),
      this.getActiveKillSwitches(),
      this.getStabilityMetrics(),
      this.getFinancialSafetyStatus()
    ]);

    return {
      timestamp: new Date(),
      deployments,
      featureFlags,
      experiments,
      migrations,
      killSwitches,
      stability,
      financialSafety
    };
  }

  /**
   * GET DEPLOYMENTS
   */
  private async getDeployments(): Promise<DeploymentStatus[]> {
    const active = this.deploymentOrchestrator.getStatus();
    
    if (active) {
      return [{
        id: active.id,
        version: active.version,
        status: active.status,
        stage: active.stage,
        health: active.health,
        startedAt: active.startedAt,
        canRollback: active.status !== 'complete' && active.status !== 'failed'
      }];
    }

    // Get recent deployments from history
    const history = await this.redis.lrange('deployments:history', 0, 4);
    return history.map(h => JSON.parse(h));
  }

  /**
   * GET FEATURE FLAGS
   */
  private async getFeatureFlags(): Promise<FeatureFlagStatus[]> {
    const flags = await this.flagSystem.listFlags();
    const totalCompanies = await this.getTotalCompanyCount();

    return Promise.all(flags.map(async flag => {
      // Count companies where flag is enabled
      const enabledCount = flag.companyIds?.length || 
        (flag.enabled ? Math.floor(totalCompanies * flag.rolloutPercentage / 100) : 0);

      return {
        name: flag.name,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        companiesEnabled: enabledCount,
        companiesTotal: totalCompanies,
        killSwitchActive: flag.killSwitchEnabled,
        canDisable: flag.enabled && !flag.killSwitchEnabled
      };
    }));
  }

  /**
   * GET EXPERIMENTS
   */
  private async getExperiments(): Promise<ExperimentStatus[]> {
    const result = await this.db.query(`
      SELECT 
        id, name, status, variant_a_conversion, variant_b_conversion,
        participants_a, participants_b, created_at, impact
      FROM experiments
      WHERE status IN ('running', 'paused')
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return result.rows.map(row => {
      const totalParticipants = parseInt(row.participants_a) + parseInt(row.participants_b);
      const convA = parseFloat(row.variant_a_conversion);
      const convB = parseFloat(row.variant_b_conversion);
      const winningVariant = convB > convA ? 'B' : 'A';
      
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        variant: winningVariant,
        participants: totalParticipants,
        conversionRate: Math.max(convA, convB),
        impact: row.impact || 'neutral',
        canStop: row.status === 'running'
      };
    });
  }

  /**
   * GET MIGRATIONS
   */
  private async getMigrations(): Promise<MigrationStatus[]> {
    const result = await this.db.query(`
      SELECT 
        id, name, type, success, duration_seconds, executed_at
      FROM schema_migrations
      WHERE executed_at > NOW() - INTERVAL '7 days'
      ORDER BY executed_at DESC
      LIMIT 10
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.success ? 'complete' : 'failed',
      progress: row.success ? 100 : 0,
      duration: row.duration_seconds || 0,
      canRollback: true // Simplified - real implementation would check
    }));
  }

  /**
   * GET ACTIVE KILL SWITCHES
   */
  private async getActiveKillSwitches(): Promise<KillSwitchStatus[]> {
    const actions = await this.killSwitches.getActiveSwitches();
    
    return actions.map(action => ({
      id: action.id,
      type: action.type,
      target: action.target || 'global',
      active: true,
      initiatedAt: action.initiatedAt,
      initiatedBy: action.initiatedBy,
      canRevert: action.rollbackAvailable
    }));
  }

  /**
   * GET STABILITY METRICS
   */
  private async getStabilityMetrics(): Promise<StabilityMetrics> {
    const healthRaw = await this.redis.get('health:current');
    const health = healthRaw ? JSON.parse(healthRaw) : { overall: 'healthy' };

    const metricsRaw = await this.redis.get('metrics:current');
    const metrics = metricsRaw ? JSON.parse(metricsRaw) : {};

    const incidents = await this.db.query(`
      SELECT COUNT(*) as count, MAX(created_at) as last_incident
      FROM incidents
      WHERE severity IN ('P0', 'P1')
        AND created_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      overall: health.overall,
      apiErrorRate: metrics.errorRate || 0,
      dbCpu: metrics.dbCpu || 0,
      recentIncidents: parseInt(incidents.rows[0].count),
      lastIncidentAt: incidents.rows[0].last_incident
    };
  }

  /**
   * GET FINANCIAL SAFETY STATUS
   */
  private async getFinancialSafetyStatus(): Promise<FinancialSafetyStatus> {
    // Check trial balance
    const tbResult = await this.db.query(`
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
    const tbBalanced = parseInt(tbResult.rows[0].imbalances) === 0;

    // Check for modified posted transactions
    const immutabilityResult = await this.db.query(`
      SELECT COUNT(*) as modified
      FROM transactions
      WHERE status = 'posted'
        AND updated_at > posted_at + INTERVAL '1 second'
    `);
    const immutable = parseInt(immutabilityResult.rows[0].modified) === 0;

    // Get active freezes
    const freezesResult = await this.db.query(`
      SELECT COUNT(*) as count FROM company_freezes WHERE unfrozen_at IS NULL
    `);

    // Get last validation time
    const validationResult = await this.db.query(`
      SELECT MAX(timestamp) as last_validation FROM validations WHERE check_type = 'trial_balance'
    `);

    return {
      trialBalance: tbBalanced ? 'balanced' : 'unbalanced',
      ledgerImmutability: immutable ? 'intact' : 'compromised',
      lastValidationAt: validationResult.rows[0]?.last_validation || new Date(),
      activeFreezes: parseInt(freezesResult.rows[0].count)
    };
  }

  /**
   * DASHBOARD ACTIONS
   */

  /**
   * ROLLBACK DEPLOYMENT (Owner action)
   */
  async rollbackDeployment(deploymentId: string, ownerId: string): Promise<void> {
    console.log(`[DASHBOARD] Rollback deployment ${deploymentId} by ${ownerId}`);
    await this.killSwitches.rollbackDeployment('Dashboard rollback requested', ownerId);
  }

  /**
   * DISABLE FEATURE FLAG (Owner action)
   */
  async disableFeatureFlag(flagName: string, ownerId: string): Promise<void> {
    console.log(`[DASHBOARD] Disable feature flag ${flagName} by ${ownerId}`);
    await this.killSwitches.disableFeatureFlag(flagName, 'Dashboard disable', ownerId);
  }

  /**
   * STOP EXPERIMENT (Owner action)
   */
  async stopExperiment(experimentId: string, ownerId: string): Promise<void> {
    console.log(`[DASHBOARD] Stop experiment ${experimentId} by ${ownerId}`);
    
    await this.db.query(`
      UPDATE experiments
      SET status = 'stopped', stopped_at = NOW(), stopped_by = $2
      WHERE id = $1
    `, [experimentId, ownerId]);
  }

  /**
   * ROLLBACK MIGRATION (Owner action)
   */
  async rollbackMigration(migrationId: string, ownerId: string): Promise<void> {
    console.log(`[DASHBOARD] Rollback migration ${migrationId} by ${ownerId}`);
    // This would trigger the migration framework rollback
    this.emit('rollback-migration', { migrationId, ownerId });
  }

  /**
   * UNFREEZE (Owner action)
   */
  async unfreeze(target: string, ownerId: string): Promise<void> {
    console.log(`[DASHBOARD] Unfreeze ${target} by ${ownerId}`);
    
    if (target === 'global') {
      await this.killSwitches.unfreezeWritesGlobal(ownerId);
    } else {
      await this.killSwitches.unfreezeWritesCompany(target, ownerId);
    }
  }

  /**
   * UTILITY METHODS
   */
  private async getTotalCompanyCount(): Promise<number> {
    const result = await this.db.query('SELECT COUNT(*) as count FROM companies WHERE status = $1', ['active']);
    return parseInt(result.rows[0].count);
  }

  /**
   * GET PANEL HTML for embedding in CEO Dashboard
   */
  async getPanelHTML(): Promise<string> {
    const state = await this.getState();

    return `
      <div id="live-changes-panel" class="dashboard-panel">
        <h2>🚀 Live Changes Control</h2>
        
        <div class="panel-section">
          <h3>Active Deployments</h3>
          ${state.deployments.map(d => `
            <div class="deployment-item ${d.status}">
              <span>${d.version} - ${d.status} (${d.stage}%)</span>
              ${d.canRollback ? `<button onclick="rollbackDeployment('${d.id}')">Rollback</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="panel-section">
          <h3>Feature Flags</h3>
          ${state.featureFlags.map(f => `
            <div class="flag-item ${f.enabled ? 'enabled' : ''}">
              <span>${f.name}: ${f.enabled ? 'ON' : 'OFF'} (${f.rolloutPercentage}%)</span>
              ${f.canDisable ? `<button onclick="disableFlag('${f.name}')">Disable</button>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="panel-section">
          <h3>Financial Safety</h3>
          <div class="safety-status ${state.financialSafety.trialBalance}">
            <span>Trial Balance: ${state.financialSafety.trialBalance.toUpperCase()}</span>
          </div>
          <div class="safety-status ${state.financialSafety.ledgerImmutability}">
            <span>Ledger: ${state.financialSafety.ledgerImmutability.toUpperCase()}</span>
          </div>
          ${state.financialSafety.activeFreezes > 0 ? `
            <div class="alert">⚠️ ${state.financialSafety.activeFreezes} frozen companies</div>
          ` : ''}
        </div>

        <div class="panel-section">
          <h3>System Stability</h3>
          <div class="stability-${state.stability.overall}">
            Status: ${state.stability.overall.toUpperCase()}
          </div>
          <div>Error Rate: ${(state.stability.apiErrorRate * 100).toFixed(2)}%</div>
          <div>DB CPU: ${state.stability.dbCpu}%</div>
        </div>

        <div class="panel-section">
          <h3>Kill Switches</h3>
          ${state.killSwitches.map(ks => `
            <div class="kill-switch ${ks.active ? 'active' : ''}">
              <span>${ks.type} on ${ks.target}</span>
              ${ks.canRevert ? `<button onclick="unfreeze('${ks.target}')">Revert</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

export default LiveChangesDashboardPanel;
