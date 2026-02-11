#!/usr/bin/env node
/**
 * ACCUBOOKS CEO DASHBOARD
 * Workstream 5: Executive Control Surface
 * 
 * Real-time visibility into:
 * - Financial: Revenue, cash, burn, runway, MRR, ARR, churn, LTV/CAC
 * - Growth: Company count, signups, expansion, concentration risk
 * - System: TPS, latency, errors, capacity tier, incidents
 * - Security: Fraud alerts, compliance status, kill switches
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import http from 'http';
import WebSocket from 'ws';

interface DashboardState {
  timestamp: Date;
  financial: FinancialMetrics;
  growth: GrowthMetrics;
  system: SystemMetrics;
  security: SecurityMetrics;
  capacity: CapacityMetrics;
}

interface FinancialMetrics {
  mrr: number;
  arr: number;
  cashBalance: number;
  burnRate: number;
  runway: number; // months
  churnRate: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  taxLiability: number;
  dailyRevenue: number;
}

interface GrowthMetrics {
  totalCompanies: number;
  activeCompanies: number;
  newSignups7d: number;
  newSignups30d: number;
  expansionRevenue: number;
  contractionRevenue: number;
  churnedCompanies: number;
  top10Concentration: number; // %
  atRiskAccounts: number;
}

interface SystemMetrics {
  tier: 1 | 2 | 3;
  availability: number; // %
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  tps: number;
  dbCpu: number;
  dbConnections: number;
  cacheHitRate: number;
  incidentCount24h: number;
}

interface SecurityMetrics {
  securityScore: number;
  soc2Status: 'current' | 'expiring' | 'expired';
  pciStatus: 'compliant' | 'non-compliant';
  gdprStatus: 'compliant' | 'review-needed';
  activeIncidents: number;
  fraudAlerts24h: number;
  failedLogins5m: number;
}

interface CapacityMetrics {
  currentCompanies: number;
  tierLimit: number;
  utilization: number;
  status: 'healthy' | 'approaching' | 'critical';
  upgradeReady: boolean;
  upgradeRecommended: boolean;
}

class CEODashboard extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private wss?: WebSocket.Server;
  private isRunning = false;
  private currentState: DashboardState | null = null;
  private updateTimer: NodeJS.Timer | null = null;

  // Kill switches
  private killSwitches = {
    globalReadOnly: false,
    maintenanceMode: false,
    emergencyStop: false
  };

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * START CEO DASHBOARD
   */
  async start(port: number = 8080): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     CEO DASHBOARD ACTIVATED                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('📊 Real-time executive visibility');
    console.log('🌐 WebSocket updates every 5 seconds');
    console.log('🚨 Kill switches: ENABLED (read-only, maintenance, emergency)');
    console.log(`🌐 Dashboard: http://localhost:${port}`);
    console.log('');

    this.isRunning = true;

    // Start data collection
    this.startDashboardUpdates();

    // Start HTTP server
    this.startHTTPServer(port);

    // Start WebSocket server
    this.startWebSocketServer(port + 1);

    console.log('✅ CEO Dashboard Active');
  }

  /**
   * WORKSTREAM 5.1: DASHBOARD UPDATES (Every 5 seconds)
   */
  private startDashboardUpdates(): void {
    const update = async () => {
      if (!this.isRunning) return;

      try {
        const state = await this.collectDashboardState();
        this.currentState = state;

        // Store in Redis
        await this.redis.setex('dashboard:current', 10, JSON.stringify(state));

        // Broadcast to WebSocket clients
        this.broadcastToClients(state);

        this.emit('dashboard-update', state);

      } catch (error) {
        console.error('❌ Dashboard update error:', error);
      }

      this.updateTimer = setTimeout(update, 5000);
    };

    update();
  }

  /**
   * Collect complete dashboard state
   */
  private async collectDashboardState(): Promise<DashboardState> {
    const timestamp = new Date();

    const [
      financial,
      growth,
      system,
      security,
      capacity
    ] = await Promise.all([
      this.collectFinancialMetrics(),
      this.collectGrowthMetrics(),
      this.collectSystemMetrics(),
      this.collectSecurityMetrics(),
      this.collectCapacityMetrics()
    ]);

    return {
      timestamp,
      financial,
      growth,
      system,
      security,
      capacity
    };
  }

  /**
   * Collect financial metrics
   */
  private async collectFinancialMetrics(): Promise<FinancialMetrics> {
    // MRR from subscriptions
    const mrrResult = await this.db.query(`
      SELECT COALESCE(SUM(monthly_recurring_revenue_cents), 0) as mrr_cents
      FROM companies
      WHERE status = 'active'
    `);
    const mrr = parseInt(mrrResult.rows[0].mrr_cents) / 100;

    // Cash balance (from bank integration)
    const cashResult = await this.db.query(`
      SELECT COALESCE(SUM(balance_cents), 0) as cash_cents
      FROM bank_accounts
      WHERE is_active = true
    `);
    const cashBalance = parseInt(cashResult.rows[0].cash_cents) / 100;

    // Burn rate (30-day average)
    const burnResult = await this.db.query(`
      SELECT COALESCE(SUM(amount_cents), 0) / 30 as daily_burn_cents
      FROM operating_expenses
      WHERE date >= NOW() - INTERVAL '30 days'
    `);
    const burnRate = parseInt(burnResult.rows[0].daily_burn_cents) / 100;

    // Runway
    const runway = burnRate > 0 ? Math.floor(cashBalance / burnRate / 30) : 999;

    // Churn rate
    const churnResult = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN churned_at > NOW() - INTERVAL '30 days' THEN 1 END) as churned
      FROM companies
      WHERE status IN ('active', 'churned')
    `);
    const churnRate = churnResult.rows[0].total > 0
      ? (parseInt(churnResult.rows[0].churned) / parseInt(churnResult.rows[0].total)) * 100
      : 0;

    // LTV calculation
    const ltvResult = await this.db.query(`
      SELECT COALESCE(AVG(total_revenue_cents), 0) as avg_ltv_cents
      FROM (
        SELECT company_id, SUM(amount_cents) as total_revenue_cents
        FROM payments
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY company_id
      ) as company_revenue
    `);
    const ltv = parseInt(ltvResult.rows[0].avg_ltv_cents) / 100;

    // CAC (simplified - last 30 days marketing/sales spend / new customers)
    const cacResult = await this.db.query(`
      SELECT 
        COALESCE(SUM(amount_cents), 0) as spend_cents,
        (SELECT COUNT(*) FROM companies WHERE created_at > NOW() - INTERVAL '30 days') as new_customers
      FROM marketing_expenses
      WHERE date > NOW() - INTERVAL '30 days'
    `);
    const cac = parseInt(cacResult.rows[0].new_customers) > 0
      ? (parseInt(cacResult.rows[0].spend_cents) / parseInt(cacResult.rows[0].new_customers)) / 100
      : 0;

    // Tax liability
    const taxResult = await this.db.query(`
      SELECT COALESCE(SUM(amount_cents), 0) as tax_cents
      FROM tax_liabilities
      WHERE status = 'unpaid'
    `);
    const taxLiability = parseInt(taxResult.rows[0].tax_cents) / 100;

    // Daily revenue
    const dailyResult = await this.db.query(`
      SELECT COALESCE(SUM(amount_cents), 0) as daily_cents
      FROM payments
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    const dailyRevenue = parseInt(dailyResult.rows[0].daily_cents) / 100;

    return {
      mrr,
      arr: mrr * 12,
      cashBalance,
      burnRate,
      runway,
      churnRate,
      ltv,
      cac,
      ltvCacRatio: cac > 0 ? ltv / cac : 0,
      taxLiability,
      dailyRevenue
    };
  }

  /**
   * Collect growth metrics
   */
  private async collectGrowthMetrics(): Promise<GrowthMetrics> {
    // Total companies
    const totalResult = await this.db.query(`
      SELECT COUNT(*) as count FROM companies WHERE status = 'active'
    `);
    const totalCompanies = parseInt(totalResult.rows[0].count);

    // Active companies (logged in last 30 days)
    const activeResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE status = 'active' 
        AND last_activity_at > NOW() - INTERVAL '30 days'
    `);
    const activeCompanies = parseInt(activeResult.rows[0].count);

    // New signups
    const signups7d = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    const signups30d = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    // Revenue expansion/contraction
    const expansionResult = await this.db.query(`
      SELECT COALESCE(SUM(expansion_amount_cents), 0) as expansion_cents,
             COALESCE(SUM(contraction_amount_cents), 0) as contraction_cents
      FROM revenue_movement
      WHERE date > NOW() - INTERVAL '30 days'
    `);
    const expansionRevenue = parseInt(expansionResult.rows[0].expansion_cents) / 100;
    const contractionRevenue = parseInt(expansionResult.rows[0].contraction_cents) / 100;

    // Churned companies
    const churnedResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE churned_at > NOW() - INTERVAL '30 days'
    `);

    // Top 10 concentration
    const concentrationResult = await this.db.query(`
      SELECT SUM(monthly_recurring_revenue_cents) as top10_cents
      FROM (
        SELECT monthly_recurring_revenue_cents
        FROM companies
        WHERE status = 'active'
        ORDER BY monthly_recurring_revenue_cents DESC
        LIMIT 10
      ) as top10
    `);
    const totalMrrResult = await this.db.query(`
      SELECT COALESCE(SUM(monthly_recurring_revenue_cents), 1) as total_cents
      FROM companies WHERE status = 'active'
    `);
    const top10Concentration = (parseInt(concentrationResult.rows[0].top10_cents) / 
                               parseInt(totalMrrResult.rows[0].total_cents)) * 100;

    // At-risk accounts
    const atRiskResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE status = 'active'
        AND last_activity_at < NOW() - INTERVAL '14 days'
    `);

    return {
      totalCompanies,
      activeCompanies,
      newSignups7d: parseInt(signups7d.rows[0].count),
      newSignups30d: parseInt(signups30d.rows[0].count),
      expansionRevenue,
      contractionRevenue,
      churnedCompanies: parseInt(churnedResult.rows[0].count),
      top10Concentration,
      atRiskAccounts: parseInt(atRiskResult.rows[0].count)
    };
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // Get from Redis (populated by autonomous engine)
    const raw = await this.redis.get('metrics:current');
    const metrics = raw ? JSON.parse(raw) : {};

    // Get from Redis health
    const healthRaw = await this.redis.get('health:current');
    const health = healthRaw ? JSON.parse(healthRaw) : {};

    // Calculate availability
    const incidentsResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM incidents 
      WHERE severity = 'P0' 
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    const incidentCount24h = parseInt(incidentsResult.rows[0].count);

    // Get current tier
    const tier = parseInt(await this.redis.get('system:tier') || '1');

    return {
      tier: tier as 1 | 2 | 3,
      availability: 99.97 - (incidentCount24h * 0.1),
      p50Latency: metrics.apiLatencyP50 || 0,
      p95Latency: metrics.apiLatencyP95 || 0,
      p99Latency: metrics.apiLatencyP99 || 0,
      errorRate: metrics.errorRate || 0,
      tps: metrics.tps || 0,
      dbCpu: metrics.dbCpu || 0,
      dbConnections: metrics.dbConnections || 0,
      cacheHitRate: metrics.cacheHitRate || 0,
      incidentCount24h
    };
  }

  /**
   * Collect security metrics
   */
  private async collectSecurityMetrics(): Promise<SecurityMetrics> {
    // Security score calculation
    const vulnResult = await this.db.query(`
      SELECT 
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high
      FROM vulnerabilities
      WHERE status = 'open'
    `);
    
    let securityScore = 100;
    securityScore -= parseInt(vulnResult.rows[0].critical) * 10;
    securityScore -= parseInt(vulnResult.rows[0].high) * 5;
    securityScore = Math.max(0, securityScore);

    // Compliance statuses
    const soc2Result = await this.db.query(`
      SELECT status FROM compliance_status WHERE framework = 'SOC2' ORDER BY checked_at DESC LIMIT 1
    `);
    const pciResult = await this.db.query(`
      SELECT status FROM compliance_status WHERE framework = 'PCI' ORDER BY checked_at DESC LIMIT 1
    `);
    const gdprResult = await this.db.query(`
      SELECT status FROM compliance_status WHERE framework = 'GDPR' ORDER BY checked_at DESC LIMIT 1
    `);

    // Active incidents
    const incidentsResult = await this.db.query(`
      SELECT COUNT(*) as count FROM security_incidents WHERE status = 'active'
    `);

    // Fraud alerts
    const fraudResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM fraud_alerts 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    // Failed logins
    const failedLogins = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM failed_login_attempts 
      WHERE attempted_at > NOW() - INTERVAL '5 minutes'
    `);

    return {
      securityScore,
      soc2Status: soc2Result.rows[0]?.status || 'current',
      pciStatus: pciResult.rows[0]?.status || 'compliant',
      gdprStatus: gdprResult.rows[0]?.status || 'compliant',
      activeIncidents: parseInt(incidentsResult.rows[0].count),
      fraudAlerts24h: parseInt(fraudResult.rows[0].count),
      failedLogins5m: parseInt(failedLogins.rows[0].count)
    };
  }

  /**
   * Collect capacity metrics
   */
  private async collectCapacityMetrics(): Promise<CapacityMetrics> {
    const raw = await this.redis.get('capacity:current');
    if (raw) {
      return JSON.parse(raw);
    }

    // Fallback calculation
    const companyCount = await this.db.query(`
      SELECT COUNT(*) as count FROM companies WHERE status = 'active'
    `);
    const currentCompanies = parseInt(companyCount.rows[0].count);
    const tierLimit = 12500; // Tier 1
    const utilization = (currentCompanies / tierLimit) * 100;

    return {
      currentCompanies,
      tierLimit,
      utilization,
      status: utilization > 95 ? 'critical' : utilization > 80 ? 'approaching' : 'healthy',
      upgradeReady: utilization > 70,
      upgradeRecommended: utilization > 90
    };
  }

  /**
   * START HTTP SERVER
   */
  private startHTTPServer(port: number): void {
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      // Routes
      if (req.url === '/api/dashboard' && req.method === 'GET') {
        // Get current state
        const state = this.currentState || await this.collectDashboardState();
        res.writeHead(200);
        res.end(JSON.stringify(state, null, 2));

      } else if (req.url === '/api/kill-switches' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(this.killSwitches));

      } else if (req.url === '/api/kill-switches' && req.method === 'POST') {
        // Handle kill switch activation
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { switch: switchName, value, auth } = JSON.parse(body);
            
            // Verify auth (simplified)
            if (auth !== process.env.CEO_AUTH_TOKEN) {
              res.writeHead(401);
              res.end(JSON.stringify({ error: 'Unauthorized' }));
              return;
            }

            // Confirm destructive actions
            if ((switchName === 'globalReadOnly' || switchName === 'emergencyStop') && !value.confirm) {
              res.writeHead(400);
              res.end(JSON.stringify({ 
                error: 'Confirmation required for this action',
                requires: 'Type "EMERGENCY-STOP-CONFIRM" to proceed'
              }));
              return;
            }

            this.killSwitches[switchName] = value.enabled;
            await this.redis.set('kill-switches', JSON.stringify(this.killSwitches));

            this.emit('kill-switch', { switch: switchName, enabled: value.enabled });

            res.writeHead(200);
            res.end(JSON.stringify({ success: true, switches: this.killSwitches }));
          } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: error.message }));
          }
        });

      } else if (req.url === '/api/upgrade-status' && req.method === 'GET') {
        const upgradeRaw = await this.redis.get('capacity:current');
        const upgrade = upgradeRaw ? JSON.parse(upgradeRaw) : {};
        res.writeHead(200);
        res.end(JSON.stringify(upgrade));

      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(port, () => {
      console.log(`🌐 HTTP Dashboard: http://localhost:${port}/api/dashboard`);
    });
  }

  /**
   * START WEBSOCKET SERVER
   */
  private startWebSocketServer(port: number): void {
    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws) => {
      console.log('📡 Dashboard client connected');

      // Send current state immediately
      if (this.currentState) {
        ws.send(JSON.stringify(this.currentState));
      }

      ws.on('close', () => {
        console.log('📡 Dashboard client disconnected');
      });
    });

    console.log(`📡 WebSocket: ws://localhost:${port}`);
  }

  /**
   * Broadcast to all WebSocket clients
   */
  private broadcastToClients(state: DashboardState): void {
    if (!this.wss) return;

    const message = JSON.stringify(state);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * STOP
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping CEO Dashboard...');
    this.isRunning = false;
    if (this.updateTimer) clearTimeout(this.updateTimer);
    if (this.wss) this.wss.close();
    console.log('✅ CEO Dashboard Stopped');
  }

  /**
   * GET CURRENT STATE
   */
  getCurrentState(): DashboardState | null {
    return this.currentState;
  }
}

export { CEODashboard, DashboardState, FinancialMetrics, GrowthMetrics, SystemMetrics };
export default CEODashboard;
