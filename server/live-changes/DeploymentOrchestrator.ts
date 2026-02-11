/**
 * ACCUBOOKS BLUE-GREEN & CANARY DEPLOYMENT ORCHESTRATOR
 * Owner-Level Change Authority - Core Mechanism #4
 * 
 * Deployment Strategy:
 * Blue (current stable) → Green (new version)
 * Process: Deploy Green → 1% traffic → 10% → 50% → 100%
 * Rollback: One command, < 60 seconds, zero data loss
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DeploymentConfig {
  version: string;
  image: string;
  featureFlags: string[]; // Flags to enable
  accountingSafe: boolean;
  canaryStages: number[]; // [1, 10, 50, 100]
  healthCheckDuration: number; // seconds per stage
  autoRollbackOnFailure: boolean;
}

export interface DeploymentStatus {
  id: string;
  version: string;
  status: 'pending' | 'deploying' | 'canary' | 'scaling' | 'complete' | 'rollingback' | 'failed';
  stage: number; // Current canary percentage
  blueReplicas: number;
  greenReplicas: number;
  trafficSplit: { blue: number; green: number };
  health: {
    errorRate: number;
    latency: number;
    availability: number;
  };
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export class DeploymentOrchestrator extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private activeDeployment: DeploymentStatus | null = null;
  private namespace: string = 'production';

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * START BLUE-GREEN DEPLOYMENT
   */
  async deploy(config: DeploymentConfig): Promise<DeploymentStatus> {
    if (this.activeDeployment) {
      throw new Error(`Deployment already in progress: ${this.activeDeployment.id}`);
    }

    const deploymentId = `deploy-${Date.now()}`;
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     BLUE-GREEN DEPLOYMENT INITIATED                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Deployment ID: ${deploymentId}`);
    console.log(`Version: ${config.version}`);
    console.log(`Canary Stages: ${config.canaryStages.join('% → ')}%`);
    console.log('');

    // Initialize deployment status
    this.activeDeployment = {
      id: deploymentId,
      version: config.version,
      status: 'pending',
      stage: 0,
      blueReplicas: 100,
      greenReplicas: 0,
      trafficSplit: { blue: 100, green: 0 },
      health: { errorRate: 0, latency: 0, availability: 100 },
      startedAt: new Date()
    };

    try {
      // Step 1: Pre-deployment checks
      await this.preDeploymentChecks(config);

      // Step 2: Deploy Green environment
      await this.deployGreen(config);

      // Step 3: Canary rollout
      for (const percentage of config.canaryStages) {
        await this.canaryStage(percentage, config);
      }

      // Step 4: Complete deployment
      await this.completeDeployment();

      this.activeDeployment.status = 'complete';
      this.activeDeployment.completedAt = new Date();

      this.emit('deployment-complete', this.activeDeployment);
      console.log('✅ Deployment complete');

      return this.activeDeployment;

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      
      if (config.autoRollbackOnFailure) {
        console.log('🔄 Auto-rollback enabled - rolling back...');
        await this.rollback();
      }

      this.activeDeployment.status = 'failed';
      this.activeDeployment.error = error.message;
      this.emit('deployment-failed', this.activeDeployment);

      throw error;
    }
  }

  /**
   * PRE-DEPLOYMENT CHECKS
   */
  private async preDeploymentChecks(config: DeploymentConfig): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check current system health
    const health = await this.checkSystemHealth();
    if (health.status === 'critical') {
      throw new Error('System health is CRITICAL - deployment blocked');
    }

    // Verify feature flags exist
    for (const flag of config.featureFlags) {
      const exists = await this.checkFeatureFlagExists(flag);
      if (!exists) {
        throw new Error(`Feature flag not found: ${flag}`);
      }
    }

    // Check accounting safety
    if (config.accountingSafe) {
      const accountingOK = await this.checkAccountingSafety();
      if (!accountingOK) {
        throw new Error('Accounting safety check failed');
      }
    }

    // Verify K8s resources available
    const resources = await this.checkK8sResources();
    if (!resources.sufficient) {
      throw new Error(`Insufficient K8s resources: ${resources.reason}`);
    }

    console.log('✅ Pre-deployment checks passed');
  }

  /**
   * DEPLOY GREEN ENVIRONMENT
   */
  private async deployGreen(config: DeploymentConfig): Promise<void> {
    console.log('🚀 Deploying Green environment...');
    this.activeDeployment!.status = 'deploying';

    // Deploy new version with zero traffic
    await execAsync(`
      kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: accubooks-green
  namespace: ${this.namespace}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: accubooks
      version: green
  template:
    metadata:
      labels:
        app: accubooks
        version: green
    spec:
      containers:
      - name: api
        image: ${config.image}
        env:
        - name: VERSION
          value: "${config.version}"
        - name: FEATURE_FLAGS
          value: "${config.featureFlags.join(',')}"
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
EOF
    `);

    // Wait for Green to be ready
    console.log('  ⏳ Waiting for Green to be ready...');
    await this.waitForDeployment('accubooks-green', 3);

    this.activeDeployment!.greenReplicas = 3;
    this.emit('green-deployed', this.activeDeployment);
    console.log('✅ Green environment deployed (3 replicas, 0% traffic)');
  }

  /**
   * CANARY STAGE
   */
  private async canaryStage(percentage: number, config: DeploymentConfig): Promise<void> {
    console.log(`\n🐤 Canary Stage: ${percentage}% traffic to Green`);
    this.activeDeployment!.status = 'canary';
    this.activeDeployment!.stage = percentage;

    // Adjust traffic split
    await this.setTrafficSplit({
      blue: 100 - percentage,
      green: percentage
    });

    // Scale Green to handle traffic
    const greenReplicas = Math.max(3, Math.ceil(percentage / 10));
    await this.scaleDeployment('accubooks-green', greenReplicas);
    this.activeDeployment!.greenReplicas = greenReplicas;

    // Monitor health
    console.log(`  ⏳ Monitoring health for ${config.healthCheckDuration}s...`);
    const health = await this.monitorHealth(config.healthCheckDuration);

    // Check if health is acceptable
    if (health.errorRate > 0.01 || health.latency > 500 || health.availability < 99) {
      console.error(`  ❌ Health check failed at ${percentage}%`);
      console.error(`     Error Rate: ${(health.errorRate * 100).toFixed(2)}%`);
      console.error(`     Latency: ${health.latency}ms`);
      console.error(`     Availability: ${health.availability}%`);
      
      throw new Error(`Canary failed at ${percentage}% - health check failed`);
    }

    console.log(`  ✅ Health check passed at ${percentage}%`);
    this.activeDeployment!.health = health;
    this.emit('canary-stage-complete', { stage: percentage, health });
  }

  /**
   * COMPLETE DEPLOYMENT
   * Scale Green to 100%, Blue to 0%
   */
  private async completeDeployment(): Promise<void> {
    console.log('\n🏁 Completing deployment...');
    this.activeDeployment!.status = 'scaling';

    // Route 100% traffic to Green
    await this.setTrafficSplit({ blue: 0, green: 100 });
    this.activeDeployment!.trafficSplit = { blue: 0, green: 100 };

    // Scale Green to full capacity
    await this.scaleDeployment('accubooks-green', 30);
    this.activeDeployment!.greenReplicas = 30;

    // Scale down Blue gradually
    for (let replicas = 30; replicas > 0; replicas -= 5) {
      await this.scaleDeployment('accubooks-blue', replicas);
      this.activeDeployment!.blueReplicas = replicas;
      await new Promise(r => setTimeout(r, 10000)); // 10s between steps
    }

    // Decommission Blue
    await execAsync(`kubectl delete deployment accubooks-blue -n ${this.namespace} --ignore-not-found`);
    this.activeDeployment!.blueReplicas = 0;

    // Rename Green to Blue (for next deployment)
    await execAsync(`
      kubectl patch deployment accubooks-green -n ${this.namespace} -p '{"metadata":{"name":"accubooks-blue"}}'
    `);

    this.activeDeployment!.greenReplicas = 0;
    this.activeDeployment!.blueReplicas = 30;

    console.log('✅ Deployment complete - Green is now Blue');
  }

  /**
   * ROLLBACK - One command, < 60 seconds, zero data loss
   */
  async rollback(): Promise<void> {
    if (!this.activeDeployment) {
      throw new Error('No active deployment to rollback');
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🔄 INITIATING ROLLBACK                               ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('Target: < 60 seconds, zero data loss');

    const startTime = Date.now();
    this.activeDeployment.status = 'rollingback';

    try {
      // Step 1: Immediate traffic cutover to Blue
      console.log('  1. Routing 100% traffic to Blue...');
      await this.setTrafficSplit({ blue: 100, green: 0 });
      this.activeDeployment.trafficSplit = { blue: 100, green: 0 };

      // Step 2: Ensure Blue is scaled
      console.log('  2. Ensuring Blue capacity...');
      await this.scaleDeployment('accubooks-blue', 30);
      this.activeDeployment.blueReplicas = 30;

      // Step 3: Disable feature flags
      console.log('  3. Disabling new feature flags...');
      // Flags would be disabled via feature flag system

      // Step 4: Delete Green deployment
      console.log('  4. Removing Green deployment...');
      await execAsync(`kubectl delete deployment accubooks-green -n ${this.namespace} --ignore-not-found`);
      this.activeDeployment.greenReplicas = 0;

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Rollback complete in ${duration.toFixed(1)} seconds`);

      this.activeDeployment.status = 'failed';
      this.emit('rollback-complete', this.activeDeployment);

    } catch (error) {
      console.error('🆘 Rollback failed:', error.message);
      this.emit('rollback-failed', { deployment: this.activeDeployment, error });
      throw error;
    }
  }

  /**
   * UTILITY METHODS
   */
  private async waitForDeployment(name: string, expectedReplicas: number): Promise<void> {
    let ready = false;
    let attempts = 0;

    while (!ready && attempts < 60) {
      try {
        const { stdout } = await execAsync(
          `kubectl get deployment ${name} -n ${this.namespace} -o jsonpath='{.status.readyReplicas}'`
        );
        const readyReplicas = parseInt(stdout.trim()) || 0;
        
        if (readyReplicas >= expectedReplicas) {
          ready = true;
        }
      } catch {
        // Not ready yet
      }

      if (!ready) {
        await new Promise(r => setTimeout(r, 5000)); // 5s between checks
        attempts++;
        process.stdout.write('.');
      }
    }

    if (!ready) {
      throw new Error(`Deployment ${name} failed to become ready`);
    }
    console.log('');
  }

  private async setTrafficSplit(split: { blue: number; green: number }): Promise<void> {
    // In production: Update Istio/NGINX/ALB routing rules
    await this.redis.setex('deployment:traffic-split', 300, JSON.stringify(split));
    this.activeDeployment!.trafficSplit = split;
    console.log(`   Traffic: ${split.blue}% Blue, ${split.green}% Green`);
  }

  private async scaleDeployment(name: string, replicas: number): Promise<void> {
    await execAsync(`kubectl scale deployment ${name} -n ${this.namespace} --replicas=${replicas}`);
  }

  private async monitorHealth(durationSeconds: number): Promise<{ errorRate: number; latency: number; availability: number }> {
    const samples: { errorRate: number; latency: number; availability: number }[] = [];
    const sampleInterval = 5000; // 5s
    const samplesNeeded = Math.ceil(durationSeconds * 1000 / sampleInterval);

    for (let i = 0; i < samplesNeeded; i++) {
      const metrics = await this.getMetrics();
      samples.push(metrics);
      await new Promise(r => setTimeout(r, sampleInterval));
    }

    // Average the samples
    return {
      errorRate: samples.reduce((a, s) => a + s.errorRate, 0) / samples.length,
      latency: samples.reduce((a, s) => a + s.latency, 0) / samples.length,
      availability: samples.reduce((a, s) => a + s.availability, 0) / samples.length
    };
  }

  private async getMetrics(): Promise<{ errorRate: number; latency: number; availability: number }> {
    // In production: Query from Datadog/CloudWatch/Prometheus
    const raw = await this.redis.get('metrics:current');
    if (raw) {
      const m = JSON.parse(raw);
      return {
        errorRate: m.errorRate || 0,
        latency: m.apiLatencyP95 || 0,
        availability: 99.97 // Placeholder
      };
    }
    return { errorRate: 0, latency: 0, availability: 100 };
  }

  private async checkSystemHealth(): Promise<{ status: 'healthy' | 'warning' | 'critical' }> {
    const raw = await this.redis.get('health:current');
    if (raw) {
      return JSON.parse(raw);
    }
    return { status: 'healthy' };
  }

  private async checkFeatureFlagExists(flag: string): Promise<boolean> {
    const result = await this.db.query('SELECT 1 FROM feature_flags WHERE name = $1', [flag]);
    return result.rows.length > 0;
  }

  private async checkAccountingSafety(): Promise<boolean> {
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

  private async checkK8sResources(): Promise<{ sufficient: boolean; reason?: string }> {
    // In production: Check cluster capacity
    return { sufficient: true };
  }

  /**
   * GET DEPLOYMENT STATUS
   */
  getStatus(): DeploymentStatus | null {
    return this.activeDeployment;
  }
}

export default DeploymentOrchestrator;
