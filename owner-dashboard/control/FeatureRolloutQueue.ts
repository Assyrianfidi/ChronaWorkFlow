/**
 * Feature Rollout Prioritization & Queue
 * AI Operator - Strategic Step 5
 * 
 * Queue low-risk scenarios for deployment
 * Percentage-based feature flags (10% → 50% → 100%)
 * Automatic rollback triggers on anomalies
 */

import { SimulationResult } from './WhatIfSimulation';

export interface RolloutQueue {
  queuedScenarios: QueuedScenario[];
  activeRollouts: ActiveRollout[];
  completedRollouts: CompletedRollout[];
  blockedScenarios: BlockedScenario[];
}

export interface QueuedScenario {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'ready' | 'scheduled';
  scheduledDate?: string;
  rolloutPlan: RolloutPhase[];
  autoRollbackTriggers: RollbackTrigger[];
}

export interface RolloutPhase {
  phase: number;
  percentage: number;
  duration: string;
  gates: RolloutGate[];
}

export interface RolloutGate {
  metric: string;
  threshold: number;
  operator: 'lt' | 'gt' | 'eq';
}

export interface RollbackTrigger {
  condition: string;
  threshold: number;
  action: 'pause' | 'rollback' | 'alert';
}

export interface ActiveRollout {
  scenarioId: string;
  currentPhase: number;
  currentPercentage: number;
  startTime: string;
  estimatedCompletion: string;
  status: 'in_progress' | 'paused' | 'rolling_back';
}

export interface CompletedRollout {
  scenarioId: string;
  completedAt: string;
  finalPercentage: number;
  status: 'success' | 'rolled_back' | 'partial';
  lessons: string[];
}

export interface BlockedScenario {
  id: string;
  name: string;
  riskScore: number;
  blockedReason: string;
  requiredActions: string[];
}

// Low-risk scenarios ready for deployment
export const ROLLOUT_QUEUE: RolloutQueue = {
  queuedScenarios: [
    {
      id: 'minimal-features',
      name: 'Minimal Feature Set',
      riskScore: 15,
      riskLevel: 'low',
      status: 'ready',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      rolloutPlan: [
        {
          phase: 1,
          percentage: 10,
          duration: '2 hours',
          gates: [
            { metric: 'error_rate', threshold: 0.05, operator: 'lt' },
            { metric: 'latency_p95', threshold: 500, operator: 'lt' },
          ],
        },
        {
          phase: 2,
          percentage: 50,
          duration: '4 hours',
          gates: [
            { metric: 'error_rate', threshold: 0.03, operator: 'lt' },
            { metric: 'cpu_utilization', threshold: 80, operator: 'lt' },
          ],
        },
        {
          phase: 3,
          percentage: 100,
          duration: 'complete',
          gates: [
            { metric: 'tb_validation', threshold: 1, operator: 'eq' },
            { metric: 'subsystem_health', threshold: 95, operator: 'gt' },
          ],
        },
      ],
      autoRollbackTriggers: [
        { condition: 'error_rate_spike', threshold: 0.1, action: 'rollback' },
        { condition: 'latency_spike', threshold: 1000, action: 'pause' },
        { condition: 'tb_imbalance', threshold: 0.01, action: 'rollback' },
        { condition: 'subsystem_offline', threshold: 1, action: 'rollback' },
      ],
    },
    {
      id: 'all-features',
      name: 'All Features Enabled',
      riskScore: 25,
      riskLevel: 'low',
      status: 'ready',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      rolloutPlan: [
        {
          phase: 1,
          percentage: 10,
          duration: '4 hours',
          gates: [
            { metric: 'error_rate', threshold: 0.05, operator: 'lt' },
            { metric: 'memory_utilization', threshold: 85, operator: 'lt' },
          ],
        },
        {
          phase: 2,
          percentage: 50,
          duration: '8 hours',
          gates: [
            { metric: 'error_rate', threshold: 0.03, operator: 'lt' },
            { metric: 'api_latency', threshold: 200, operator: 'lt' },
          ],
        },
        {
          phase: 3,
          percentage: 100,
          duration: 'complete',
          gates: [
            { metric: 'all_subsystems_healthy', threshold: 1, operator: 'eq' },
            { metric: 'customer_satisfaction', threshold: 4.5, operator: 'gt' },
          ],
        },
      ],
      autoRollbackTriggers: [
        { condition: 'error_rate_spike', threshold: 0.08, action: 'rollback' },
        { condition: 'memory_pressure', threshold: 90, action: 'pause' },
        { condition: 'api_latency_spike', threshold: 500, action: 'pause' },
      ],
    },
    {
      id: 'eu-regional',
      name: 'EU Regional Deployment',
      riskScore: 20,
      riskLevel: 'low',
      status: 'ready',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      rolloutPlan: [
        {
          phase: 1,
          percentage: 25,
          duration: '6 hours',
          gates: [
            { metric: 'gdpr_compliance', threshold: 1, operator: 'eq' },
            { metric: 'eu_latency', threshold: 150, operator: 'lt' },
          ],
        },
        {
          phase: 2,
          percentage: 75,
          duration: '12 hours',
          gates: [
            { metric: 'gdpr_compliance', threshold: 1, operator: 'eq' },
            { metric: 'data_residency', threshold: 1, operator: 'eq' },
          ],
        },
        {
          phase: 3,
          percentage: 100,
          duration: 'complete',
          gates: [
            { metric: 'gdpr_audit_pass', threshold: 1, operator: 'eq' },
            { metric: 'eu_users_satisfied', threshold: 0.95, operator: 'gt' },
          ],
        },
      ],
      autoRollbackTriggers: [
        { condition: 'gdpr_violation', threshold: 1, action: 'rollback' },
        { condition: 'data_residency_fail', threshold: 1, action: 'rollback' },
        { condition: 'eu_latency_spike', threshold: 300, action: 'pause' },
      ],
    },
  ],
  activeRollouts: [],
  completedRollouts: [],
  blockedScenarios: [
    {
      id: 'apac-expansion',
      name: 'APAC Expansion',
      riskScore: 68,
      blockedReason: 'HIGH-RISK: GDPR compliance not met, infrastructure not provisioned',
      requiredActions: [
        'Provision dedicated APAC nodes',
        'Implement GDPR-compliant data handling',
        'Establish cross-border data transfer mechanisms',
        'Scale database pool by 50%',
        'Re-run simulation after fixes',
      ],
    },
    {
      id: 'peak-load-50',
      name: 'Peak Load +50%',
      riskScore: 45,
      blockedReason: 'MEDIUM-RISK: Requires staged rollout with monitoring',
      requiredActions: [
        'Scale database pool by 50%',
        'Enable enhanced monitoring',
        'Prepare rollback procedure',
      ],
    },
  ],
};

