#!/usr/bin/env node
/**
 * ACCUBOOKS AUTONOMOUS CONTROL PLANE
 * Main Orchestrator - Brings all 6 workstreams together
 * 
 * Start with: npm run autonomous
 * Or: node server/autonomous/MainOrchestrator.ts
 */

import { Pool } from 'pg';
import Redis from 'ioredis';

// Import all 6 workstreams
import AutonomousControlPlane from './Workstream1_AutonomousEngine';
import FinancialIntegrityGuard from './Workstream2_FinancialIntegrityGuard';
import CapacityScalingControl from './Workstream3_CapacityScalingControl';
import OneClickTier2Upgrade from './Workstream4_OneClickTier2Upgrade';
import CEODashboard from './Workstream5_CEODashboard';
import AutomatedReporting from './Workstream6_AutomatedReporting';

class AccuBooksAutonomousControlPlane {
  private db: Pool;
  private redis: Redis;
  
  // All 6 workstreams
  private ws1Engine: AutonomousControlPlane;
  private ws2Integrity: FinancialIntegrityGuard;
  private ws3Capacity: CapacityScalingControl;
  private ws4Upgrade: OneClickTier2Upgrade;
  private ws5Dashboard: CEODashboard;
  private ws6Reporting: AutomatedReporting;

