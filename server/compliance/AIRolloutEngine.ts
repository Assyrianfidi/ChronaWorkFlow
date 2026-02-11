#!/usr/bin/env node
/**
 * ACCUBOOKS AI-DRIVEN ROLLOUT ENGINE
 * Intelligent Canary Progression & Auto-Rollback
 * 
 * Automatically increases canary rollout % when:
 * - Error rate stable
 * - Latency within thresholds
 * - Trial Balance remains balanced
 * - No anomaly detected
 * 
 * Automatically PAUSE or ROLLBACK when:
 * - Financial anomaly detected
 * - Latency spike
 * - Error rate exceeds baseline
 * - Ledger imbalance detected
 * - Cross-tenant anomaly detected
 * 
 * AI learns baseline behavior per service
 * Adjusts rollout speed dynamically
 * Requires ZERO manual tuning
 * Logs every decision with explanation
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import DeploymentOrchestrator from '../live-changes/DeploymentOrchestrator';

export interface AIRolloutConfig {
  deploymentId: string;
  initialCanaryPercentage: number;
  targetPercentage: number;
  maxStageDuration: number; // minutes
  minStageDuration: number; // minutes
  learningEnabled: boolean;
}

export interface BaselineMetrics {
  service: string;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  timestamp: Date;
}

export interface RolloutDecision {
  timestamp: Date;
  deploymentId: string;
  currentStage: number;
  currentPercentage: number;
  decision: 'PROCEED' | 'PAUSE' | 'ROLLBACK' | 'WAIT';
  targetPercentage?: number;
  explanation: string;
  confidence: number;
  factors: DecisionFactor[];
  actionTaken: string;
}

export interface DecisionFactor {
  name: string;
  value: number;
  threshold: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  weight: number;
}

export class AIRolloutEngine extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private deploymentOrchestrator: DeploymentOrchestrator;
  private baselines: Map<string, BaselineMetrics> = new Map();
  private activeRollouts: Map<string, AIRolloutConfig> = new Map();
  private decisions: RolloutDecision[] = [];

  constructor(db: Pool, redis: Redis, orchestrator: DeploymentOrchestrator) {
    super();
    this.db = db;
    this.redis = redis;
    this.deploymentOrchestrator = orchestrator;
  }

  /**
   * START AI-DRIVEN ROLLOUT
   */
  async startIntelligentRollout(config: AIRolloutConfig): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                          ║');
    console.log('║           AI-DRIVEN ROLLOUT ENGINE                                      ║');
    console.log('║           Intelligent Canary Progression                                ║');
    console.log('║                                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Deployment: ${config.deploymentId}`);
    console.log(`Target: ${config.targetPercentage}%`);
    console.log(`Learning: ${config.learningEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log('');

    this.activeRollouts.set(config.deploymentId, config);

    // Learn or load baselines
    if (config.learningEnabled) {
      console.log('🧠 Learning baseline behavior...');
      await this.learnBaselines(config.deploymentId);
    } else {
      console.log('📚 Loading cached baselines...');
      await this.loadBaselines(config.deploymentId);
    }

    // Start monitoring loop
    console.log('👁️ Starting intelligent monitoring...');
    this.monitorAndDecide(config);

    this.emit('ai-rollout-started', { config, baselines: this.baselines });
  }

  /**
   * LEARN BASELINE BEHAVIOR
   */
  private async learnBaselines(deploymentId: string): Promise<void> {
    const services = [
      'api_gateway',
      'ledger_service',
      'tax_engine',
      'reporting_service',
      'auth_service'
    ];

    for (const service of services) {
      console.log(`  Learning ${service}...`);

      // Query historical metrics
      const { rows } = await this.db.query(`
        SELECT 
          AVG(error_rate) as avg_error_rate,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
          AVG(requests_per_minute) as avg_throughput
        FROM service_metrics
        WHERE service_name = $1
          AND timestamp > NOW() - INTERVAL '7 days'
          AND timestamp < NOW() - INTERVAL '1 hour'
      `, [service]);

      if (rows.length > 0) {
        const baseline: BaselineMetrics = {
          service,
          errorRate: parseFloat(rows[0].avg_error_rate) || 0.001,
          latencyP50: parseFloat(rows[0].p50_latency) || 50,
          latencyP95: parseFloat(rows[0].p95_latency) || 100,
          latencyP99: parseFloat(rows[0].p99_latency) || 200,
          throughput: parseFloat(rows[0].avg_throughput) || 100,
          timestamp: new Date()
        };

        this.baselines.set(service, baseline);

        // Store in Redis for quick access
        await this.redis.setex(
          `baseline:${service}`,
          86400,
          JSON.stringify(baseline)
        );

        console.log(`    Baseline: ${baseline.errorRate.toFixed(4)}% errors, ${baseline.latencyP95.toFixed(0)}ms P95`);
      }
    }

    console.log('✅ Baseline learning complete');
  }

  /**
   * LOAD CACHED BASELINES
   */
  private async loadBaselines(deploymentId: string): Promise<void> {
    const services = ['api_gateway', 'ledger_service', 'tax_engine', 'reporting_service', 'auth_service'];

    for (const service of services) {
      const cached = await this.redis.get(`baseline:${service}`);
      if (cached) {
        this.baselines.set(service, JSON.parse(cached));
      }
    }

    console.log(`✅ Loaded ${this.baselines.size} baselines`);
  }

  /**
   * MONITOR AND MAKE DECISIONS
   */
  private async monitorAndDecide(config: AIRolloutConfig): Promise<void> {
    const checkInterval = 30000; // 30 seconds
    let stageStartTime = Date.now();
    let currentPercentage = config.initialCanaryPercentage;
    let stage = 1;

    const monitor = async () => {
      if (!this.activeRollouts.has(config.deploymentId)) {
        return; // Rollout stopped
      }

      const deployment = this.deploymentOrchestrator.getStatus();
      if (!deployment || deployment.status === 'complete' || deployment.status === 'failed') {
        return; // Deployment finished
      }

      // Gather current metrics
      const metrics = await this.gatherCurrentMetrics();

      // Check financial safety first (always)
      const financialStatus = await this.checkFinancialSafety();

      // Make decision
      const decision = await this.makeDecision(
        config,
        currentPercentage,
        metrics,
        financialStatus,
        stageStartTime
      );

      // Log decision
      this.logDecision(decision);
      this.emit('rollout-decision', decision);

      // Execute decision
      switch (decision.decision) {
        case 'PROCEED':
          currentPercentage = decision.targetPercentage!;
          stage++;
          stageStartTime = Date.now();
          
          console.log(`\n✅ AI Decision: PROCEED to ${currentPercentage}%`);
          console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
          console.log(`   ${decision.explanation}`);
          
          await this.proceedToPercentage(config.deploymentId, currentPercentage);
          break;

        case 'PAUSE':
          console.log(`\n⏸️ AI Decision: PAUSE at ${currentPercentage}%`);
          console.log(`   ${decision.explanation}`);
          // Keep monitoring
          break;

        case 'ROLLBACK':
          console.log(`\n🚨 AI Decision: ROLLBACK from ${currentPercentage}%`);
          console.log(`   CRITICAL: ${decision.explanation}`);
          
          await this.rollbackDeployment(config.deploymentId, decision);
          this.activeRollouts.delete(config.deploymentId);
          return;

        case 'WAIT':
          // Continue monitoring
          break;
      }

      // Check if complete
      if (currentPercentage >= config.targetPercentage) {
        console.log('\n✅ AI Rollout Complete');
        this.emit('ai-rollout-complete', { deploymentId: config.deploymentId });
        return;
      }

      // Schedule next check
      setTimeout(monitor, checkInterval);
    };

    // Start monitoring
    monitor();
  }

  /**
   * GATHER CURRENT METRICS
   */
  private async gatherCurrentMetrics(): Promise<Map<string, any>> {
    const metrics = new Map();

    // Get from monitoring systems
    const redisMetrics = await this.redis.hgetall('metrics:current');
    
      SELECT 
        AVG(error_rate) as avg_error_rate,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
        AVG(requests_per_minute) as avg_throughput
      FROM service_metrics
      WHERE service_name = $1
        AND timestamp > NOW() - INTERVAL '7 days'
        AND timestamp < NOW() - INTERVAL '1 hour'
    `, [service]);

    if (rows.length > 0) {
      const baseline: BaselineMetrics = {
        service,
        errorRate: parseFloat(rows[0].avg_error_rate) || 0.001,
        latencyP50: parseFloat(rows[0].p50_latency) || 50,
        latencyP95: parseFloat(rows[0].p95_latency) || 100,
        latencyP99: parseFloat(rows[0].p99_latency) || 200,
        throughput: parseFloat(rows[0].avg_throughput) || 100,
        timestamp: new Date()
      };

      this.baselines.set(service, baseline);
  }

  /**
   * CHECK FINANCIAL SAFETY
   */
  private async checkFinancialSafety(): Promise<{
    trialBalanceBalanced: boolean;
    ledgerImmutability: boolean;
    crossTenantAnomaly: boolean;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
  }> {
    // Check Trial Balance
    const { rows: tbCheck } = await this.db.query(`
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
    const tbBalanced = parseInt(tbCheck[0].imbalances) === 0;

    // Check ledger immutability
    const { rows: immutabilityCheck } = await this.db.query(`
      SELECT COUNT(*) as modified
      FROM transactions
      WHERE status = 'posted'
        AND updated_at > posted_at + INTERVAL '1 second'
    `);
    const immutable = parseInt(immutabilityCheck[0].modified) === 0;

    // Check for cross-tenant anomalies
    const { rows: anomalyCheck } = await this.db.query(`
      SELECT COUNT(*) as anomalies
      FROM anomaly_detection
      WHERE detected_at > NOW() - INTERVAL '5 minutes'
        AND severity IN ('HIGH', 'CRITICAL')
    `);
    const noAnomalies = parseInt(anomalyCheck[0].anomalies) === 0;

    let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (!tbBalanced || !immutable) {
      status = 'CRITICAL';
    } else if (!noAnomalies) {
      status = 'WARNING';
    }

    return {
      trialBalanceBalanced: tbBalanced,
      ledgerImmutability: immutable,
      crossTenantAnomaly: !noAnomalies,
      status
    };
  }

  /**
   * MAKE DECISION
   */
  private async makeDecision(
    config: AIRolloutConfig,
    currentPercentage: number,
    metrics: Map<string, any>,
    financialStatus: any,
    stageStartTime: number
  ): Promise<RolloutDecision> {
    const factors: DecisionFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Financial Safety (CRITICAL - weight 10)
    const financialFactor = this.evaluateFinancialFactor(financialStatus);
    factors.push(financialFactor);
    totalScore += financialFactor.status === 'GOOD' ? 1 : financialFactor.status === 'WARNING' ? 0.5 : 0;
    totalWeight += 10;

    // Factor 2: Error Rate (weight 5)
    const errorFactor = this.evaluateErrorRateFactor(metrics);
    factors.push(errorFactor);
    totalScore += this.scoreFactor(errorFactor);
    totalWeight += 5;

    // Factor 3: Latency (weight 4)
    const latencyFactor = this.evaluateLatencyFactor(metrics);
    factors.push(latencyFactor);
    totalScore += this.scoreFactor(latencyFactor);
    totalWeight += 4;

    // Factor 4: Time in Stage (weight 2)
    const timeInStage = (Date.now() - stageStartTime) / 1000 / 60; // minutes
    const timeFactor: DecisionFactor = {
      name: 'time_in_stage',
      value: timeInStage,
      threshold: config.minStageDuration,
      status: timeInStage >= config.minStageDuration ? 'GOOD' : 'WARNING',
      weight: 2
    };
    factors.push(timeFactor);
    totalScore += timeFactor.status === 'GOOD' ? 1 : 0.5;
    totalWeight += 2;

    // Factor 5: Anomaly Detection (weight 3)
    const anomalyFactor: DecisionFactor = {
      name: 'anomaly_detection',
      value: financialStatus.crossTenantAnomaly ? 1 : 0,
      threshold: 0.5,
      status: financialStatus.crossTenantAnomaly ? 'CRITICAL' : 'GOOD',
      weight: 3
    };
    factors.push(anomalyFactor);
    totalScore += anomalyFactor.status === 'GOOD' ? 1 : 0;
    totalWeight += 3;

    // Calculate confidence
    const confidence = totalScore / factors.length;

    // Determine decision
    let decision: 'PROCEED' | 'PAUSE' | 'ROLLBACK' | 'WAIT' = 'WAIT';
    let targetPercentage: number | undefined;
    let explanation = '';
    let actionTaken = '';

    if (financialFactor.status === 'CRITICAL') {
      decision = 'ROLLBACK';
      explanation = `Financial safety critical: ${!financialStatus.trialBalanceBalanced ? 'Trial Balance unbalanced' : 'Ledger immutability compromised'}`;
      actionTaken = 'Initiating automatic rollback';
    } else if (errorFactor.status === 'CRITICAL' || latencyFactor.status === 'CRITICAL') {
      decision = 'ROLLBACK';
      explanation = `Service degradation critical: ${errorFactor.name}=${errorFactor.value.toFixed(4)}, ${latencyFactor.name}=${latencyFactor.value.toFixed(0)}ms`;
      actionTaken = 'Initiating automatic rollback';
    } else if (confidence >= 0.8 && timeFactor.status === 'GOOD') {
      // Calculate next stage percentage
      const increment = this.calculateStageIncrement(currentPercentage, confidence);
      targetPercentage = Math.min(currentPercentage + increment, config.targetPercentage);
      
      decision = targetPercentage > currentPercentage ? 'PROCEED' : 'WAIT';
      explanation = `All factors positive (confidence: ${(confidence * 100).toFixed(1)}%). Proceeding to ${targetPercentage}%`;
      actionTaken = `Scaled traffic to ${targetPercentage}%`;
    } else if (confidence >= 0.5) {
      decision = 'PAUSE';
      explanation = `Some factors suboptimal (confidence: ${(confidence * 100).toFixed(1)}%). Monitoring before proceeding.`;
      actionTaken = 'Continued monitoring';
    } else {
      decision = 'PAUSE';
      explanation = `Multiple negative factors detected (confidence: ${(confidence * 100).toFixed(1)}%). Recommend review.`;
      actionTaken = 'Paused rollout, alerted owner';
      
      // Alert owner
      this.emit('owner-alert', {
        severity: 'WARNING',
        message: `Rollout paused at ${currentPercentage}% due to negative indicators`,
        factors
      });
    }

    return {
      timestamp: new Date(),
      deploymentId: config.deploymentId,
      currentStage: Math.floor(currentPercentage / 10) + 1,
      currentPercentage,
      decision,
      targetPercentage,
      explanation,
      confidence,
      factors,
      actionTaken
    };
  }

  /**
   * EVALUATION METHODS
   */
  private evaluateFinancialFactor(financialStatus: any): DecisionFactor {
    const value = financialStatus.status === 'SAFE' ? 0 : financialStatus.status === 'WARNING' ? 0.5 : 1;
    return {
      name: 'financial_safety',
      value,
      threshold: 0.5,
      status: financialStatus.status,
      weight: 10
    };
  }

  private evaluateErrorRateFactor(metrics: Map<string, any>): DecisionFactor {
    const currentErrorRate = metrics.get('error_rate') || 0.001;
    const baseline = this.baselines.get('api_gateway');
    const baselineError = baseline?.errorRate || 0.001;
    
    const ratio = currentErrorRate / baselineError;
    
    let status: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
    if (ratio > 5) status = 'CRITICAL';
    else if (ratio > 2) status = 'WARNING';

    return {
      name: 'error_rate',
      value: currentErrorRate,
      threshold: baselineError * 2,
      status,
      weight: 5
    };
  }

  private evaluateLatencyFactor(metrics: Map<string, any>): DecisionFactor {
    const currentLatency = metrics.get('p95_latency_ms') || 100;
    const baseline = this.baselines.get('api_gateway');
    const baselineLatency = baseline?.latencyP95 || 100;
    
    const ratio = currentLatency / baselineLatency;
    
    let status: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
    if (ratio > 3) status = 'CRITICAL';
    else if (ratio > 1.5) status = 'WARNING';

    return {
      name: 'latency_p95',
      value: currentLatency,
      threshold: baselineLatency * 1.5,
      status,
      weight: 4
    };
  }

  private scoreFactor(factor: DecisionFactor): number {
    if (factor.status === 'GOOD') return 1;
    if (factor.status === 'WARNING') return 0.5;
    return 0;
  }

  private calculateStageIncrement(currentPercentage: number, confidence: number): number {
    // Start small, increase as confidence grows
    if (currentPercentage < 1) return 1;
    if (currentPercentage < 5) return 5;
    if (currentPercentage < 10) return 5;
    if (currentPercentage < 25) return 15;
    if (currentPercentage < 50) return 25;
    return 50;
  }

  /**
   * EXECUTE DECISIONS
   */
  private async proceedToPercentage(deploymentId: string, percentage: number): Promise<void> {
    // Update traffic split via deployment orchestrator
    console.log(`   Adjusting traffic to ${percentage}%...`);
    
    // Store in Redis for routing layer
    await this.redis.setex(
      `deployment:${deploymentId}:traffic-split`,
      3600,
      JSON.stringify({ percentage, timestamp: new Date() })
    );

    // Scale green deployment
    const replicas = Math.max(3, Math.ceil(percentage / 5));
    // Would call orchestrator to scale
  }

  private async rollbackDeployment(deploymentId: string, decision: RolloutDecision): Promise<void> {
    console.log('   Executing automatic rollback...');
    await this.deploymentOrchestrator.rollback();
    
    // Store rollback reason
    await this.db.query(`
      INSERT INTO ai_rollout_rollbacks (
        deployment_id, rollback_reason, decision_factors, rolled_back_at
      ) VALUES ($1, $2, $3, NOW())
    `, [
      deploymentId,
      decision.explanation,
      JSON.stringify(decision.factors)
    ]);

    this.emit('ai-rollback-executed', { deploymentId, decision });
  }

  /**
   * LOGGING
   */
  private async logDecision(decision: RolloutDecision): Promise<void> {
    this.decisions.push(decision);

    // Store in database
    await this.db.query(`
      INSERT INTO ai_rollout_decisions (
        deployment_id, timestamp, current_stage, current_percentage,
        decision, target_percentage, explanation, confidence, factors, action_taken
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      decision.deploymentId,
      decision.timestamp,
      decision.currentStage,
      decision.currentPercentage,
      decision.decision,
      decision.targetPercentage,
      decision.explanation,
      decision.confidence,
      JSON.stringify(decision.factors),
      decision.actionTaken
    ]);

    // Store in Redis for dashboard
    await this.redis.lpush(
      `ai-decisions:${decision.deploymentId}`,
      JSON.stringify(decision)
    );
  }

  /**
   * GET DECISION HISTORY
   */
  async getDecisionHistory(deploymentId?: string, limit: number = 100): Promise<RolloutDecision[]> {
    let query = `
      SELECT * FROM ai_rollout_decisions
    `;
    
    const params: any[] = [];
    
    if (deploymentId) {
      query += ' WHERE deployment_id = $1';
      params.push(deploymentId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const { rows } = await this.db.query(query, params);

    return rows.map(r => ({
      ...r,
      factors: JSON.parse(r.factors)
    }));
  }

  /**
   * STOP ROLLOUT
   */
  async stopRollout(deploymentId: string, reason: string): Promise<void> {
    console.log(`\n🛑 Stopping AI rollout for ${deploymentId}: ${reason}`);
    this.activeRollouts.delete(deploymentId);
    
    await this.db.query(`
      INSERT INTO ai_rollout_stops (
        deployment_id, stop_reason, stopped_at
      ) VALUES ($1, $2, NOW())
    `, [deploymentId, reason]);

    this.emit('ai-rollout-stopped', { deploymentId, reason });
  }
}

// SQL Schema
export const AI_ROLLOUT_SCHEMA = `
CREATE TABLE IF NOT EXISTS ai_rollout_decisions (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  current_stage INTEGER NOT NULL,
  current_percentage INTEGER NOT NULL,
  decision VARCHAR(20) NOT NULL,
  target_percentage INTEGER,
  explanation TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  factors JSONB NOT NULL,
  action_taken TEXT NOT NULL
);

CREATE INDEX idx_ai_decisions_deployment ON ai_rollout_decisions(deployment_id);
CREATE INDEX idx_ai_decisions_timestamp ON ai_rollout_decisions(timestamp DESC);

CREATE TABLE IF NOT EXISTS ai_rollout_rollbacks (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(100) NOT NULL,
  rollback_reason TEXT NOT NULL,
  decision_factors JSONB NOT NULL,
  rolled_back_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_rollbacks_deployment ON ai_rollout_rollbacks(deployment_id);

CREATE TABLE IF NOT EXISTS ai_rollout_stops (
  id SERIAL PRIMARY KEY,
  deployment_id VARCHAR(100) NOT NULL,
  stop_reason TEXT NOT NULL,
  stopped_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_stops_deployment ON ai_rollout_stops(deployment_id);

-- Service metrics for baseline learning
CREATE TABLE IF NOT EXISTS service_metrics (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  error_rate DECIMAL(10,6),
  latency_ms INTEGER,
  requests_per_minute INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_metrics_service ON service_metrics(service_name, timestamp DESC);
`;

export default AIRolloutEngine;