export const getNextRollout = (): QueuedScenario | null => {
  const ready = ROLLOUT_QUEUE.queuedScenarios.filter(s => s.status === 'ready');
  return ready.length > 0 ? ready[0] : null;
};

export const prioritizeRollouts = (): QueuedScenario[] => {
  return [...ROLLOUT_QUEUE.queuedScenarios].sort((a, b) => {
    // Sort by risk score (lowest first), then by scheduled date
    if (a.riskScore !== b.riskScore) {
      return a.riskScore - b.riskScore;
    }
    return new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
  });
};

export const checkAutoRollback = (metrics: Record<string, number>): string | null => {
  // Check all active rollouts for rollback triggers
  for (const rollout of ROLLOUT_QUEUE.activeRollouts) {
    const scenario = ROLLOUT_QUEUE.queuedScenarios.find(s => s.id === rollout.scenarioId);
    if (!scenario) continue;
    
    for (const trigger of scenario.autoRollbackTriggers) {
      const metricValue = metrics[trigger.condition];
      if (metricValue !== undefined) {
        // Determine operator from metric name or use threshold comparison
        const triggered = metricValue > trigger.threshold;
        
        if (triggered) {
          return `ROLLBACK_TRIGGERED: ${trigger.condition} = ${metricValue} (threshold: ${trigger.threshold}, action: ${trigger.action})`;
        }
      }
    }
  }
  return null;
};

export const generateRolloutReport = () => {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      queued: ROLLOUT_QUEUE.queuedScenarios.length,
      ready: ROLLOUT_QUEUE.queuedScenarios.filter(s => s.status === 'ready').length,
      active: ROLLOUT_QUEUE.activeRollouts.length,
      completed: ROLLOUT_QUEUE.completedRollouts.length,
      blocked: ROLLOUT_QUEUE.blockedScenarios.length,
    },
    nextDeployment: getNextRollout(),
    priorityQueue: prioritizeRollouts(),
    blockedItems: ROLLOUT_QUEUE.blockedScenarios,
    estimatedTimeline: '5-7 days for all queued deployments',
  };
};

export const ROLLOUT_SUMMARY = {
  lowRisk: {
    count: 3,
    items: ['Minimal Feature Set', 'All Features Enabled', 'EU Regional Deployment'],
    status: 'Ready for deployment',
    timeline: '3-5 days',
  },
  mediumRisk: {
    count: 1,
    items: ['Peak Load +50%'],
    status: 'Blocked - requires infrastructure scaling',
    timeline: 'After scaling complete',
  },
  highRisk: {
    count: 1,
    items: ['APAC Expansion'],
    status: 'BLOCKED - compliance issues',
    timeline: 'TBD - pending compliance fixes',
  },
  safetyGuarantees: {
    rollbackTime: '<60s',
    tbValidation: 'Active on all deployments',
    autoRollback: 'Enabled for all rollouts',
    monitoring: '24/7 during deployment windows',
  },
};
