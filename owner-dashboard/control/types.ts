/**
 * CEO Control Types - Supporting types for CEO Dashboard Control
 */

export interface SubsystemStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  health: number;
  latency: number;
  critical: boolean;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  max: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface AuditLog {
  timestamp: string;
  action: string;
  actor: string;
  subsystem: string;
  status: 'success' | 'failure' | 'warning';
  details?: string;
}

export interface ComplianceEvidence {
  region: string;
  generatedAt: string;
  packages: CompliancePackage[];
}

export interface CompliancePackage {
  type: string;
  status: 'compliant' | 'non-compliant' | 'valid' | 'pending';
  evidenceHash: string;
  preFreezeBalance?: number;
  postFreezeBalance?: number;
  imbalance?: number;
  findings: string[];
}
