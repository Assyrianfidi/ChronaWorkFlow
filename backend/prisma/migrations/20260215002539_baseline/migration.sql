-- CreateSchema
-- CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER', 'FOUNDER', 'AUDITOR', 'OWNER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('JOURNAL_ENTRY', 'INVOICE', 'PAYMENT', 'BILL', 'EXPENSE', 'ADJUSTMENT', 'JOURNAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ_ONLY', 'STANDARD', 'ELEVATED', 'FULL_ACCESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CHURN_WARNING', 'REVENUE_DROP', 'PAYMENT_FAILURE', 'USAGE_DECLINE', 'ENGAGEMENT_DROP', 'COMPLIANCE_ISSUE', 'SECURITY_THREAT', 'PERFORMANCE_DEGRADATION', 'BUDGET_OVERRUN', 'CASH_FLOW_ALERT', 'CONTRACT_EXPIRATION', 'RENEWAL_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "ApiUsage" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SOFT_LOCK_TENANT', 'PAUSE_BILLING', 'FLAG_COMPLIANCE_REVIEW', 'TRIGGER_UPGRADE_OUTREACH', 'RECOMMEND_SEAT_GROWTH', 'CREATE_RETENTION_WORKFLOW', 'TRIGGER_MAINTENANCE_WINDOW', 'REQUEST_FOUNDER_REVIEW', 'FORCE_LOGOUT_SESSIONS', 'SIMULATE_INTERVENTION', 'INITIATE_REVENUE_RECOVERY', 'STABILIZE_CASH_FLOW', 'INTERVENE_DELINQUENCY', 'RESCUE_CHURN_RISK', 'CONTAIN_FRAUD_THREAT');

-- CreateEnum
CREATE TYPE "AutomationCategory" AS ENUM ('GOVERNANCE_ENFORCEMENT', 'GROWTH_EXPANSION', 'RETENTION_CHURN', 'OPERATIONAL_RISK', 'GOVERNANCE', 'BILLING', 'RISK', 'TRUST_SAFETY', 'CUSTOMER_SUCCESS', 'REVENUE', 'CASHFLOW', 'COMPLIANCE', 'OPERATIONS', 'PERFORMANCE', 'MAINTENANCE', 'SECURITY', 'GENERAL');

-- CreateEnum
CREATE TYPE "AutomationProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED', 'CANCELLED', 'SIMULATION');

