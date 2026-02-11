/**
 * Multi-Region Rollout Simulation
 * AI Operator - Strategic Step 4
 * 
 * Simulates extreme peak loads for US, EU, APAC independently
 * Generates regional heat maps and risk meters
 * Predicts TB impact for each region
 */

import { SimulationResult, SimulationScenario } from './WhatIfSimulation';

export interface RegionalStatus {
  region: 'US' | 'EU' | 'APAC';
  status: 'safe' | 'medium' | 'high' | 'critical';
  riskScore: number;
  loadMultiplier: number;
  currentUsers: number;
  projectedUsers: number;
  cpuUtilization: number;
  memoryUtilization: number;
  latency: number;
  errorRate: number;
  gdprCompliant: boolean;
  tbValid: boolean;
  emergencyControls: boolean;
}

export interface RegionalSimulation {
  region: string;
  scenarios: RegionalScenario[];
  aggregateRisk: number;
  recommendation: string;
}

export interface RegionalScenario {
  id: string;
  name: string;
  loadMultiplier: number;
  userCount: number;
  riskScore: number;
  tbImpact: number;
  financialImpact: number;
}

// Extreme peak load scenarios per region
export const EXTREME_PEAK_SCENARIOS: Record<string, RegionalScenario[]> = {
  US: [
    { id: 'us-baseline', name: 'US Baseline', loadMultiplier: 1.0, userCount: 500, riskScore: 15, tbImpact: 0, financialImpact: 0 },
    { id: 'us-peak-50', name: 'US Peak +50%', loadMultiplier: 1.5, userCount: 750, riskScore: 35, tbImpact: 0.01, financialImpact: 480000 },
    { id: 'us-peak-100', name: 'US Peak +100%', loadMultiplier: 2.0, userCount: 1000, riskScore: 55, tbImpact: 0.03, financialImpact: 960000 },
    { id: 'us-extreme', name: 'US Extreme +150%', loadMultiplier: 2.5, userCount: 1250, riskScore: 78, tbImpact: 0.08, financialImpact: 1440000 },
  ],
  EU: [
    { id: 'eu-baseline', name: 'EU Baseline', loadMultiplier: 1.0, userCount: 400, riskScore: 12, tbImpact: 0, financialImpact: 0 },
    { id: 'eu-peak-50', name: 'EU Peak +50%', loadMultiplier: 1.5, userCount: 600, riskScore: 28, tbImpact: 0, financialImpact: 384000 },
    { id: 'eu-peak-100', name: 'EU Peak +100%', loadMultiplier: 2.0, userCount: 800, riskScore: 42, tbImpact: 0.02, financialImpact: 768000 },
    { id: 'eu-extreme', name: 'EU Extreme +150%', loadMultiplier: 2.5, userCount: 1000, riskScore: 65, tbImpact: 0.05, financialImpact: 1152000 },
  ],
  APAC: [
    { id: 'apac-baseline', name: 'APAC Baseline (FROZEN)', loadMultiplier: 0, userCount: 0, riskScore: 0, tbImpact: 0, financialImpact: 0 },
    { id: 'apac-peak-50', name: 'APAC Peak +50% (BLOCKED)', loadMultiplier: 1.5, userCount: 525, riskScore: 100, tbImpact: 0.15, financialImpact: 0 },
    { id: 'apac-peak-100', name: 'APAC Peak +100% (BLOCKED)', loadMultiplier: 2.0, userCount: 700, riskScore: 100, tbImpact: 0.25, financialImpact: 0 },
  ],
};

export const getRegionalStatus = (region: string): RegionalStatus => {
  const scenarios = EXTREME_PEAK_SCENARIOS[region];
  
  if (region === 'APAC') {
    return {
      region: 'APAC',
      status: 'critical',
      riskScore: 100,
      loadMultiplier: 0,
      currentUsers: 0,
      projectedUsers: 0,
      cpuUtilization: 0,
      memoryUtilization: 0,
      latency: 0,
      errorRate: 0,
      gdprCompliant: false,
      tbValid: true, // Pre-freeze state valid
      emergencyControls: true,
    };
  }
  
  // Calculate aggregate metrics
  const maxRisk = Math.max(...scenarios.map(s => s.riskScore));
  const status: RegionalStatus['status'] = 
    maxRisk < 30 ? 'safe' :
    maxRisk < 50 ? 'medium' :
    maxRisk < 75 ? 'high' : 'critical';
  
  const peakScenario = scenarios.find(s => s.loadMultiplier === 1.5) || scenarios[1];
  
  return {
    region: region as 'US' | 'EU' | 'APAC',
    status,
    riskScore: maxRisk,
    loadMultiplier: peakScenario.loadMultiplier,
    currentUsers: scenarios[0].userCount,
    projectedUsers: peakScenario.userCount,
    cpuUtilization: 45 + (maxRisk * 0.4),
    memoryUtilization: 60 + (maxRisk * 0.3),
    latency: 120 + (maxRisk * 2),
    errorRate: 0.01 + (maxRisk * 0.001),
    gdprCompliant: region === 'EU' ? true : region === 'US',
    tbValid: maxRisk < 70,
    emergencyControls: true,
  };
};

