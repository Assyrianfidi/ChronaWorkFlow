/**
 * Owner Dashboard - TypeScript Types & Interfaces
 * AccuBooks CEO Dashboard
 */

// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Manager' | 'Accountant' | 'Auditor';
  company: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  apiCalls: number;
  healthScore: number;
  churnRisk: 'low' | 'medium' | 'high';
}

// Revenue & Financial Types
export interface RevenueData {
  name: string;
  revenue: number;
  subscriptions: number;
  churn: number;
  mrr: number;
  arr: number;
}

export interface Subscription {
  id: string;
  customer: string;
  email: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  amount: number;
  startDate: string;
  nextBilling: string;
  mrr: number;
  healthScore: number;
  ltv: number;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  services: {
    backend: { status: string; responseTime: number };
    database: { status: string; connections: number; queriesPerSecond: number };
    redis: { status: string; memoryUsage: string; hitRate: number };
    security: { status: string; activeServices: number };
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    requestsPerMinute: number;
  };
}

// Security Types
export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  ip?: string;
  user?: string;
}

// AI Recommendation Types
export interface AIRecommendation {
  id: string;
  type: 'revenue' | 'retention' | 'cost' | 'growth';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
}

// Gamification Types
export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  reward: string;
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

// System Status Types (for TopStatusBar)
export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  lastUpdated: string;
}

// What-If Simulator Types
export interface WhatIfScenario {
  id?: string;
  name: string;
  parameters: {
    revenueChange: number;
    churnRate: number;
    marketingSpend: number;
    regions: string[];
    duration: number;
  };
  results?: {
    projectedMrr: number;
    projectedArr: number;
    riskScore: 'low' | 'medium' | 'high';
    confidence: number;
  };
}

// Chaos Testing Types
export interface ChaosTest {
  id: string;
  name: string;
  type: 'failover' | 'latency' | 'error_injection' | 'load';
  target: string;
  duration: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  results?: {
    rto: number;
    rpo: number;
    maxLatency: number;
    errorRate: number;
  };
}

// Metric Alert Types
export interface MetricAlert {
  id: string;
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
}

// Narrative Types
export interface NarrativeState {
  version: number;
  lastModified: string;
  modifiedBy: string;
  summary: string;
  keyMetrics: {
    mrr: number;
    arr: number;
    nrr: number;
    activeUsers: number;
  };
}

// Audit Evidence Types
export interface AuditEvidence {
  id: string;
  type: 'tb_balance' | 'compliance_check' | 'security_scan' | 'performance_test';
  status: 'valid' | 'invalid' | 'pending';
  timestamp: string;
  checksum: string;
  details: Record<string, unknown>;
}

// Report Types
export interface Report {
  id: string;
  name: string;
  format: 'pdf' | 'csv' | 'xlsx';
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused';
}
