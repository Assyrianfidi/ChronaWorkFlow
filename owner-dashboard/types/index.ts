/**
 * Unified Executive Control Cockpit - Types and Interfaces
 * AccuBooks Enterprise Owner Dashboard
 */

export type DashboardSection =
  | 'overview'
  | 'control'
  | 'deployments'
  | 'experiments'
  | 'regions'
  | 'auditor'
  | 'chaos'
  | 'reports'
  | 'settings'
  | 'rawdata';

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  version: string;
  certification: {
    tests: number;
    passed: number;
    badge: string;
  };
  uptime: string;
  lastUpdate: Date;
}

export interface SubsystemStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastHeartbeat: Date;
  healthScore: number;
  metrics: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
  };
}

export interface SafetyControl {
  id: string;
  label: string;
  severity: 'critical' | 'warning' | 'info';
  icon: string;
  description: string;
  impact: string;
  requiresConfirmation: boolean;
  confirmationText: string;
}

export interface DeploymentInfo {
  currentVersion: string;
  targetVersion?: string;
  status: 'stable' | 'deploying' | 'rolling_back' | 'paused';
  canaries: {
    region: string;
    percentage: number;
    health: 'healthy' | 'degraded' | 'failing';
  }[];
  startTime?: Date;
  estimatedCompletion?: Date;
}

export interface FeatureFlagUI {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'GLOBAL' | 'COMPANY' | 'ROLE';
  rolloutPercentage: number;
  environments: string[];
  lastModified: Date;
  modifiedBy: string;
}

export interface RegionStatus {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'paused' | 'maintenance';
  version: string;
  compliance: {
    gdpr: boolean;
    soc2: boolean;
    hipaa: boolean;
    pci: boolean;
  };
  latency: number;
  activeUsers: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  parameters: {
    users: number;
    transactions: number;
    regions: string[];
    features: string[];
    pricingTier: string;
  };
  results?: {
    riskScore: 'low' | 'medium' | 'high';
    predictedLatency: number;
    financialImpact: number;
    complianceImpact: string;
  };
}

export interface AuditEvidence {
  id: string;
  type: 'SOC2' | 'CPA' | 'TAX' | 'GDPR' | 'PCI';
  name: string;
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
  status: 'ready' | 'generating' | 'expired';
}

export interface ChaosTest {
  id: string;
  name: string;
  type: 'failure' | 'latency' | 'cpu' | 'memory' | 'network';
  schedule: 'weekly' | 'monthly' | 'manual';
  lastRun?: Date;
  lastResult?: 'pass' | 'fail';
  enabled: boolean;
}

export interface DRStatus {
  lastTest: Date;
  lastRTO: number;
  lastRPO: number;
  passRate: number;
  history: {
    date: Date;
    type: string;
    result: 'pass' | 'fail';
    rto: number;
    rpo: number;
  }[];
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'board' | 'executive' | 'operational';
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastGenerated?: Date;
  recipients: string[];
  format: 'pdf' | 'excel' | 'json';
}