-- CreateEnum
CREATE TYPE "AutomationProposalType" AS ENUM ('REVENUE_RECOVERY', 'CASHFLOW_STABILIZATION', 'CUSTOMER_INTERVENTION', 'CHURN_PREVENTION', 'FRAUD_CONTAINMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "BillingStatusEnum" AS ENUM ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'TRIAL', 'DELINQUENT');

-- CreateEnum
CREATE TYPE "ControlStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ControlTargetType" AS ENUM ('USER', 'TENANT');

-- CreateEnum
CREATE TYPE "DashboardType" AS ENUM ('OWNER', 'CFO', 'CONTROLLER', 'ACCOUNTANT', 'PROJECT_MANAGER', 'EXTERNAL_ACCOUNTANT', 'AGENCY', 'VENDOR', 'CUSTOMER', 'EXECUTIVE_SUMMARY');

-- CreateEnum
CREATE TYPE "ExecutionMode" AS ENUM ('SIMULATION_ONLY', 'HUMAN_APPROVED', 'AUTO_EXECUTE');

-- CreateEnum
CREATE TYPE "FounderControlAction" AS ENUM ('FORCE_LOGOUT', 'FREEZE_TENANT', 'SUSPEND_BILLING', 'ENABLE_FEATURE', 'DISABLE_FEATURE', 'ENABLE_AUTOMATION', 'DISABLE_AUTOMATION', 'ADJUST_RISK_THRESHOLD', 'FORCE_EXECUTION', 'ROLLBACK_ACTION', 'HALT_ADAPTIVE_ENGINE', 'APPROVE_MODEL_CHANGE', 'REJECT_MODEL_CHANGE', 'APPROVE_ENUM_VALUE_MIGRATION');

-- CreateEnum
CREATE TYPE "FounderControlType" AS ENUM ('FORCE_LOGOUT_USER', 'FREEZE_TENANT', 'SUSPEND_BILLING_ACCESS');

-- CreateEnum
CREATE TYPE "FounderDecisionImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('ACTIVE', 'REVIEWED', 'EXECUTED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('RISK_BRIEFING', 'GROWTH_SIGNAL', 'CHURN_PREDICTION', 'USAGE_PATTERN', 'BILLING_ANOMALY', 'COMPLIANCE_ISSUE', 'AUTOMATION_SUGGESTION');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED', 'CURRENT', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PredictiveMetricType" AS ENUM ('CHURN_RISK', 'REVENUE_FORECAST', 'CASH_FLOW_PREDICTION', 'CUSTOMER_LIFETIME_VALUE', 'EXPANSION_OPPORTUNITY', 'RETENTION_SCORE', 'ENGAGEMENT_SCORE', 'HEALTH_SCORE', 'PAYMENT_RISK', 'USAGE_TREND');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('BOOKKEEPING', 'TAX_PREPARATION', 'AUDIT', 'CONSULTING', 'FULL_SERVICE', 'ADVISORY');

-- CreateEnum
CREATE TYPE "SuspiciousActivityType" AS ENUM ('UNUSUAL_LOGIN', 'MULTIPLE_FAILED_LOGINS', 'LARGE_TRANSACTION', 'UNEXPECTED_ACCESS', 'SUSPICIOUS_IP', 'FAILED_LOGIN_SPIKE', 'IMPOSSIBLE_TRAVEL', 'API_ABUSE', 'PERMISSION_ESCALATION', 'BILLING_TAMPER', 'DATA_EXPORT_SPIKE', 'SESSION_HIJACK', 'MULTI_ACCOUNT_ACTIVITY', 'GENERAL_ANOMALY');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "lastLogin" TIMESTAMP(3),
    "currentCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_reports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "referenceNumber" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_lines" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "billingStatusId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "billingStatusId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "category" TEXT,
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" INTEGER,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_client_relationships" (
    "id" TEXT NOT NULL,
    "agencyCompanyId" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL DEFAULT 'BOOKKEEPING',
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyFee" DOUBLE PRECISION,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'STANDARD',
    "assignedAccountantId" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contractTerms" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_client_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "insightType" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "priority" TEXT,
    "category" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "timeHorizon" TEXT,
    "recommendedActions" TEXT[],
    "dataSources" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "reviewNotes" TEXT,
    "status" "InsightStatus" NOT NULL DEFAULT 'ACTIVE',
    "signalScore" INTEGER,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_records" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "api_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_proposals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "type" "AutomationProposalType" NOT NULL DEFAULT 'GENERAL',
    "actionType" "AutomationActionType" NOT NULL,
    "actionCategory" "AutomationCategory" NOT NULL DEFAULT 'GOVERNANCE',
    "title" TEXT,
    "description" TEXT,
    "status" "AutomationProposalStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "severity" "InsightSeverity" NOT NULL,
    "evidence" TEXT[],
    "recommendedActions" TEXT[],
    "rollbackPlan" TEXT,
    "riskAssessment" TEXT,
    "projectedOutcome" TEXT,
    "requiresFounderApproval" BOOLEAN NOT NULL DEFAULT true,
    "canAutoExecute" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "executedById" INTEGER,
    "approvedById" INTEGER,
    "rejectedById" INTEGER,
    "createdById" INTEGER,

    CONSTRAINT "automation_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" INTEGER NOT NULL,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_status" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "billingStatus" "BillingStatusEnum" NOT NULL DEFAULT 'DELINQUENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'CURRENT',
    "planType" TEXT,
    "failedPayments" INTEGER NOT NULL DEFAULT 0,
    "lastBillingDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "billing_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_retention_analytics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "startingCustomers" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnedCustomers" INTEGER NOT NULL DEFAULT 0,
    "endingCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnCount" INTEGER NOT NULL DEFAULT 0,
    "voluntaryChurn" INTEGER NOT NULL DEFAULT 0,
    "involuntaryChurn" INTEGER NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cohortRetentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnedMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retainedMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expansionMrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atRiskCustomers" INTEGER NOT NULL DEFAULT 0,
    "atRiskRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churn_retention_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_reports" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" INTEGER NOT NULL,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "aggregations" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_health_scores" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthGrade" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "paymentHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "trendVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "daysSinceLastActivity" INTEGER NOT NULL DEFAULT 0,
    "totalLifetimeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_metrics_cache" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dashboardType" "DashboardType" NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricValue" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_metrics_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "managerId" INTEGER,
    "monthlyBudget" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "affectedEntityType" TEXT,
    "affectedEntityId" TEXT,
    "metricValue" DOUBLE PRECISION,
    "thresholdValue" DOUBLE PRECISION,
    "recommendedAction" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledgedBy" INTEGER,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "escalatedTo" INTEGER,
    "escalatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCustomerHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atRiskCustomers" INTEGER NOT NULL DEFAULT 0,
    "healthyCustomers" INTEGER NOT NULL DEFAULT 0,
    "totalActiveUsers" INTEGER NOT NULL DEFAULT 0,
    "avgFeatureAdoptionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "powerUserPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRiskRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highRiskInvoices" INTEGER NOT NULL DEFAULT 0,
    "activeCriticalPatterns" INTEGER NOT NULL DEFAULT 0,
    "activeHighPatterns" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "mrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueAtRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRevenueRetention" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arpu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ltv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cac" DOUBLE PRECISION,
    "grossMargin" DOUBLE PRECISION,
    "burnRate" DOUBLE PRECISION,
    "runway" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_adoption_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "adoptionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsageCount" INTEGER NOT NULL DEFAULT 0,
    "dailyAvgUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyAvgUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyAvgUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "powerUserCount" INTEGER NOT NULL DEFAULT 0,
    "casualUserCount" INTEGER NOT NULL DEFAULT 0,
    "inactiveUserCount" INTEGER NOT NULL DEFAULT 0,
    "adoptionTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "usageTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "avgTimeToAdoptionDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_adoption_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "userId" INTEGER,
    "totalDuration" DOUBLE PRECISION,

    CONSTRAINT "feature_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "actorUserId" INTEGER,

    CONSTRAINT "founder_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_control_actions" (
    "id" TEXT NOT NULL,
    "actionType" "FounderControlAction" NOT NULL,
    "targetId" TEXT NOT NULL,
    "executedBy" INTEGER NOT NULL,
    "status" "ControlStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_control_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_control_states" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "riskThreshold" TEXT NOT NULL DEFAULT 'MEDIUM',
    "autoExecuteThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "humanOverrideEnabled" BOOLEAN NOT NULL DEFAULT true,
    "auditLevel" TEXT NOT NULL DEFAULT 'FULL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_control_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_risk_analytics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collectionRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallRiskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "overdueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerPaymentHistoryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedPaymentDate" TIMESTAMP(3),
    "predictedCollectionProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendedAction" TEXT,
    "lastPaymentAttemptAt" TIMESTAMP(3),
    "paymentAttemptsCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_risk_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_users" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "organizationRole" TEXT NOT NULL,
    "departmentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "subscriptionId" INTEGER,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalOrganizations" INTEGER NOT NULL DEFAULT 0,
    "activeOrganizations" INTEGER NOT NULL DEFAULT 0,
    "newOrganizations" INTEGER NOT NULL DEFAULT 0,
    "churnedOrganizations" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "mrr" INTEGER NOT NULL DEFAULT 0,
    "arr" INTEGER NOT NULL DEFAULT 0,
    "starterCount" INTEGER NOT NULL DEFAULT 0,
    "professionalCount" INTEGER NOT NULL DEFAULT 0,
    "businessSuiteCount" INTEGER NOT NULL DEFAULT 0,
    "enterpriseCount" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictive_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" INTEGER,
    "metricType" "PredictiveMetricType" NOT NULL,
    "metricName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "severity" "AlertSeverity" NOT NULL,
    "churnRisk" DOUBLE PRECISION,
    "revenueImpact" DOUBLE PRECISION,
    "timeHorizon" TEXT,
    "affectedEntityType" TEXT,
    "affectedEntityId" TEXT,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictive_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_analytics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurringRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oneTimeRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueGrowthAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newCustomerRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expansionRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contractionRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRevenueRetention" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossRevenueRetention" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "tier" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "seatCount" INTEGER NOT NULL DEFAULT 1,
    "seatLimit" INTEGER NOT NULL DEFAULT 2,
    "invoiceCountThisMonth" INTEGER NOT NULL DEFAULT 0,
    "storageUsedMB" INTEGER NOT NULL DEFAULT 0,
    "apiCallsToday" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activities" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "companyId" TEXT,
    "activityType" "SuspiciousActivityType" NOT NULL DEFAULT 'FAILED_LOGIN_SPIKE',
    "description" TEXT NOT NULL,
    "severity" "ActivitySeverity" NOT NULL DEFAULT 'LOW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "evidence" JSONB,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_patterns" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "patternCategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patternStart" TIMESTAMP(3),
    "patternEnd" TIMESTAMP(3),
    "baselineValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "deviationPercentage" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "potentialCauses" TEXT[],
    "recommendedActions" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trend_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_frequency_metrics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "dailySessions" INTEGER NOT NULL DEFAULT 0,
    "weeklySessions" INTEGER NOT NULL DEFAULT 0,
    "monthlySessions" INTEGER NOT NULL DEFAULT 0,
    "avgSessionDurationMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "uniqueFeaturesUsed" INTEGER NOT NULL DEFAULT 0,
    "featureDiversityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userSegment" TEXT NOT NULL DEFAULT 'CASUAL',
    "engagementLevel" TEXT NOT NULL DEFAULT 'LOW',
    "frequencyTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "engagementTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "lastSessionAt" TIMESTAMP(3),
    "daysSinceLastSession" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_frequency_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "startTime" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "totalActions" INTEGER DEFAULT 0,
    "companyId" TEXT,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_userId_companyId_key" ON "company_members"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_companyId_code_key" ON "accounts"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_companyId_transactionNumber_key" ON "transactions"("companyId", "transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "agency_client_relationships_agencyCompanyId_idx" ON "agency_client_relationships"("agencyCompanyId");

-- CreateIndex
CREATE INDEX "agency_client_relationships_assignedAccountantId_idx" ON "agency_client_relationships"("assignedAccountantId");

-- CreateIndex
CREATE INDEX "agency_client_relationships_clientCompanyId_idx" ON "agency_client_relationships"("clientCompanyId");

-- CreateIndex
CREATE INDEX "agency_client_relationships_status_idx" ON "agency_client_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agency_client_relationships_agencyCompanyId_clientCompanyId_key" ON "agency_client_relationships"("agencyCompanyId", "clientCompanyId");

-- CreateIndex
CREATE INDEX "api_usage_records_organizationId_idx" ON "api_usage_records"("organizationId");

-- CreateIndex
CREATE INDEX "api_usage_records_timestamp_idx" ON "api_usage_records"("timestamp");

-- CreateIndex
CREATE INDEX "api_usage_records_userId_idx" ON "api_usage_records"("userId");

-- CreateIndex
CREATE INDEX "automation_rules_isActive_idx" ON "automation_rules"("isActive");

-- CreateIndex
CREATE INDEX "automation_rules_organizationId_idx" ON "automation_rules"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_status_companyId_key" ON "billing_status"("companyId");

-- CreateIndex
CREATE INDEX "churn_retention_analytics_churnRate_idx" ON "churn_retention_analytics"("churnRate");

-- CreateIndex
CREATE INDEX "churn_retention_analytics_companyId_idx" ON "churn_retention_analytics"("companyId");

-- CreateIndex
CREATE INDEX "churn_retention_analytics_periodStart_idx" ON "churn_retention_analytics"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "churn_retention_analytics_companyId_periodStart_periodEnd_key" ON "churn_retention_analytics"("companyId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "custom_reports_organizationId_idx" ON "custom_reports"("organizationId");

-- CreateIndex
CREATE INDEX "customer_health_scores_calculatedAt_idx" ON "customer_health_scores"("calculatedAt");

-- CreateIndex
CREATE INDEX "customer_health_scores_companyId_idx" ON "customer_health_scores"("companyId");

-- CreateIndex
CREATE INDEX "customer_health_scores_healthGrade_idx" ON "customer_health_scores"("healthGrade");

-- CreateIndex
CREATE INDEX "customer_health_scores_healthScore_idx" ON "customer_health_scores"("healthScore");

-- CreateIndex
CREATE INDEX "customer_health_scores_riskLevel_idx" ON "customer_health_scores"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "customer_health_scores_companyId_customerId_key" ON "customer_health_scores"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "dashboard_metrics_cache_companyId_dashboardType_idx" ON "dashboard_metrics_cache"("companyId", "dashboardType");

-- CreateIndex
CREATE INDEX "dashboard_metrics_cache_expiresAt_idx" ON "dashboard_metrics_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_metrics_cache_companyId_dashboardType_metricKey_key" ON "dashboard_metrics_cache"("companyId", "dashboardType", "metricKey");

-- CreateIndex
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organizationId_code_key" ON "departments"("organizationId", "code");

-- CreateIndex
CREATE INDEX "executive_alerts_alertType_idx" ON "executive_alerts"("alertType");

-- CreateIndex
CREATE INDEX "executive_alerts_companyId_idx" ON "executive_alerts"("companyId");

-- CreateIndex
CREATE INDEX "executive_alerts_createdAt_idx" ON "executive_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "executive_alerts_severity_idx" ON "executive_alerts"("severity");

-- CreateIndex
CREATE INDEX "executive_alerts_status_idx" ON "executive_alerts"("status");

-- CreateIndex
CREATE INDEX "executive_analytics_snapshots_companyId_idx" ON "executive_analytics_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "executive_analytics_snapshots_snapshotDate_idx" ON "executive_analytics_snapshots"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "executive_analytics_snapshots_companyId_snapshotDate_key" ON "executive_analytics_snapshots"("companyId", "snapshotDate");

-- CreateIndex
CREATE INDEX "executive_kpi_snapshots_companyId_idx" ON "executive_kpi_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "executive_kpi_snapshots_snapshotDate_idx" ON "executive_kpi_snapshots"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "executive_kpi_snapshots_companyId_snapshotDate_key" ON "executive_kpi_snapshots"("companyId", "snapshotDate");

-- CreateIndex
CREATE INDEX "feature_adoption_metrics_adoptionRate_idx" ON "feature_adoption_metrics"("adoptionRate");

-- CreateIndex
CREATE INDEX "feature_adoption_metrics_adoptionTrend_idx" ON "feature_adoption_metrics"("adoptionTrend");

-- CreateIndex
CREATE INDEX "feature_adoption_metrics_calculatedAt_idx" ON "feature_adoption_metrics"("calculatedAt");

-- CreateIndex
CREATE INDEX "feature_adoption_metrics_companyId_idx" ON "feature_adoption_metrics"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_adoption_metrics_companyId_featureName_key" ON "feature_adoption_metrics"("companyId", "featureName");

-- CreateIndex
CREATE UNIQUE INDEX "feature_usage_companyId_featureName_key" ON "feature_usage"("companyId", "featureName");

-- CreateIndex
CREATE UNIQUE INDEX "founder_control_states_companyId_key" ON "founder_control_states"("companyId");

-- CreateIndex
CREATE INDEX "invoice_risk_analytics_companyId_idx" ON "invoice_risk_analytics"("companyId");

-- CreateIndex
CREATE INDEX "invoice_risk_analytics_daysOverdue_idx" ON "invoice_risk_analytics"("daysOverdue");

-- CreateIndex
CREATE INDEX "invoice_risk_analytics_overallRiskLevel_idx" ON "invoice_risk_analytics"("overallRiskLevel");

-- CreateIndex
CREATE INDEX "invoice_risk_analytics_paymentRiskScore_idx" ON "invoice_risk_analytics"("paymentRiskScore");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_risk_analytics_companyId_invoiceId_key" ON "invoice_risk_analytics"("companyId", "invoiceId");

-- CreateIndex
CREATE INDEX "organization_users_organizationId_idx" ON "organization_users"("organizationId");

-- CreateIndex
CREATE INDEX "organization_users_organizationRole_idx" ON "organization_users"("organizationRole");

-- CreateIndex
CREATE INDEX "organization_users_userId_idx" ON "organization_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_userId_organizationId_key" ON "organization_users"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_subscriptionId_key" ON "organizations"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tenantId_key" ON "organizations"("tenantId");

-- CreateIndex
CREATE INDEX "organizations_subscriptionId_idx" ON "organizations"("subscriptionId");

-- CreateIndex
CREATE INDEX "organizations_tenantId_idx" ON "organizations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_metrics_date_key" ON "platform_metrics"("date");

-- CreateIndex
CREATE INDEX "platform_metrics_date_idx" ON "platform_metrics"("date");

-- CreateIndex
CREATE INDEX "predictive_metrics_calculatedAt_idx" ON "predictive_metrics"("calculatedAt");

-- CreateIndex
CREATE INDEX "predictive_metrics_churnRisk_idx" ON "predictive_metrics"("churnRisk");

-- CreateIndex
CREATE INDEX "predictive_metrics_companyId_idx" ON "predictive_metrics"("companyId");

-- CreateIndex
CREATE INDEX "predictive_metrics_metricType_idx" ON "predictive_metrics"("metricType");

-- CreateIndex
CREATE INDEX "predictive_metrics_severity_idx" ON "predictive_metrics"("severity");

-- CreateIndex
CREATE INDEX "revenue_analytics_companyId_idx" ON "revenue_analytics"("companyId");

-- CreateIndex
CREATE INDEX "revenue_analytics_createdAt_idx" ON "revenue_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "revenue_analytics_periodStart_periodEnd_idx" ON "revenue_analytics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_analytics_companyId_periodStart_periodEnd_key" ON "revenue_analytics"("companyId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "trend_patterns_companyId_idx" ON "trend_patterns"("companyId");

-- CreateIndex
CREATE INDEX "trend_patterns_detectedAt_idx" ON "trend_patterns"("detectedAt");

-- CreateIndex
CREATE INDEX "trend_patterns_patternType_idx" ON "trend_patterns"("patternType");

-- CreateIndex
CREATE INDEX "trend_patterns_severity_idx" ON "trend_patterns"("severity");

-- CreateIndex
CREATE INDEX "trend_patterns_status_idx" ON "trend_patterns"("status");

-- CreateIndex
CREATE INDEX "usage_frequency_metrics_calculatedAt_idx" ON "usage_frequency_metrics"("calculatedAt");

-- CreateIndex
CREATE INDEX "usage_frequency_metrics_companyId_idx" ON "usage_frequency_metrics"("companyId");

-- CreateIndex
CREATE INDEX "usage_frequency_metrics_userId_idx" ON "usage_frequency_metrics"("userId");

-- CreateIndex
CREATE INDEX "usage_frequency_metrics_userSegment_idx" ON "usage_frequency_metrics"("userSegment");

-- CreateIndex
CREATE UNIQUE INDEX "usage_frequency_metrics_companyId_userId_key" ON "usage_frequency_metrics"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- AddForeignKey
ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "reconciliation_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billingStatusId_fkey" FOREIGN KEY ("billingStatusId") REFERENCES "billing_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billingStatusId_fkey" FOREIGN KEY ("billingStatusId") REFERENCES "billing_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_client_relationships" ADD CONSTRAINT "agency_client_relationships_agencyCompanyId_fkey" FOREIGN KEY ("agencyCompanyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_client_relationships" ADD CONSTRAINT "agency_client_relationships_assignedAccountantId_fkey" FOREIGN KEY ("assignedAccountantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_client_relationships" ADD CONSTRAINT "agency_client_relationships_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_records" ADD CONSTRAINT "api_usage_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_records" ADD CONSTRAINT "api_usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "ai_insights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_proposals" ADD CONSTRAINT "automation_proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_status" ADD CONSTRAINT "billing_status_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churn_retention_analytics" ADD CONSTRAINT "churn_retention_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_reports" ADD CONSTRAINT "custom_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_health_scores" ADD CONSTRAINT "customer_health_scores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_metrics_cache" ADD CONSTRAINT "dashboard_metrics_cache_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_alerts" ADD CONSTRAINT "executive_alerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_alerts" ADD CONSTRAINT "executive_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_alerts" ADD CONSTRAINT "executive_alerts_escalatedTo_fkey" FOREIGN KEY ("escalatedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_alerts" ADD CONSTRAINT "executive_alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_analytics_snapshots" ADD CONSTRAINT "executive_analytics_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_kpi_snapshots" ADD CONSTRAINT "executive_kpi_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_adoption_metrics" ADD CONSTRAINT "feature_adoption_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_audit_logs" ADD CONSTRAINT "founder_audit_logs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_audit_logs" ADD CONSTRAINT "founder_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_control_actions" ADD CONSTRAINT "founder_control_actions_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_control_states" ADD CONSTRAINT "founder_control_states_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_risk_analytics" ADD CONSTRAINT "invoice_risk_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metrics" ADD CONSTRAINT "predictive_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_metrics" ADD CONSTRAINT "predictive_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_analytics" ADD CONSTRAINT "revenue_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspicious_activities" ADD CONSTRAINT "suspicious_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspicious_activities" ADD CONSTRAINT "suspicious_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trend_patterns" ADD CONSTRAINT "trend_patterns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_frequency_metrics" ADD CONSTRAINT "usage_frequency_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_frequency_metrics" ADD CONSTRAINT "usage_frequency_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

