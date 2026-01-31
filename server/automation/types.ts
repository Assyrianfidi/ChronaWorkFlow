/**
 * Finance Automation & Intelligence Engine - Type Definitions
 */

export enum AutomationTriggerType {
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  CASH_BALANCE_THRESHOLD = 'CASH_BALANCE_THRESHOLD',
  EXPENSE_ANOMALY = 'EXPENSE_ANOMALY',
  REVENUE_DROP = 'REVENUE_DROP',
  REVENUE_INCREASE = 'REVENUE_INCREASE',
  MONTH_END = 'MONTH_END',
  QUARTER_END = 'QUARTER_END',
  YEAR_END = 'YEAR_END',
  SCHEDULED_DAILY = 'SCHEDULED_DAILY',
  SCHEDULED_WEEKLY = 'SCHEDULED_WEEKLY',
  SCHEDULED_MONTHLY = 'SCHEDULED_MONTHLY',
  MANUAL = 'MANUAL',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  LOW_INVENTORY = 'LOW_INVENTORY',
  LATE_PAYMENT_PATTERN = 'LATE_PAYMENT_PATTERN',
}

export enum AutomationActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_IN_APP_NOTIFICATION = 'SEND_IN_APP_NOTIFICATION',
  GENERATE_REPORT = 'GENERATE_REPORT',
  LOCK_ACTION = 'LOCK_ACTION',
  FLAG_TRANSACTION = 'FLAG_TRANSACTION',
  CREATE_TASK = 'CREATE_TASK',
  NOTIFY_ROLE = 'NOTIFY_ROLE',
  WEBHOOK = 'WEBHOOK',
  UPDATE_FIELD = 'UPDATE_FIELD',
  CREATE_APPROVAL_REQUEST = 'CREATE_APPROVAL_REQUEST',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  BETWEEN = 'BETWEEN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

export enum LogicOperator {
  AND = 'AND',
  OR = 'OR',
}

// Trigger Configuration Types

export interface InvoiceOverdueTriggerConfig {
  daysOverdue: number;
  minimumAmount?: number;
  customerIds?: string[];
}

export interface CashBalanceThresholdTriggerConfig {
  threshold: number;
  operator: 'BELOW' | 'ABOVE';
  accountIds?: string[];
}

export interface ExpenseAnomalyTriggerConfig {
  deviationMultiplier: number; // e.g., 3 = 3x the average
  lookbackPeriodDays: number;
  categoryIds?: string[];
}

export interface RevenueChangeTriggerConfig {
  percentageChange: number;
  comparisonPeriod: 'PREVIOUS_MONTH' | 'PREVIOUS_QUARTER' | 'PREVIOUS_YEAR' | 'SAME_MONTH_LAST_YEAR';
}

export interface ScheduledTriggerConfig {
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  timezone?: string;
}

export interface BudgetExceededTriggerConfig {
  budgetId: string;
  thresholdPercentage: number; // e.g., 90 = alert at 90% of budget
}

export type TriggerConfig =
  | InvoiceOverdueTriggerConfig
  | CashBalanceThresholdTriggerConfig
  | ExpenseAnomalyTriggerConfig
  | RevenueChangeTriggerConfig
  | ScheduledTriggerConfig
  | BudgetExceededTriggerConfig
  | Record<string, any>;

// Condition Types

export interface AutomationCondition {
  field: string; // e.g., "invoice.amount", "transaction.category"
  operator: ConditionOperator;
  value: any;
  logicOperator?: LogicOperator; // How to combine with next condition
}

export interface ConditionGroup {
  conditions: AutomationCondition[];
  logicOperator: LogicOperator;
  groups?: ConditionGroup[]; // Nested groups for complex logic
}

// Action Configuration Types

export interface SendEmailActionConfig {
  to: string | string[]; // Email addresses or role names
  subject: string;
  body: string;
  attachments?: string[];
  template?: string;
}

export interface SendNotificationActionConfig {
  recipientRoles?: string[];
  recipientUserIds?: string[];
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  actionUrl?: string;
}

export interface GenerateReportActionConfig {
  reportType: string;
  parameters: Record<string, any>;
  deliveryMethod: 'EMAIL' | 'DOWNLOAD' | 'STORE';
  recipients?: string[];
}

export interface LockActionConfig {
  resourceType: string; // e.g., "invoice", "transaction"
  resourceId?: string;
  reason: string;
  duration?: number; // Minutes, null = indefinite
}

export interface FlagTransactionActionConfig {
  transactionId: string;
  flagType: string;
  reason: string;
  requiresReview: boolean;
}

export interface CreateTaskActionConfig {
  title: string;
  description: string;
  assignedToRole?: string;
  assignedToUserId?: string;
  dueDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface NotifyRoleActionConfig {
  roles: string[];
  message: string;
  channel: 'EMAIL' | 'IN_APP' | 'BOTH';
}

export interface WebhookActionConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  retryOnFailure: boolean;
}