export const getAllRegionalStatuses = (): RegionalStatus[] => {
  return ['US', 'EU', 'APAC'].map(getRegionalStatus);
};

export const generateRegionalHeatMap = () => {
  const regions = getAllRegionalStatuses();
  
  return {
    timestamp: new Date().toISOString(),
    regions: regions.map(r => ({
      name: r.region,
      status: r.status,
      riskScore: r.riskScore,
      color: getStatusColor(r.status),
      users: r.currentUsers,
      projectedUsers: r.projectedUsers,
      metrics: {
        cpu: r.cpuUtilization,
        memory: r.memoryUtilization,
        latency: r.latency,
        errorRate: r.errorRate,
      },
      compliance: {
        gdpr: r.gdprCompliant,
        tbValid: r.tbValid,
      },
    })),
    summary: {
      safeRegions: regions.filter(r => r.status === 'safe').length,
      mediumRegions: regions.filter(r => r.status === 'medium').length,
      highRegions: regions.filter(r => r.status === 'high').length,
      criticalRegions: regions.filter(r => r.status === 'critical').length,
      totalRisk: Math.max(...regions.map(r => r.riskScore)),
    },
  };
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'safe': return '#10b981'; // emerald-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'high': return '#f97316'; // orange-500
    case 'critical': return '#ef4444'; // red-500
    default: return '#64748b'; // slate-500
  }
};

export const generateRiskMeter = (region: string) => {
  const status = getRegionalStatus(region);
  
  return {
    region,
    riskScore: status.riskScore,
    level: status.status,
    segments: [
      { label: 'Safe', range: [0, 30], color: 'bg-emerald-500', active: status.riskScore < 30 },
      { label: 'Medium', range: [30, 50], color: 'bg-amber-500', active: status.riskScore >= 30 && status.riskScore < 50 },
      { label: 'High', range: [50, 75], color: 'bg-orange-500', active: status.riskScore >= 50 && status.riskScore < 75 },
      { label: 'Critical', range: [75, 100], color: 'bg-red-500', active: status.riskScore >= 75 },
    ],
    recommendation: getRegionalRecommendation(status),
  };
};

const getRegionalRecommendation = (status: RegionalStatus): string => {
  switch (status.status) {
    case 'safe':
      return `✅ ${status.region} is SAFE for rollout. Proceed with standard deployment procedures.`;
    case 'medium':
      return `⚠️ ${status.region} is MEDIUM RISK. Use canary deployment (25% → 50% → 100%) with monitoring.`;
    case 'high':
      return `🛑 ${status.region} is HIGH RISK. Scale infrastructure before deployment or reduce load targets.`;
    case 'critical':
      return `❌ ${status.region} is CRITICAL - FROZEN. Address compliance and infrastructure issues before any deployment.`;
    default:
      return '⚪ Unknown status - manual review required.';
  }
};

export const MULTI_REGION_ROLLOUT_PLAN = {
  phases: [
    {
      phase: 1,
      name: 'EU Deployment',
      regions: ['EU'],
      riskLevel: 'low',
      rolloutPercent: 100,
      status: 'ready',
      blockingIssues: [],
    },
    {
      phase: 2,
      name: 'US Deployment',
      regions: ['US'],
      riskLevel: 'medium',
      rolloutPercent: 50,
      status: 'ready',
      blockingIssues: ['Monitor peak load at +50%'],
    },
    {
      phase: 3,
      name: 'APAC Deployment',
      regions: ['APAC'],
      riskLevel: 'critical',
      rolloutPercent: 0,
      status: 'blocked',
      blockingIssues: [
        'GDPR compliance not met',
        'Infrastructure not provisioned',
        'Cross-border data transfer not established',
      ],
    },
  ],
  timeline: '2-4 weeks',
  rollbackTime: '<60s per region',
};
