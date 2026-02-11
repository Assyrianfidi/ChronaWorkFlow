/**
 * Executive Intelligence & Explainability Layer - Type Definitions
 */

export enum InsightType {
  EXPENSE_ANOMALY = "EXPENSE_ANOMALY",
  CASH_FLOW_WARNING = "CASH_FLOW_WARNING",
  REVENUE_TREND = "REVENUE_TREND",
  PAYMENT_PATTERN = "PAYMENT_PATTERN",
  BUDGET_ALERT = "BUDGET_ALERT",
  PROFITABILITY_CHANGE = "PROFITABILITY_CHANGE",
  SEASONAL_PATTERN = "SEASONAL_PATTERN",
  VENDOR_RISK = "VENDOR_RISK",
}

export enum InsightSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export enum AutomationStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

export enum AutomationExecutionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
  CANCELLED = "CANCELLED",
}

export interface InsightMetadata {
  calculation?: string;
  baseline?: number;
  current?: number;
  change?: number;
  changePercentage?: number;
  confidence?: number;
  sampleSize?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface RelatedEntity {
  type: string;
  id: string;
  name?: string;
}

export interface SuggestedAction {
  type: string;
  label: string;
  description: string;
  automationTemplate?: string;
  estimatedImpact?: string;
}

export interface SmartInsight {
  id: string;
  tenantId: string;
  insightType: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  explanation: string;
  confidence: number;
  metadata: InsightMetadata;
  relatedEntities: RelatedEntity[];
  actionable: boolean;
  suggestedActions: SuggestedAction[];
  dismissedBy?: string;
  dismissedAt?: Date;
  dismissReason?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  conditions: any[];
  actions: any[];
  status: AutomationStatus;
  isTemplate: boolean;
  requiresApproval: boolean;
  createdBy: string;
  updatedBy?: string;
  lastTriggered?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  tenantId: string;
  status: AutomationExecutionStatus;
  triggeredBy?: string;
  triggerData: Record<string, any>;
  conditionsEvaluated: any[];
  conditionsMet: boolean;
  actionsExecuted: any[];
  isDryRun: boolean;
  errorMessage?: string;
  executionTime?: number;
  retryCount: number;
  nextRetryAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  rule?: {
    id: string;
    name: string;
    triggerType: string;
  };
}

export interface AutomationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  successRate: number;
}

export interface AutomationLimits {
  activeRules: number;
  maxActiveRules: number;
  executionsThisMonth: number;
  maxExecutionsPerMonth: number;
  withinLimits: boolean;
}

export interface BusinessImpactMetrics {
  moneySaved: number;
  risksPrevented: number;
  timeAutomated: number;
  tasksCreated: number;
  alertsSent: number;
}

export interface ExplainabilityData {
  dataSources: string[];
  timeWindow: {
    start: Date;
    end: Date;
    description: string;
  };
  baselineComparison: {
    baseline: number;
    current: number;
    change: number;
    changePercentage: number;
    unit: string;
  };
  thresholdsCrossed: Array<{
    threshold: number;
    actual: number;
    description: string;
  }>;
  confidenceScore: number;
  whyThisMatters: string;
  calculation: string;
  sampleSize?: number;
}

export interface DashboardSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  data?: any;
}

export interface ExecutiveDashboardData {
  risksAndAlerts: SmartInsight[];
  smartInsights: SmartInsight[];
  activeAutomations: AutomationRule[];
  businessImpact: BusinessImpactMetrics;
  recentExecutions: AutomationExecution[];
  automationStats: AutomationStats;
  limits: AutomationLimits;
}

export interface InsightActionRequest {
  insightId: string;
  actionType: string;
  automationTemplate?: string;
}

export interface AutomationActivationRequest {
  templateId?: string;
  name: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  conditions: any[];
  actions: any[];
  isDryRun?: boolean;
}

export interface DismissInsightRequest {
  insightId: string;
  reason?: string;
}

export interface AnalyticsEvent {
  eventType:
    | "INSIGHT_VIEWED"
    | "EXPLAINABILITY_OPENED"
    | "AUTOMATION_ACTIVATED"
    | "INSIGHT_DISMISSED"
    | "ACTION_CLICKED";
  insightId?: string;
  automationId?: string;
  metadata?: Record<string, any>;
}