export interface UpdateFieldActionConfig {
  resourceType: string;
  resourceId: string;
  field: string;
  value: any;
}

export interface CreateApprovalRequestActionConfig {
  approverRoles: string[];
  title: string;
  description: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
}

export type ActionConfig =
  | SendEmailActionConfig
  | SendNotificationActionConfig
  | GenerateReportActionConfig
  | LockActionConfig
  | FlagTransactionActionConfig
  | CreateTaskActionConfig
  | NotifyRoleActionConfig
  | WebhookActionConfig
  | UpdateFieldActionConfig
  | CreateApprovalRequestActionConfig;

export interface AutomationAction {
  type: AutomationActionType;
  config: ActionConfig;
  continueOnFailure?: boolean;
}

// Execution Context

export interface TriggerContext {
  triggerType: AutomationTriggerType;
  timestamp: Date;
  data: Record<string, any>; // Context-specific data
  triggeredBy?: string; // User ID for manual triggers
}

export interface ConditionEvaluationResult {
  condition: AutomationCondition;
  met: boolean;
  actualValue: any;
  expectedValue: any;
  explanation: string;
}

export interface ActionExecutionResult {
  action: AutomationAction;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number; // Milliseconds
}

export interface AutomationExecutionContext {
  ruleId: string;
  tenantId: string;
  trigger: TriggerContext;
  conditionResults: ConditionEvaluationResult[];
  actionResults: ActionExecutionResult[];
  isDryRun: boolean;
  startTime: Date;
  endTime?: Date;
}

// Smart Insights Types

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

export interface SuggestedAction {
  type: string;
  label: string;
  description: string;
  automationTemplate?: string;
}

export interface SmartInsightData {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  explanation: string;
  confidence: number;
  metadata: InsightMetadata;
  relatedEntities: Array<{
    type: string;
    id: string;
    name?: string;
  }>;
  suggestedActions: SuggestedAction[];
}

// Plan Limits

export interface AutomationPlanLimits {
  maxActiveRules: number;
  maxExecutionsPerMonth: number;
  allowedTriggers: AutomationTriggerType[];
  allowedActions: AutomationActionType[];
  allowsApprovalWorkflows: boolean;
  allowsWebhooks: boolean;
  allowsAdvancedConditions: boolean;
}

export const PLAN_LIMITS: Record<string, AutomationPlanLimits> = {
  FREE: {
    maxActiveRules: 3,
    maxExecutionsPerMonth: 100,
    allowedTriggers: [
      AutomationTriggerType.INVOICE_OVERDUE,
      AutomationTriggerType.CASH_BALANCE_THRESHOLD,
    ],
    allowedActions: [
      AutomationActionType.SEND_EMAIL,
      AutomationActionType.SEND_IN_APP_NOTIFICATION,
    ],
    allowsApprovalWorkflows: false,
    allowsWebhooks: false,
    allowsAdvancedConditions: false,
  },
  STARTER: {
    maxActiveRules: 10,
    maxExecutionsPerMonth: 1000,
    allowedTriggers: [
      AutomationTriggerType.INVOICE_OVERDUE,
      AutomationTriggerType.CASH_BALANCE_THRESHOLD,
      AutomationTriggerType.EXPENSE_ANOMALY,
      AutomationTriggerType.SCHEDULED_DAILY,
      AutomationTriggerType.SCHEDULED_WEEKLY,
      AutomationTriggerType.PAYMENT_RECEIVED,
      AutomationTriggerType.PAYMENT_FAILED,
    ],
    allowedActions: [
      AutomationActionType.SEND_EMAIL,
      AutomationActionType.SEND_IN_APP_NOTIFICATION,
      AutomationActionType.CREATE_TASK,
      AutomationActionType.NOTIFY_ROLE,
      AutomationActionType.FLAG_TRANSACTION,
    ],
    allowsApprovalWorkflows: false,
    allowsWebhooks: false,
    allowsAdvancedConditions: true,
  },
  PROFESSIONAL: {
    maxActiveRules: 50,
    maxExecutionsPerMonth: 10000,
    allowedTriggers: Object.values(AutomationTriggerType),
    allowedActions: Object.values(AutomationActionType).filter(
      (a) => a !== AutomationActionType.WEBHOOK
    ),
    allowsApprovalWorkflows: true,
    allowsWebhooks: false,
    allowsAdvancedConditions: true,
  },
  ENTERPRISE: {
    maxActiveRules: -1, // Unlimited
    maxExecutionsPerMonth: -1, // Unlimited
    allowedTriggers: Object.values(AutomationTriggerType),
    allowedActions: Object.values(AutomationActionType),
    allowsApprovalWorkflows: true,
    allowsWebhooks: true,
    allowsAdvancedConditions: true,
  },
};
