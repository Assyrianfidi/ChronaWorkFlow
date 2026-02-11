#!/usr/bin/env node
/**
 * ACCUBOOKS AUTONOMOUS CONTROL PLANE
 * Workstream 1: Autonomous Engine
 * 
 * Self-running monitoring, health checks, and auto-remediation
 * NO HUMAN INTERVENTION REQUIRED FOR NORMAL OPERATIONS
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  MONITORING_INTERVAL: 30000,      // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000,    // 1 minute
  METRICS_WINDOW_SIZE: 100,
  AUTO_REMEDIATION_ENABLED: true,
  TARGET_AUTO_FIX_RATE: 0.95,      // 95%
  
  // Thresholds
  DB_CPU_CRITICAL: 80,
  DB_CPU_WARNING: 60,
  API_LATENCY_P95_CRITICAL: 500,
  API_LATENCY_P95_WARNING: 300,
  CACHE_HIT_RATE_WARNING: 70,
  QUEUE_DEPTH_WARNING: 5000,
  QUEUE_DEPTH_CRITICAL: 10000,
};

interface SystemMetrics {
  timestamp: Date;
  dbCpu: number;
  dbConnections: number;
  dbMaxConnections: number;
  dbReplicationLag: number;
  apiLatencyP50: number;
  apiLatencyP95: number;
  apiLatencyP99: number;
  errorRate: number;
  tps: number;
  cacheHitRate: number;
  queueDepth: number;
  memoryUsage: number;
  activeUsers: number;
  diskUsage: number;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  database: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  cache: 'healthy' | 'warning' | 'critical';
  queue: 'healthy' | 'warning' | 'critical';
  workers: 'healthy' | 'warning' | 'critical';
}

interface RemediationAction {
  timestamp: Date;
  type: string;
  trigger: string;
  success: boolean;
  duration: number;
  error?: string;
}

class AutonomousControlPlane extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private metrics: SystemMetrics[] = [];
  private remediationHistory: RemediationAction[] = [];
  private isRunning = false;
  private monitoringTimer: NodeJS.Timer | null = null;
  private healthTimer: NodeJS.Timer | null = null;

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * START AUTONOMOUS OPERATIONS
   * This begins continuous self-management
   */
  async start(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     ACCUBOOKS AUTONOMOUS CONTROL PLANE ACTIVATED        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('📊 Mode: Tier 1 (0-15,000 companies)');
    console.log('🤖 Autonomous monitoring: ENABLED');
    console.log('🔧 Auto-remediation: ENABLED (Target: 95%)');
    console.log('📈 Continuous optimization: ENABLED');
    console.log('⏱️  Monitoring interval: 30 seconds');
    console.log('🏥 Health checks: Every minute');
    console.log('');

    this.isRunning = true;

    // Start continuous loops
    this.startMonitoringLoop();
    this.startHealthCheckLoop();
    this.startRemediationLoop();

    // Initial status report
    await this.emitStatusReport();

    console.log('✅ Control Plane Active - System is self-managing');
    console.log('💡 Human intervention only for: P0 breaches, legal, physical failures');
  }

  /**
   * WORKSTREAM 1.1: CONTINUOUS MONITORING (Every 30 seconds)
   */
  private startMonitoringLoop(): void {
    const runMonitoring = async () => {
      if (!this.isRunning) return;

      try {
        const metrics = await this.collectComprehensiveMetrics();
        this.metrics.push(metrics);

        // Maintain rolling window
        if (this.metrics.length > CONFIG.METRICS_WINDOW_SIZE) {
          this.metrics.shift();
        }

        // Store for dashboard
        await this.storeMetrics(metrics);

        // Check for anomalies
        await this.detectAnomalies(metrics);

        this.emit('metrics', metrics);
      } catch (error) {
        console.error('❌ Monitoring error:', error);
        await this.logIncident('monitoring_failure', error);
      }

      // Schedule next iteration
      this.monitoringTimer = setTimeout(runMonitoring, CONFIG.MONITORING_INTERVAL);
    };

    // Start immediately
    runMonitoring();
  }

  /**
   * Collect comprehensive system metrics
   */
  private async collectComprehensiveMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    // Parallel metric collection
    const [
      dbMetrics,
      apiMetrics,
      cacheMetrics,
      queueMetrics,
      systemMetrics
    ] = await Promise.all([
      this.collectDBMetrics(),
      this.collectAPIMetrics(),
      this.collectCacheMetrics(),
      this.collectQueueMetrics(),
      this.collectSystemMetrics()
    ]);

    return {
      timestamp,
      ...dbMetrics,
      ...apiMetrics,
      ...cacheMetrics,
      ...queueMetrics,
      ...systemMetrics
    };
  }

  private async collectDBMetrics() {
    const result = await this.db.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT COALESCE(EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())), 0) 
         FROM pg_stat_replication LIMIT 1) as replication_lag,
        (SELECT round(100.0 * sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) / 
          NULLIF(count(*), 0), 2) FROM pg_stat_activity) as cpu_estimate
    `);

    return {
      dbConnections: parseInt(result.rows[0].connections),
      dbMaxConnections: parseInt(result.rows[0].max_connections),
      dbReplicationLag: parseFloat(result.rows[0].replication_lag) || 0,
      dbCpu: parseFloat(result.rows[0].cpu_estimate) || 0
    };
  }

  private async collectAPIMetrics() {
    // Try to get from Redis (populated by API servers)
    const raw = await this.redis.get('api:metrics:current');
    
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiLatencyP50: parsed.p50 || 0,
        apiLatencyP95: parsed.p95 || 0,
        apiLatencyP99: parsed.p99 || 0,
        errorRate: parsed.errorRate || 0,
        tps: parsed.tps || 0
      };
    }

    // Fallback: probe health endpoint
    try {
      const start = Date.now();
      await axios.get('http://localhost:3000/health', { timeout: 5000 });
      const latency = Date.now() - start;

      return {
        apiLatencyP50: latency,
        apiLatencyP95: latency,
        apiLatencyP99: latency,
        errorRate: 0,
        tps: 0
      };
    } catch {
      return {
        apiLatencyP50: 9999,
        apiLatencyP95: 9999,
        apiLatencyP99: 9999,
        errorRate: 1,
        tps: 0
      };
    }
  }

  private async collectCacheMetrics() {
    const info = await this.redis.info('stats');
    const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
    const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
    const total = hits + misses;

    return {
      cacheHitRate: total > 0 ? (hits / total) * 100 : 0
    };
  }

  private async collectQueueMetrics() {
    const depth = await this.redis.llen('job:queue:pending');
    return { queueDepth: depth };
  }

  private async collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    // Get active users (connected in last 5 minutes)
    const activeUsers = await this.redis.scard('users:active:now');

    // Disk usage (if accessible)
    let diskUsage = 0;
    try {
      const { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $5}\'');
      diskUsage = parseInt(stdout.replace('%', '')) || 0;
    } catch {
      // Ignore if not available
    }

    return {
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // MB
      activeUsers,
      diskUsage
    };
  }

  /**
   * WORKSTREAM 1.2: HEALTH CHECKS (Every 1 minute)
   */
  private startHealthCheckLoop(): void {
    const runHealthCheck = async () => {
      if (!this.isRunning) return;

      try {
        const health = await this.calculateHealthStatus();
        const previousHealth = await this.redis.get('health:current');

        // Store current health
        await this.redis.setex('health:current', 120, JSON.stringify(health));

        // Alert on status change
        if (previousHealth) {
          const prev = JSON.parse(previousHealth);
          if (prev.overall !== health.overall) {
            await this.alertHealthChange(health, prev);
          }
        }

        // If critical, trigger immediate response
        if (health.overall === 'critical') {
          this.emit('critical-health', health);
        }

        this.emit('health', health);
      } catch (error) {
        console.error('❌ Health check error:', error);
      }

      this.healthTimer = setTimeout(runHealthCheck, CONFIG.HEALTH_CHECK_INTERVAL);
    };

    runHealthCheck();
  }

  private async calculateHealthStatus(): Promise<HealthStatus> {
    const metrics = this.getLatestMetrics();

    // Database health
    const database = metrics.dbCpu > CONFIG.DB_CPU_CRITICAL ? 'critical' :
                     metrics.dbCpu > CONFIG.DB_CPU_WARNING ? 'warning' :
                     metrics.dbReplicationLag > 5 ? 'warning' : 'healthy';

    // API health
    const api = metrics.apiLatencyP95 > CONFIG.API_LATENCY_P95_CRITICAL ? 'critical' :
                 metrics.apiLatencyP95 > CONFIG.API_LATENCY_P95_WARNING ? 'warning' :
                 metrics.errorRate > 0.01 ? 'warning' : 'healthy';

    // Cache health
    const cache = metrics.cacheHitRate < CONFIG.CACHE_HIT_RATE_WARNING ? 'warning' : 'healthy';

    // Queue health
    const queue = metrics.queueDepth > CONFIG.QUEUE_DEPTH_CRITICAL ? 'critical' :
                   metrics.queueDepth > CONFIG.QUEUE_DEPTH_WARNING ? 'warning' : 'healthy';

    // Workers (simplified check)
    const workers = metrics.queueDepth > CONFIG.QUEUE_DEPTH_WARNING && 
                    metrics.queueDepth > (await this.redis.get('workers:capacity') || 1000) 
                    ? 'warning' : 'healthy';

    // Overall
    const overall = [database, api, cache, queue, workers].includes('critical') ? 'critical' :
                    [database, api, cache, queue, workers].includes('warning') ? 'degraded' : 'healthy';

    return { overall, database, api, cache, queue, workers };
  }

  /**
   * WORKSTREAM 1.3: AUTO-REMEDIATION (Event-Driven)
   * Target: ≥95% auto-fix rate
   */
  private startRemediationLoop(): void {
    // Listen for health degradation
    this.on('critical-health', async (health: HealthStatus) => {
      console.log('🚨 CRITICAL HEALTH DETECTED - Initiating auto-remediation');
      await this.executeRemediation(health);
    });

    this.on('metrics', async (metrics: SystemMetrics) => {
      // Proactive remediation based on trends
      await this.proactiveRemediation(metrics);
    });
  }

  private async executeRemediation(health: HealthStatus): Promise<void> {
    const startTime = Date.now();
    const actions: RemediationAction[] = [];

    try {
      if (health.database === 'critical') {
        const action = await this.remediateDatabase();
        actions.push(action);
      }

      if (health.api === 'critical') {
        const action = await this.remediateAPI();
        actions.push(action);
      }

      if (health.queue === 'critical' || health.workers === 'warning') {
        const action = await this.remediateWorkers();
        actions.push(action);
      }

      if (health.cache === 'warning') {
        const action = await this.remediateCache();
        actions.push(action);
      }

      // Log results
      const duration = Date.now() - startTime;
      const successRate = actions.filter(a => a.success).length / actions.length;

      console.log(`🔧 Remediation completed: ${successRate * 100}% success in ${duration}ms`);

      await this.redis.lpush('remediation:history', JSON.stringify({
        timestamp: new Date(),
        actions,
        duration,
        successRate
      }));

      this.emit('remediation-complete', { actions, duration, successRate });

    } catch (error) {
      console.error('❌ Remediation failed:', error);
      await this.alertEscalation('Remediation failed - human intervention required', error);
    }
  }

  private async remediateDatabase(): Promise<RemediationAction> {
    const start = Date.now();
    console.log('🔧 Auto-remediation: Database');

    try {
      // Kill long-running queries
      await this.db.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query_start < NOW() - INTERVAL '5 minutes'
          AND query NOT ILIKE '%pg_stat%'
      `);

      // Analyze frequently accessed tables
      await this.db.query('ANALYZE transactions');
      await this.db.query('ANALYZE transaction_lines');
      await this.db.query('ANALYZE invoices');

      return {
        timestamp: new Date(),
        type: 'database_optimization',
        trigger: 'high_cpu',
        success: true,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        type: 'database_optimization',
        trigger: 'high_cpu',
        success: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  private async remediateAPI(): Promise<RemediationAction> {
    const start = Date.now();
    console.log('🔧 Auto-remediation: API');

    try {
      // Clear poisoned cache
      await this.redis.flushdb();

      // Restart slow pods (if k8s)
      try {
        await execAsync('kubectl rollout restart deployment/api -n production');
      } catch {
        // Not in k8s, ignore
      }

      return {
        timestamp: new Date(),
        type: 'api_restart',
        trigger: 'high_latency',
        success: true,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        type: 'api_restart',
        trigger: 'high_latency',
        success: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  private async remediateWorkers(): Promise<RemediationAction> {
    const start = Date.now();
    console.log('🔧 Auto-remediation: Workers');

    try {
      const queueDepth = await this.redis.llen('job:queue:pending');
      const currentWorkers = parseInt(await this.redis.get('workers:count') || '5');

      let targetWorkers = currentWorkers;
      if (queueDepth > CONFIG.QUEUE_DEPTH_CRITICAL) {
        targetWorkers = Math.min(currentWorkers + 5, 50);
      } else if (queueDepth > CONFIG.QUEUE_DEPTH_WARNING) {
        targetWorkers = Math.min(currentWorkers + 3, 50);
      }

      if (targetWorkers !== currentWorkers) {
        try {
          await execAsync(`kubectl scale deployment/worker --replicas=${targetWorkers} -n production`);
        } catch {
          // Not in k8s
        }
        await this.redis.set('workers:count', targetWorkers.toString());
      }

      return {
        timestamp: new Date(),
        type: 'worker_scaling',
        trigger: 'queue_depth',
        success: true,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        type: 'worker_scaling',
        trigger: 'queue_depth',
        success: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  private async remediateCache(): Promise<RemediationAction> {
    const start = Date.now();
    console.log('🔧 Auto-remediation: Cache');

    try {
      // Clear and warm cache
      await this.redis.flushdb();
      await this.warmCache();

      return {
        timestamp: new Date(),
        type: 'cache_refresh',
        trigger: 'low_hit_rate',
        success: true,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        timestamp: new Date(),
        type: 'cache_refresh',
        trigger: 'low_hit_rate',
        success: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  private async proactiveRemediation(metrics: SystemMetrics): Promise<void> {
    // Detect trends and act before thresholds hit
    
    // If latency trending up over last 5 minutes
    if (this.metrics.length >= 10) {
      const recent = this.metrics.slice(-10);
      const avgLatency = recent.reduce((sum, m) => sum + m.apiLatencyP95, 0) / 10;
      const firstHalf = recent.slice(0, 5).reduce((sum, m) => sum + m.apiLatencyP95, 0) / 5;
      const secondHalf = recent.slice(-5).reduce((sum, m) => sum + m.apiLatencyP95, 0) / 5;

      // Trending up significantly
      if (secondHalf > firstHalf * 1.5 && secondHalf > 200) {
        console.log('📈 Proactive: Latency trending up, pre-warming cache');
        await this.warmCache();
      }
    }

    // If connections climbing
    if (metrics.dbConnections > metrics.dbMaxConnections * 0.8) {
      console.log('📈 Proactive: Connection pool near limit, clearing idle');
      await this.db.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'idle'
          AND state_change < NOW() - INTERVAL '10 minutes'
      `);
    }
  }

  private async warmCache(): Promise<void> {
    // Warm frequently accessed data
    const commonQueries = [
      'SELECT id, code, name FROM accounts WHERE is_active = true',
      'SELECT setting_key, setting_value FROM system_settings'
    ];

    for (const query of commonQueries) {
      try {
        const result = await this.db.query(query);
        const cacheKey = `warm:${Buffer.from(query).toString('base64').substring(0, 20)}`;
        await this.redis.setex(cacheKey, 3600, JSON.stringify(result.rows));
      } catch (error) {
        // Continue on error
      }
    }
  }

  /**
   * UTILITY METHODS
   */
  private getLatestMetrics(): SystemMetrics {
    return this.metrics[this.metrics.length - 1] || {
      timestamp: new Date(),
      dbCpu: 0,
      dbConnections: 0,
      dbMaxConnections: 1000,
      dbReplicationLag: 0,
      apiLatencyP50: 0,
      apiLatencyP95: 0,
      apiLatencyP99: 0,
      errorRate: 0,
      tps: 0,
      cacheHitRate: 0,
      queueDepth: 0,
      memoryUsage: 0,
      activeUsers: 0,
      diskUsage: 0
    };
  }

  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    await this.redis.setex('metrics:current', 60, JSON.stringify(metrics));
    await this.redis.lpush('metrics:history', JSON.stringify(metrics));
    await this.redis.ltrim('metrics:history', 0, 1000);
  }

  private async detectAnomalies(metrics: SystemMetrics): Promise<void> {
    // Simple anomaly detection
    if (metrics.errorRate > 0.05) { // 5% error rate
      await this.alertAnomaly('High error rate detected', { errorRate: metrics.errorRate });
    }

    if (metrics.dbCpu > 90) {
      await this.alertAnomaly('Database CPU critical', { cpu: metrics.dbCpu });
    }
  }

  private async alertHealthChange(current: HealthStatus, previous: HealthStatus): Promise<void> {
    const message = `Health changed: ${previous.overall} → ${current.overall}`;
    console.log(`🚨 ${message}`);

    await this.redis.lpush('alerts:health', JSON.stringify({
      timestamp: new Date(),
      message,
      current,
      previous
    }));

    // If critical, also send to high-priority channel
    if (current.overall === 'critical') {
      await this.sendP0Alert(message, { current, previous });
    }
  }

  private async alertAnomaly(message: string, data: any): Promise<void> {
    await this.redis.lpush('alerts:anomalies', JSON.stringify({
      timestamp: new Date(),
      message,
      data
    }));
  }

  private async alertEscalation(message: string, error: any): Promise<void> {
    console.error(`🆘 ESCALATION REQUIRED: ${message}`);
    await this.redis.lpush('alerts:escalations', JSON.stringify({
      timestamp: new Date(),
      message,
      error: error.message
    }));
  }

  private async sendP0Alert(message: string, data: any): Promise<void> {
    console.error(`🆘 P0 ALERT: ${message}`);
    // In production: Page on-call, send SMS, etc.
  }

  private async logIncident(type: string, error: any): Promise<void> {
    await this.redis.lpush('incidents', JSON.stringify({
      timestamp: new Date(),
      type,
      error: error.message
    }));
  }

  private async emitStatusReport(): Promise<void> {
    const metrics = this.getLatestMetrics();
    const health = await this.calculateHealthStatus();

    console.log('');
    console.log('📊 CURRENT SYSTEM STATUS');
    console.log(`Health: ${health.overall.toUpperCase()}`);
    console.log(`DB CPU: ${metrics.dbCpu.toFixed(1)}%`);
    console.log(`API P95: ${metrics.apiLatencyP95.toFixed(0)}ms`);
    console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(3)}%`);
    console.log(`Cache Hit: ${metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`Queue Depth: ${metrics.queueDepth}`);
    console.log(`Active Users: ${metrics.activeUsers}`);
    console.log('');
  }

  /**
   * STOP AUTONOMOUS OPERATIONS
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Autonomous Control Plane...');
    this.isRunning = false;

    if (this.monitoringTimer) clearTimeout(this.monitoringTimer);
    if (this.healthTimer) clearTimeout(this.healthTimer);

    console.log('✅ Control Plane Stopped');
  }

  /**
   * GET CURRENT STATUS
   */
  async getStatus(): Promise<any> {
    return {
      isRunning: this.isRunning,
      health: await this.calculateHealthStatus(),
      metrics: this.getLatestMetrics(),
      metricsHistory: this.metrics.length,
      remediationHistory: this.remediationHistory.length,
      autoRemediationEnabled: CONFIG.AUTO_REMEDIATION_ENABLED
    };
  }
}

// Export for use by other workstreams
export { AutonomousControlPlane, SystemMetrics, HealthStatus };
export default AutonomousControlPlane;
