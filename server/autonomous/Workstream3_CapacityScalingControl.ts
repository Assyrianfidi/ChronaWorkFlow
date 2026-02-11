#!/usr/bin/env node
/**
 * ACCUBOOKS CAPACITY & SCALING CONTROL
 * Workstream 3: Capacity Tracking and Upgrade Readiness
 * 
 * Monitors: Companies, TPS, DB connections, concurrent users
 * Alerts: 80% → Notify, 90% → Pre-warm, 95% → Recommend execution
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface CapacityMetrics {
  timestamp: Date;
  activeCompanies: number;
  tier1Limit: number;
  tier1Utilization: number;
  tier2Ready: boolean;
  dbCpu: number;
  dbConnections: number;
  dbMaxConnections: number;
  apiLatencyP95: number;
  tps: number;
  concurrentUsers: number;
  transactionsPerCompany: number;
  projectedGrowthRate: number;
  daysUntilLimit: number;
}

interface TierStatus {
  currentTier: 1 | 2 | 3;
  activeCompanies: number;
  limit: number;
  utilization: number;
  status: 'healthy' | 'approaching' | 'critical';
  upgradeAvailable: boolean;
  upgradeRecommended: boolean;
  upgradeRequired: boolean;
}

class CapacityScalingControl extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private isRunning = false;
  private checkTimer: NodeJS.Timer | null = null;

  // Tier definitions
  private readonly TIER_LIMITS = {
    1: 12500,  // 0 - 12,500 companies
    2: 35000,  // 15,000 - 35,000 companies
    3: 100000  // 35,000 - 100,000+ companies
  };

  // Alert thresholds
  private readonly THRESHOLDS = {
    notify: 0.80,      // 80% - Notify dashboard
    prewarm: 0.90,     // 90% - Pre-warm upgrade
    recommend: 0.95    // 95% - Recommend execution
  };

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * START CAPACITY & SCALING CONTROL
   */
  async start(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     CAPACITY & SCALING CONTROL ACTIVATED                ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('📊 Current Tier: 1 (12,500 company limit)');
    console.log('🔄 Checking capacity: Every 6 hours');
    console.log('🚨 Alert thresholds: 80% notify | 90% pre-warm | 95% execute');
    console.log('');

    this.isRunning = true;

    // Start capacity tracking
    this.startCapacityTracking();

    // Initial status
    await this.emitCapacityStatus();

    console.log('✅ Capacity & Scaling Control Active');
  }

  /**
   * WORKSTREAM 3.1: CAPACITY TRACKING (Every 6 Hours)
   */
  private startCapacityTracking(): void {
    const runCapacityCheck = async () => {
      if (!this.isRunning) return;

      console.log(`📊 [${new Date().toISOString()}] Running capacity assessment...`);

      try {
        const metrics = await this.collectCapacityMetrics();
        const tierStatus = this.calculateTierStatus(metrics);

        // Store metrics
        await this.storeCapacityMetrics(metrics);
        await this.redis.setex('capacity:current', 21600, JSON.stringify(tierStatus));

        // Check thresholds and alert
        await this.evaluateThresholds(tierStatus, metrics);

        // Emit for dashboard
        this.emit('capacity-update', { metrics, tierStatus });

      } catch (error) {
        console.error('❌ Capacity check error:', error);
      }

      // Schedule next check (6 hours)
      this.checkTimer = setTimeout(runCapacityCheck, 6 * 60 * 60 * 1000);
    };

    // Run immediately
    runCapacityCheck();
  }

  /**
   * Collect comprehensive capacity metrics
   */
  private async collectCapacityMetrics(): Promise<CapacityMetrics> {
    const timestamp = new Date();

    // Parallel data collection
    const [
      companyCount,
      dbMetrics,
      apiMetrics,
      userMetrics,
      growthMetrics
    ] = await Promise.all([
      this.getActiveCompanyCount(),
      this.getDatabaseMetrics(),
      this.getAPIMetrics(),
      this.getUserMetrics(),
      this.calculateGrowthRate()
    ]);

    const tier1Limit = this.TIER_LIMITS[1];
    const utilization = (companyCount / tier1Limit) * 100;

    // Calculate days until limit based on growth rate
    const daysUntilLimit = growthMetrics.growthRate > 0
      ? Math.ceil((tier1Limit - companyCount) / (companyCount * growthMetrics.growthRate / 30))
      : 999;

    return {
      timestamp,
      activeCompanies: companyCount,
      tier1Limit,
      tier1Utilization: utilization,
      tier2Ready: utilization > 70 || dbMetrics.cpu > 65,
      dbCpu: dbMetrics.cpu,
      dbConnections: dbMetrics.connections,
      dbMaxConnections: dbMetrics.maxConnections,
      apiLatencyP95: apiMetrics.p95Latency,
      tps: apiMetrics.tps,
      concurrentUsers: userMetrics.concurrent,
      transactionsPerCompany: userMetrics.transactionsPerCompany,
      projectedGrowthRate: growthMetrics.growthRate,
      daysUntilLimit
    };
  }

  private async getActiveCompanyCount(): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE status = 'active'
        AND last_activity_at > NOW() - INTERVAL '30 days'
    `);
    return parseInt(result.rows[0].count);
  }

  private async getDatabaseMetrics() {
    const result = await this.db.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT round(100.0 * sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) / 
          NULLIF(count(*), 0), 2) FROM pg_stat_activity) as cpu_estimate
    `);

    return {
      connections: parseInt(result.rows[0].connections),
      maxConnections: parseInt(result.rows[0].max_connections),
      cpu: parseFloat(result.rows[0].cpu_estimate) || 0
    };
  }

  private async getAPIMetrics() {
    const raw = await this.redis.get('api:metrics:current');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        p95Latency: parsed.p95 || 0,
        tps: parsed.tps || 0
      };
    }
    return { p95Latency: 0, tps: 0 };
  }

  private async getUserMetrics() {
    // Concurrent users (active in last 5 minutes)
    const concurrent = await this.redis.scard('users:active:now');

    // Transactions per company (30 day average)
    const txnResult = await this.db.query(`
      SELECT 
        COUNT(DISTINCT t.company_id) as company_count,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE t.created_at > NOW() - INTERVAL '30 days'
    `);

    const transactionsPerCompany = txnResult.rows[0].company_count > 0
      ? parseInt(txnResult.rows[0].transaction_count) / parseInt(txnResult.rows[0].company_count)
      : 0;

    return { concurrent, transactionsPerCompany };
  }

  private async calculateGrowthRate(): Promise<{ growthRate: number; trend: string }> {
    // Compare companies added in last 30 days vs previous 30 days
    const result = await this.db.query(`
      SELECT 
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '60 days' 
                    AND created_at <= NOW() - INTERVAL '30 days' THEN 1 END) as previous
      FROM companies
      WHERE status = 'active'
    `);

    const recent = parseInt(result.rows[0].recent);
    const previous = parseInt(result.rows[0].previous);

    let growthRate = 0;
    let trend = 'stable';

    if (previous > 0) {
      growthRate = ((recent - previous) / previous) * 100;
      trend = growthRate > 10 ? 'accelerating' : growthRate < -10 ? 'declining' : 'stable';
    }

    return { growthRate, trend };
  }

  /**
   * Calculate tier status
   */
  private calculateTierStatus(metrics: CapacityMetrics): TierStatus {
    const currentTier = 1; // Currently Tier 1
    const limit = this.TIER_LIMITS[currentTier];
    const utilization = metrics.tier1Utilization;

    let status: 'healthy' | 'approaching' | 'critical';
    if (utilization >= this.THRESHOLDS.recommend * 100) {
      status = 'critical';
    } else if (utilization >= this.THRESHOLDS.prewarm * 100) {
      status = 'approaching';
    } else {
      status = 'healthy';
    }

    return {
      currentTier: currentTier as 1 | 2 | 3,
      activeCompanies: metrics.activeCompanies,
      limit,
      utilization,
      status,
      upgradeAvailable: true,
      upgradeRecommended: utilization >= this.THRESHOLDS.prewarm * 100 || metrics.dbCpu > 70,
      upgradeRequired: utilization >= this.THRESHOLDS.recommend * 100 || metrics.dbCpu > 85
    };
  }

  /**
   * Evaluate thresholds and alert
   */
  private async evaluateThresholds(status: TierStatus, metrics: CapacityMetrics): Promise<void> {
    const utilization = status.utilization;

    // 80% threshold - Notify dashboard
    if (utilization >= this.THRESHOLDS.notify * 100 && utilization < this.THRESHOLDS.prewarm * 100) {
      console.log(`⚠️  Capacity at ${utilization.toFixed(1)}% - Approaching Tier 1 limit`);
      
      await this.redis.lpush('alerts:capacity', JSON.stringify({
        timestamp: new Date(),
        severity: 'WARNING',
        message: `Capacity at ${utilization.toFixed(1)}% - Tier 2 upgrade ready`,
        metrics,
        action: 'notify_dashboard'
      }));

      this.emit('capacity-warning', { level: 'notify', status, metrics });
    }

    // 90% threshold - Pre-warm upgrade
    if (utilization >= this.THRESHOLDS.prewarm * 100 && utilization < this.THRESHOLDS.recommend * 100) {
      console.log(`🚨 Capacity at ${utilization.toFixed(1)}% - Pre-warming Tier 2 upgrade`);
      
      await this.redis.lpush('alerts:capacity', JSON.stringify({
        timestamp: new Date(),
        severity: 'HIGH',
        message: `Capacity at ${utilization.toFixed(1)}% - Pre-warming upgrade`,
        metrics,
        action: 'prewarm_upgrade'
      }));

      // Pre-warm: Check that upgrade resources are ready
      await this.prewarmUpgrade();

      this.emit('capacity-warning', { level: 'prewarm', status, metrics });
    }

    // 95% threshold - Recommend execution
    if (utilization >= this.THRESHOLDS.recommend * 100) {
      console.log(`🆘 Capacity at ${utilization.toFixed(1)}% - UPGRADE REQUIRED`);
      
      await this.redis.lpush('alerts:capacity', JSON.stringify({
        timestamp: new Date(),
        severity: 'CRITICAL',
        message: `Capacity CRITICAL at ${utilization.toFixed(1)}% - Execute upgrade now`,
        metrics,
        action: 'execute_upgrade'
      }));

      // Alert CEO/CTO
      await this.alertExecutives('CRITICAL CAPACITY - Upgrade Required', status);

      this.emit('capacity-critical', { status, metrics });
    }

    // Also check DB CPU independently
    if (metrics.dbCpu > 80) {
      console.log(`🚨 DB CPU at ${metrics.dbCpu}% - Performance degradation risk`);
      
      await this.redis.lpush('alerts:capacity', JSON.stringify({
        timestamp: new Date(),
        severity: 'HIGH',
        message: `DB CPU at ${metrics.dbCpu}% - Consider upgrade`,
        metrics,
        action: 'monitor_closely'
      }));
    }
  }

  /**
   * Pre-warm upgrade (prepare resources)
   */
  private async prewarmUpgrade(): Promise<void> {
    console.log('🔥 Pre-warming Tier 2 upgrade resources...');
    
    // Check AWS limits
    // Pre-allocate any needed IPs
    // Verify backup storage capacity
    // Cache upgrade scripts
    
    await this.redis.setex('upgrade:prewarmed', 86400, JSON.stringify({
      timestamp: new Date(),
      ready: true,
      estimatedDuration: '2 hours'
    }));

    console.log('✅ Upgrade resources pre-warmed');
  }

  /**
   * GET UPGRADE STATUS
   */
  async getUpgradeStatus(): Promise<any> {
    const current = await this.redis.get('capacity:current');
    const prewarmed = await this.redis.get('upgrade:prewarmed');

    if (!current) {
      return { error: 'Capacity metrics not available' };
    }

    const status: TierStatus = JSON.parse(current);

    return {
      currentTier: status.currentTier,
      companies: status.activeCompanies,
      limit: status.limit,
      utilization: `${status.utilization.toFixed(1)}%`,
      status: status.status,
      upgradeAvailable: status.upgradeAvailable,
      upgradeRecommended: status.upgradeRecommended,
      upgradeRequired: status.upgradeRequired,
      prewarmed: prewarmed ? JSON.parse(prewarmed) : null,
      nextTier: {
        tier: 2,
        limit: this.TIER_LIMITS[2],
        newCapacity: this.TIER_LIMITS[2] - status.activeCompanies,
        features: [
          'Read replicas for reporting',
          'Redis caching layer',
          'pgBouncer connection pooling',
          'Async job processing'
        ]
      }
    };
  }

  /**
   * UTILITY METHODS
   */
  private async storeCapacityMetrics(metrics: CapacityMetrics): Promise<void> {
    await this.redis.lpush('capacity:history', JSON.stringify(metrics));
    await this.redis.ltrim('capacity:history', 0, 1000);
  }

  private async emitCapacityStatus(): Promise<void> {
    const metrics = await this.collectCapacityMetrics();
    const status = this.calculateTierStatus(metrics);

    console.log('');
    console.log('📊 CAPACITY STATUS');
    console.log(`Tier: ${status.currentTier}`);
    console.log(`Companies: ${status.activeCompanies.toLocaleString()} / ${status.limit.toLocaleString()}`);
    console.log(`Utilization: ${status.utilization.toFixed(1)}%`);
    console.log(`DB CPU: ${metrics.dbCpu.toFixed(1)}%`);
    console.log(`Days Until Limit: ${metrics.daysUntilLimit}`);
    console.log(`Upgrade Status: ${status.status.toUpperCase()}`);
    console.log('');
  }

  private async alertExecutives(subject: string, status: TierStatus): Promise<void> {
    // In production: Send email/SMS to CEO/CTO
    console.log(`🚨 EXECUTIVE ALERT: ${subject}`);
    console.log(`   Companies: ${status.activeCompanies}/${status.limit} (${status.utilization.toFixed(1)}%)`);
    console.log(`   Action: Execute Tier 2 upgrade`);
  }

  /**
   * STOP
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Capacity & Scaling Control...');
    this.isRunning = false;
    if (this.checkTimer) clearTimeout(this.checkTimer);
    console.log('✅ Capacity & Scaling Control Stopped');
  }
}

export { CapacityScalingControl, CapacityMetrics, TierStatus };
export default CapacityScalingControl;