  constructor() {
    // Initialize database connections
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'accubooks',
      user: process.env.DB_USER || 'accubooks',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    });

    // Initialize all workstreams
    this.ws1Engine = new AutonomousControlPlane(this.db, this.redis);
    this.ws2Integrity = new FinancialIntegrityGuard(this.db, this.redis);
    this.ws3Capacity = new CapacityScalingControl(this.db, this.redis);
    this.ws4Upgrade = new OneClickTier2Upgrade(this.db, this.redis);
    this.ws5Dashboard = new CEODashboard(this.db, this.redis);
    this.ws6Reporting = new AutomatedReporting(this.db, this.redis);

    // Set up cross-workstream communication
    this.setupEventHandlers();
  }

  /**
   * START ALL WORKSTREAMS
   */
  async start(): Promise<void> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║     ACCUBOOKS AUTONOMOUS CONTROL PLANE                        ║');
    console.log('║     Self-Running, Self-Healing, Self-Scaling                   ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🎯 Mission: Operate AccuBooks with zero human intervention');
    console.log('📊 Current Tier: 1 (12,500 companies)');
    console.log('🚀 Upgrade Ready: Tier 2 (15K-35K) via upgradeToTier2()');
    console.log('');

    // Start all 6 workstreams
    console.log('Starting all workstreams...');
    console.log('');

    await Promise.all([
      this.ws1Engine.start(),
      this.ws2Integrity.start(),
      this.ws3Capacity.start(),
      this.ws6Reporting.start(),
    ]);

    // Dashboard and Upgrade start after core systems
    await this.ws5Dashboard.start(8080);
    // Upgrade is ready but not executing

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ ALL WORKSTREAMS ACTIVE                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Dashboard: http://localhost:8080/api/dashboard');
    console.log('📡 WebSocket: ws://localhost:8081');
    console.log('');
    console.log('📧 Daily Reports: 08:00 UTC');
    console.log('📈 Weekly Reports: Monday 09:00 UTC');
    console.log('📋 Monthly Reports: 1st 10:00 UTC');
    console.log('');
    console.log('🤖 System is now self-managing');
    console.log('💡 Human role: Strategic oversight only');
    console.log('');
    console.log('Commands:');
    console.log('  - upgradeToTier2() : Upgrade to 35K company capacity');
    console.log('  - getStatus()      : View system status');
    console.log('  - stop()           : Graceful shutdown');
    console.log('');

    // Keep process alive
    this.keepAlive();
  }

  /**
   * Setup event handlers for cross-workstream communication
   */
  private setupEventHandlers(): void {
    // Capacity critical → Alert dashboard
    this.ws3Capacity.on('capacity-critical', async (data) => {
      console.log('🚨 Capacity critical - Alerting CEO dashboard');
      await this.redis.setex('alert:capacity-critical', 3600, JSON.stringify(data));
    });

    // Health critical → Alert dashboard
    this.ws1Engine.on('critical-health', async (health) => {
      console.log('🚨 Health critical - Dashboard notification');
      await this.redis.setex('health:alert', 300, JSON.stringify(health));
    });

    // Financial escalation → CEO alert
    this.ws2Integrity.on('escalation', async (failure) => {
      console.log('🆘 Financial integrity issue - Executive alert');
      await this.redis.lpush('escalations:executive', JSON.stringify(failure));
    });

    // Upgrade complete → Update capacity tracking
    this.ws4Upgrade.on('upgrade-complete', async (result) => {
      console.log('🎉 Upgrade complete - Updating capacity tracking');
      await this.redis.set('system:tier', '2');
      await this.redis.set('capacity:limit', '35000');
    });

    // Tier change → Dashboard update
    this.ws4Upgrade.on('tier-changed', async (data) => {
      console.log(`📈 Tier changed: ${data.from} → ${data.to}`);
      await this.redis.publish('tier-change', JSON.stringify(data));
    });
  }

  /**
   * ONE-CLICK UPGRADE TO TIER 2
   */
  async upgradeToTier2(): Promise<any> {
    console.log('');
    console.log('🚀 EXECUTING ONE-CLICK TIER 2 UPGRADE');
    console.log('');

    // Check if upgrade is already in progress
    if (this.ws4Upgrade.isUpgradeInProgress()) {
      console.log('❌ Upgrade already in progress');
      return { error: 'Upgrade already in progress' };
    }

    // Get capacity status first
    const capacityStatus = await this.ws3Capacity.getUpgradeStatus();
    console.log('Current capacity status:', capacityStatus);

    // Execute upgrade
    const result = await this.ws4Upgrade.upgradeToTier2();

    if (result.success) {
      console.log('');
      console.log('✅ UPGRADE SUCCESSFUL');
      console.log(`⏱️  Duration: ${result.duration?.toFixed(1)} minutes`);
      console.log(`🎯 New capacity: ${result.newCapacity?.toLocaleString()} companies`);
      console.log('');
      console.log('New features active:');
      console.log('  - Read replicas for reporting');
      console.log('  - Redis caching layer');
      console.log('  - pgBouncer connection pooling');
      console.log('  - Async job processing');
    } else {
      console.log('');
      console.log('❌ UPGRADE FAILED');
      console.log(`Error: ${result.error}`);
      if (result.rolledBack) {
        console.log('✅ System rolled back to Tier 1');
      }
    }

    return result;
  }

  /**
   * GET SYSTEM STATUS
   */
  async getStatus(): Promise<any> {
    const [
      engineStatus,
      integrityStatus,
      capacityStatus,
      upgradeStatus,
      dashboardState
    ] = await Promise.all([
      this.ws1Engine.getStatus(),
      this.ws2Integrity.getStatus(),
      this.ws3Capacity.getUpgradeStatus(),
      this.ws4Upgrade.getUpgradeStatus(),
      Promise.resolve(this.ws5Dashboard.getCurrentState())
    ]);

    return {
      timestamp: new Date().toISOString(),
      mode: 'autonomous',
      tier: await this.redis.get('system:tier') || '1',
      workstreams: {
        autonomousEngine: engineStatus,
        financialIntegrity: integrityStatus,
        capacityControl: capacityStatus,
        upgrade: upgradeStatus
      },
      dashboard: dashboardState,
      metrics: await this.getQuickMetrics()
    };
  }

  private async getQuickMetrics(): Promise<any> {
    const metrics = await this.redis.get('metrics:current');
    return metrics ? JSON.parse(metrics) : {};
  }

  /**
   * KEEP PROCESS ALIVE
   */
  private keepAlive(): void {
    setInterval(() => {
      // Heartbeat
      this.redis.setex('orchestrator:heartbeat', 60, new Date().toISOString());
    }, 30000);
  }

  /**
   * GRACEFUL SHUTDOWN
   */
  async stop(): Promise<void> {
    console.log('');
    console.log('🛑 Initiating graceful shutdown...');
    console.log('');

    await Promise.all([
      this.ws1Engine.stop(),
      this.ws2Integrity.stop(),
      this.ws3Capacity.stop(),
      this.ws5Dashboard.stop(),
      this.ws6Reporting.stop()
    ]);

    await this.db.end();
    await this.redis.quit();

    console.log('✅ All workstreams stopped');
    console.log('👋 Goodbye');
    process.exit(0);
  }
}

// CLI Interface
const orchestrator = new AccuBooksAutonomousControlPlane();

// Start on execution
orchestrator.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// Handle signals
process.on('SIGINT', () => orchestrator.stop());
process.on('SIGTERM', () => orchestrator.stop());

// Export for programmatic use
export { AccuBooksAutonomousControlPlane };
export default orchestrator;
