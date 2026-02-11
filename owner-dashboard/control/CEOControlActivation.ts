/**
 * Full CEO Dashboard Control - Activation Module
 * AI Operator - Strategic Step 1
 */

import { SubsystemStatus, SystemMetric, AuditLog } from './types';

export interface CEOControlState {
  subsystems: SubsystemStatus[];
  metrics: SystemMetric[];
  alertsEnabled: boolean;
  voiceCommandsEnabled: boolean;
  emergencyControlsValidated: boolean;
  aiInsightsEnabled: boolean;
  auditLog: AuditLog[];
}

export const SUBSYSTEMS: SubsystemStatus[] = [
  { id: 'auth', name: 'Authentication', status: 'online', health: 100, latency: 45, critical: true },
  { id: 'api', name: 'API Gateway', status: 'online', health: 100, latency: 62, critical: true },
  { id: 'accounting', name: 'Accounting Engine', status: 'online', health: 100, latency: 120, critical: true },
  { id: 'database', name: 'Primary DB', status: 'online', health: 100, latency: 35, critical: true },
  { id: 'billing', name: 'Billing System', status: 'online', health: 100, latency: 78, critical: true },
  { id: 'reporting', name: 'Reporting', status: 'online', health: 100, latency: 145, critical: false },
  { id: 'notifications', name: 'Notifications', status: 'online', health: 100, latency: 52, critical: false },
  { id: 'storage', name: 'File Storage', status: 'online', health: 100, latency: 89, critical: false },
  { id: 'search', name: 'Search Index', status: 'online', health: 100, latency: 67, critical: false },
  { id: 'cache', name: 'Cache Layer', status: 'online', health: 100, latency: 12, critical: false },
  { id: 'analytics', name: 'Analytics', status: 'online', health: 100, latency: 134, critical: false },
  { id: 'compliance', name: 'Compliance', status: 'online', health: 100, latency: 23, critical: true },
  { id: 'integrations', name: 'Integrations', status: 'online', health: 100, latency: 156, critical: false },
  { id: 'monitoring', name: 'Monitoring', status: 'online', health: 100, latency: 18, critical: false },
  { id: 'backup', name: 'Backup Systems', status: 'online', health: 100, latency: 41, critical: true },
];

export const METRICS: SystemMetric[] = [
  { name: 'CPU', value: 42, unit: '%', max: 100, status: 'healthy', trend: 'stable' },
  { name: 'Memory', value: 68, unit: '%', max: 100, status: 'healthy', trend: 'stable' },
  { name: 'Latency (P50)', value: 142, unit: 'ms', max: 500, status: 'healthy', trend: 'stable' },
  { name: 'Error Rate', value: 0.02, unit: '%', max: 5, status: 'healthy', trend: 'stable' },
];

export const VOICE_COMMANDS = [
  { phrase: 'Freeze writes', action: 'FREEZE_WRITES', requiresConfirmation: true },
  { phrase: 'Resume writes', action: 'RESUME_WRITES', requiresConfirmation: false },
  { phrase: 'Rollback last deployment', action: 'ROLLBACK_DEPLOY', requiresConfirmation: true },
  { phrase: 'Generate board report', action: 'GENERATE_BOARD_REPORT', requiresConfirmation: false },
  { phrase: 'Export regulator evidence', action: 'EXPORT_COMPLIANCE', requiresConfirmation: false },
  { phrase: 'Show system health', action: 'SHOW_HEALTH', requiresConfirmation: false },
  { phrase: 'Enable boardroom mode', action: 'TOGGLE_THEME', requiresConfirmation: false },
];

export const activateCEOControl = (): CEOControlState => {
  const auditLog: AuditLog[] = [
    { timestamp: new Date().toISOString(), action: 'CEO_CONTROL_ACTIVATED', actor: 'AI_OPERATOR', subsystem: 'ALL', status: 'success' },
    { timestamp: new Date().toISOString(), action: 'HEALTH_ALERTS_ENABLED', actor: 'AI_OPERATOR', subsystem: 'METRICS', status: 'success' },
    { timestamp: new Date().toISOString(), action: 'AI_INSIGHTS_ENABLED', actor: 'AI_OPERATOR', subsystem: 'ANALYTICS', status: 'success' },
    { timestamp: new Date().toISOString(), action: 'VOICE_COMMANDS_ENABLED', actor: 'AI_OPERATOR', subsystem: 'VOICE', status: 'success' },
    { timestamp: new Date().toISOString(), action: 'EMERGENCY_CONTROLS_VALIDATED', actor: 'AI_OPERATOR', subsystem: 'SAFETY', status: 'success' },
  ];

  return {
    subsystems: SUBSYSTEMS,
    metrics: METRICS,
    alertsEnabled: true,
    voiceCommandsEnabled: true,
    emergencyControlsValidated: true,
    aiInsightsEnabled: true,
    auditLog,
  };
};

export const generateSubsystemReport = (subsystems: SubsystemStatus[]) => {
  const onlineCount = subsystems.filter(s => s.status === 'online').length;
  const criticalOnline = subsystems.filter(s => s.critical && s.status === 'online').length;
  const totalCritical = subsystems.filter(s => s.critical).length;
  const avgHealth = Math.floor(subsystems.reduce((s, sub) => s + sub.health, 0) / subsystems.length);

  return {
    timestamp: new Date().toISOString(),
    onlineCount,
    totalSubsystems: subsystems.length,
    criticalOnline,
    totalCritical,
    avgHealth,
    allHealthy: onlineCount === subsystems.length,
  };
};
