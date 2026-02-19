--
-- PostgreSQL database dump
--

\restrict MXJVUgnpyXxFJ9MUJxS2x7kRISoUuOzQ9W8SWTRLjxCrJkrPAWkeeYmaivpm9Ax

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AccessLevel" AS ENUM (
    'READ_ONLY',
    'STANDARD',
    'ELEVATED',
    'FULL_ACCESS',
    'ADMIN'
);


ALTER TYPE public."AccessLevel" OWNER TO postgres;

--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AccountType" AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);


ALTER TYPE public."AccountType" OWNER TO postgres;

--
-- Name: ActivitySeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActivitySeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."ActivitySeverity" OWNER TO postgres;

--
-- Name: AlertSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."AlertSeverity" OWNER TO postgres;

--
-- Name: AlertStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertStatus" AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED',
    'ESCALATED',
    'DISMISSED',
    'EXPIRED'
);


ALTER TYPE public."AlertStatus" OWNER TO postgres;

--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertType" AS ENUM (
    'CHURN_WARNING',
    'REVENUE_DROP',
    'PAYMENT_FAILURE',
    'USAGE_DECLINE',
    'ENGAGEMENT_DROP',
    'COMPLIANCE_ISSUE',
    'SECURITY_THREAT',
    'PERFORMANCE_DEGRADATION',
    'BUDGET_OVERRUN',
    'CASH_FLOW_ALERT',
    'CONTRACT_EXPIRATION',
    'RENEWAL_OPPORTUNITY'
);


ALTER TYPE public."AlertType" OWNER TO postgres;

--
-- Name: ApiUsage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApiUsage" AS ENUM (
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH'
);


ALTER TYPE public."ApiUsage" OWNER TO postgres;

--
-- Name: AuditStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED',
    'DELETED'
);


ALTER TYPE public."AuditStatus" OWNER TO postgres;

--
-- Name: AutomationActionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AutomationActionType" AS ENUM (
    'SOFT_LOCK_TENANT',
    'PAUSE_BILLING',
    'FLAG_COMPLIANCE_REVIEW',
    'TRIGGER_UPGRADE_OUTREACH',
    'RECOMMEND_SEAT_GROWTH',
    'CREATE_RETENTION_WORKFLOW',
    'TRIGGER_MAINTENANCE_WINDOW',
    'REQUEST_FOUNDER_REVIEW',
    'FORCE_LOGOUT_SESSIONS',
    'SIMULATE_INTERVENTION',
    'INITIATE_REVENUE_RECOVERY',
    'STABILIZE_CASH_FLOW',
    'INTERVENE_DELINQUENCY',
    'RESCUE_CHURN_RISK',
    'CONTAIN_FRAUD_THREAT'
);


ALTER TYPE public."AutomationActionType" OWNER TO postgres;

--
-- Name: AutomationCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AutomationCategory" AS ENUM (
    'GOVERNANCE_ENFORCEMENT',
    'GROWTH_EXPANSION',
    'RETENTION_CHURN',
    'OPERATIONAL_RISK',
    'GOVERNANCE',
    'BILLING',
    'RISK',
    'TRUST_SAFETY',
    'CUSTOMER_SUCCESS',
    'REVENUE',
    'CASHFLOW',
    'COMPLIANCE',
    'OPERATIONS',
    'PERFORMANCE',
    'MAINTENANCE',
    'SECURITY',
    'GENERAL'
);


ALTER TYPE public."AutomationCategory" OWNER TO postgres;

--
-- Name: AutomationProposalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AutomationProposalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXECUTED',
    'EXPIRED',
    'CANCELLED',
    'SIMULATION'
);


ALTER TYPE public."AutomationProposalStatus" OWNER TO postgres;

--
-- Name: AutomationProposalType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AutomationProposalType" AS ENUM (
    'REVENUE_RECOVERY',
    'CASHFLOW_STABILIZATION',
    'CUSTOMER_INTERVENTION',
    'CHURN_PREVENTION',
    'FRAUD_CONTAINMENT',
    'GENERAL'
);


ALTER TYPE public."AutomationProposalType" OWNER TO postgres;

--
-- Name: BillingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BillingStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELLED'
);


ALTER TYPE public."BillingStatus" OWNER TO postgres;

--
-- Name: BillingStatusEnum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BillingStatusEnum" AS ENUM (
    'ACTIVE',
    'PAST_DUE',
    'SUSPENDED',
    'CANCELLED',
    'TRIAL',
    'DELINQUENT'
);


ALTER TYPE public."BillingStatusEnum" OWNER TO postgres;

--
-- Name: ControlStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ControlStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXECUTED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."ControlStatus" OWNER TO postgres;

--
-- Name: ControlTargetType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ControlTargetType" AS ENUM (
    'USER',
    'TENANT'
);


ALTER TYPE public."ControlTargetType" OWNER TO postgres;

--
-- Name: DashboardType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DashboardType" AS ENUM (
    'OWNER',
    'CFO',
    'CONTROLLER',
    'ACCOUNTANT',
    'PROJECT_MANAGER',
    'EXTERNAL_ACCOUNTANT',
    'AGENCY',
    'VENDOR',
    'CUSTOMER',
    'EXECUTIVE_SUMMARY'
);


ALTER TYPE public."DashboardType" OWNER TO postgres;

--
-- Name: ExecutionMode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExecutionMode" AS ENUM (
    'SIMULATION_ONLY',
    'HUMAN_APPROVED',
    'AUTO_EXECUTE'
);


ALTER TYPE public."ExecutionMode" OWNER TO postgres;

--
-- Name: FounderControlAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FounderControlAction" AS ENUM (
    'FORCE_LOGOUT',
    'FREEZE_TENANT',
    'SUSPEND_BILLING',
    'ENABLE_FEATURE',
    'DISABLE_FEATURE',
    'ENABLE_AUTOMATION',
    'DISABLE_AUTOMATION',
    'ADJUST_RISK_THRESHOLD',
    'FORCE_EXECUTION',
    'ROLLBACK_ACTION',
    'HALT_ADAPTIVE_ENGINE',
    'APPROVE_MODEL_CHANGE',
    'REJECT_MODEL_CHANGE',
    'APPROVE_ENUM_VALUE_MIGRATION'
);


ALTER TYPE public."FounderControlAction" OWNER TO postgres;

--
-- Name: FounderControlType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FounderControlType" AS ENUM (
    'FORCE_LOGOUT_USER',
    'FREEZE_TENANT',
    'SUSPEND_BILLING_ACCESS'
);


ALTER TYPE public."FounderControlType" OWNER TO postgres;

--
-- Name: FounderDecisionImpact; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FounderDecisionImpact" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."FounderDecisionImpact" OWNER TO postgres;

--
-- Name: InsightSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InsightSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."InsightSeverity" OWNER TO postgres;

--
-- Name: InsightStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InsightStatus" AS ENUM (
    'ACTIVE',
    'REVIEWED',
    'EXECUTED',
    'EXPIRED',
    'ARCHIVED'
);


ALTER TYPE public."InsightStatus" OWNER TO postgres;

--
-- Name: InsightType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InsightType" AS ENUM (
    'RISK_BRIEFING',
    'GROWTH_SIGNAL',
    'CHURN_PREDICTION',
    'USAGE_PATTERN',
    'BILLING_ANOMALY',
    'COMPLIANCE_ISSUE',
    'AUTOMATION_SUGGESTION'
);


ALTER TYPE public."InsightType" OWNER TO postgres;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'PAID',
    'VOID',
    'UNCOLLECTIBLE'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: JournalEntryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."JournalEntryStatus" AS ENUM (
    'DRAFT',
    'POSTED',
    'VOID'
);


ALTER TYPE public."JournalEntryStatus" OWNER TO postgres;

--
-- Name: MemberRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MemberRole" AS ENUM (
    'MEMBER',
    'ADMIN',
    'OWNER'
);


ALTER TYPE public."MemberRole" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED',
    'CURRENT',
    'PARTIAL',
    'PAID'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PredictiveMetricType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PredictiveMetricType" AS ENUM (
    'CHURN_RISK',
    'REVENUE_FORECAST',
    'CASH_FLOW_PREDICTION',
    'CUSTOMER_LIFETIME_VALUE',
    'EXPANSION_OPPORTUNITY',
    'RETENTION_SCORE',
    'ENGAGEMENT_SCORE',
    'HEALTH_SCORE',
    'PAYMENT_RISK',
    'USAGE_TREND'
);


ALTER TYPE public."PredictiveMetricType" OWNER TO postgres;

--
-- Name: RelationshipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RelationshipStatus" AS ENUM (
    'ACTIVE',
    'PENDING',
    'SUSPENDED',
    'TERMINATED',
    'EXPIRED'
);


ALTER TYPE public."RelationshipStatus" OWNER TO postgres;

--
-- Name: RelationshipType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RelationshipType" AS ENUM (
    'BOOKKEEPING',
    'TAX_PREPARATION',
    'AUDIT',
    'CONSULTING',
    'FULL_SERVICE',
    'ADVISORY'
);


ALTER TYPE public."RelationshipType" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN',
    'MANAGER',
    'FOUNDER',
    'AUDITOR',
    'OWNER'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'FREE',
    'STARTER',
    'PRO',
    'ENTERPRISE'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO postgres;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'INCOMPLETE',
    'INCOMPLETE_EXPIRED',
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'UNPAID'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- Name: SuspiciousActivityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SuspiciousActivityType" AS ENUM (
    'UNUSUAL_LOGIN',
    'MULTIPLE_FAILED_LOGINS',
    'LARGE_TRANSACTION',
    'UNEXPECTED_ACCESS',
    'SUSPICIOUS_IP',
    'FAILED_LOGIN_SPIKE',
    'IMPOSSIBLE_TRAVEL',
    'API_ABUSE',
    'PERMISSION_ESCALATION',
    'BILLING_TAMPER',
    'DATA_EXPORT_SPIKE',
    'SESSION_HIJACK',
    'MULTI_ACCOUNT_ACTIVITY',
    'GENERAL_ANOMALY'
);


ALTER TYPE public."SuspiciousActivityType" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'JOURNAL_ENTRY',
    'INVOICE',
    'PAYMENT',
    'BILL',
    'EXPENSE',
    'ADJUSTMENT',
    'JOURNAL',
    'TRANSFER'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type public."AccountType" NOT NULL,
    "parentId" text,
    balance numeric(65,30) DEFAULT 0 NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: agency_client_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_client_relationships (
    id text NOT NULL,
    "agencyCompanyId" text NOT NULL,
    "clientCompanyId" text NOT NULL,
    "relationshipType" public."RelationshipType" DEFAULT 'BOOKKEEPING'::public."RelationshipType" NOT NULL,
    status public."RelationshipStatus" DEFAULT 'ACTIVE'::public."RelationshipStatus" NOT NULL,
    "monthlyFee" double precision,
    "accessLevel" public."AccessLevel" DEFAULT 'STANDARD'::public."AccessLevel" NOT NULL,
    "assignedAccountantId" integer,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "contractTerms" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.agency_client_relationships OWNER TO postgres;

--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_insights (
    id text NOT NULL,
    "insightType" public."InsightType" NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    confidence double precision NOT NULL,
    severity public."InsightSeverity" NOT NULL,
    priority text,
    category text,
    "entityType" text,
    "entityId" text,
    "entityName" text,
    "timeHorizon" text,
    "recommendedActions" text[],
    "dataSources" text[],
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "reviewedBy" integer,
    "reviewNotes" text,
    status public."InsightStatus" DEFAULT 'ACTIVE'::public."InsightStatus" NOT NULL,
    "signalScore" integer
);


ALTER TABLE public.ai_insights OWNER TO postgres;

--
-- Name: api_usage_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_usage_records (
    id integer NOT NULL,
    "organizationId" integer NOT NULL,
    "userId" integer NOT NULL,
    endpoint text NOT NULL,
    method text NOT NULL,
    "statusCode" integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duration integer NOT NULL
);


ALTER TABLE public.api_usage_records OWNER TO postgres;

--
-- Name: api_usage_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.api_usage_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_usage_records_id_seq OWNER TO postgres;

--
-- Name: api_usage_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.api_usage_records_id_seq OWNED BY public.api_usage_records.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "organizationId" integer NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" integer,
    changes jsonb,
    "ipAddress" text,
    "userAgent" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: automation_proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_proposals (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "insightId" text NOT NULL,
    type public."AutomationProposalType" DEFAULT 'GENERAL'::public."AutomationProposalType" NOT NULL,
    "actionType" public."AutomationActionType" NOT NULL,
    "actionCategory" public."AutomationCategory" DEFAULT 'GOVERNANCE'::public."AutomationCategory" NOT NULL,
    title text,
    description text,
    status public."AutomationProposalStatus" DEFAULT 'PENDING'::public."AutomationProposalStatus" NOT NULL,
    confidence double precision,
    severity public."InsightSeverity" NOT NULL,
    evidence text[],
    "recommendedActions" text[],
    "rollbackPlan" text,
    "riskAssessment" text,
    "projectedOutcome" text,
    "requiresFounderApproval" boolean DEFAULT true NOT NULL,
    "canAutoExecute" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "executedAt" timestamp(3) without time zone,
    "rejectedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "executedById" integer,
    "approvedById" integer,
    "rejectedById" integer,
    "createdById" integer
);


ALTER TABLE public.automation_proposals OWNER TO postgres;

--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_rules (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "organizationId" integer NOT NULL,
    "triggerType" text NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "lastExecutedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.automation_rules OWNER TO postgres;

--
-- Name: automation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.automation_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_rules_id_seq OWNER TO postgres;

--
-- Name: automation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.automation_rules_id_seq OWNED BY public.automation_rules.id;


--
-- Name: billing_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_status (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "billingStatus" public."BillingStatusEnum" DEFAULT 'DELINQUENT'::public."BillingStatusEnum" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'CURRENT'::public."PaymentStatus" NOT NULL,
    "planType" text,
    "failedPayments" integer DEFAULT 0 NOT NULL,
    "lastBillingDate" timestamp(3) without time zone,
    "nextBillingDate" timestamp(3) without time zone,
    "outstandingBalance" double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastUpdatedAt" timestamp(3) without time zone
);


ALTER TABLE public.billing_status OWNER TO postgres;

--
-- Name: churn_retention_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.churn_retention_analytics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "startingCustomers" integer DEFAULT 0 NOT NULL,
    "newCustomers" integer DEFAULT 0 NOT NULL,
    "churnedCustomers" integer DEFAULT 0 NOT NULL,
    "endingCustomers" integer DEFAULT 0 NOT NULL,
    "churnRate" double precision DEFAULT 0 NOT NULL,
    "churnCount" integer DEFAULT 0 NOT NULL,
    "voluntaryChurn" integer DEFAULT 0 NOT NULL,
    "involuntaryChurn" integer DEFAULT 0 NOT NULL,
    "retentionRate" double precision DEFAULT 0 NOT NULL,
    "cohortRetentionRate" double precision DEFAULT 0 NOT NULL,
    "churnedMrr" double precision DEFAULT 0 NOT NULL,
    "retainedMrr" double precision DEFAULT 0 NOT NULL,
    "expansionMrr" double precision DEFAULT 0 NOT NULL,
    "atRiskCustomers" integer DEFAULT 0 NOT NULL,
    "atRiskRevenue" double precision DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.churn_retention_analytics OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_members (
    id text NOT NULL,
    "userId" integer NOT NULL,
    "companyId" text NOT NULL,
    role public."MemberRole" DEFAULT 'MEMBER'::public."MemberRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.company_members OWNER TO postgres;

--
-- Name: custom_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_reports (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "organizationId" integer NOT NULL,
    "reportType" text NOT NULL,
    filters jsonb NOT NULL,
    columns jsonb NOT NULL,
    aggregations jsonb,
    "isScheduled" boolean DEFAULT false NOT NULL,
    "scheduleFrequency" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastRunAt" timestamp(3) without time zone
);


ALTER TABLE public.custom_reports OWNER TO postgres;

--
-- Name: custom_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_reports_id_seq OWNER TO postgres;

--
-- Name: custom_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_reports_id_seq OWNED BY public.custom_reports.id;


--
-- Name: customer_health_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_health_scores (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "customerId" text NOT NULL,
    "healthScore" double precision DEFAULT 0 NOT NULL,
    "healthGrade" text DEFAULT 'UNKNOWN'::text NOT NULL,
    "riskLevel" text DEFAULT 'LOW'::text NOT NULL,
    "paymentHealthScore" double precision DEFAULT 0 NOT NULL,
    "engagementScore" double precision DEFAULT 0 NOT NULL,
    "usageScore" double precision DEFAULT 0 NOT NULL,
    "supportScore" double precision DEFAULT 0 NOT NULL,
    "churnRiskScore" double precision DEFAULT 0 NOT NULL,
    "paymentRiskScore" double precision DEFAULT 0 NOT NULL,
    "scoreTrend" text DEFAULT 'STABLE'::text NOT NULL,
    "trendVelocity" double precision DEFAULT 0 NOT NULL,
    "lastActivityAt" timestamp(3) without time zone,
    "daysSinceLastActivity" integer DEFAULT 0 NOT NULL,
    "totalLifetimeValue" double precision DEFAULT 0 NOT NULL,
    metadata jsonb,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customer_health_scores OWNER TO postgres;

--
-- Name: dashboard_metrics_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_metrics_cache (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "dashboardType" public."DashboardType" NOT NULL,
    "metricKey" text NOT NULL,
    "metricValue" jsonb NOT NULL,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.dashboard_metrics_cache OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "organizationId" integer NOT NULL,
    "managerId" integer,
    "monthlyBudget" numeric(15,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    name text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "organizationId" integer NOT NULL,
    category text,
    "uploadedBy" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: executive_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.executive_alerts (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "alertType" public."AlertType" NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    title text NOT NULL,
    description text,
    "affectedEntityType" text,
    "affectedEntityId" text,
    "metricValue" double precision,
    "thresholdValue" double precision,
    "recommendedAction" text,
    status public."AlertStatus" DEFAULT 'ACTIVE'::public."AlertStatus" NOT NULL,
    "acknowledgedBy" integer,
    "acknowledgedAt" timestamp(3) without time zone,
    "resolvedBy" integer,
    "resolvedAt" timestamp(3) without time zone,
    "escalatedTo" integer,
    "escalatedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.executive_alerts OWNER TO postgres;

--
-- Name: executive_analytics_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.executive_analytics_snapshots (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "snapshotDate" timestamp(3) without time zone NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "revenueGrowthRate" double precision DEFAULT 0 NOT NULL,
    mrr double precision DEFAULT 0 NOT NULL,
    arr double precision DEFAULT 0 NOT NULL,
    "totalCustomers" integer DEFAULT 0 NOT NULL,
    "activeCustomers" integer DEFAULT 0 NOT NULL,
    "churnRate" double precision DEFAULT 0 NOT NULL,
    "retentionRate" double precision DEFAULT 0 NOT NULL,
    "avgCustomerHealthScore" double precision DEFAULT 0 NOT NULL,
    "atRiskCustomers" integer DEFAULT 0 NOT NULL,
    "healthyCustomers" integer DEFAULT 0 NOT NULL,
    "totalActiveUsers" integer DEFAULT 0 NOT NULL,
    "avgFeatureAdoptionRate" double precision DEFAULT 0 NOT NULL,
    "powerUserPercentage" double precision DEFAULT 0 NOT NULL,
    "totalRiskRevenue" double precision DEFAULT 0 NOT NULL,
    "highRiskInvoices" integer DEFAULT 0 NOT NULL,
    "activeCriticalPatterns" integer DEFAULT 0 NOT NULL,
    "activeHighPatterns" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.executive_analytics_snapshots OWNER TO postgres;

--
-- Name: executive_kpi_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.executive_kpi_snapshots (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "snapshotDate" timestamp(3) without time zone NOT NULL,
    mrr double precision DEFAULT 0 NOT NULL,
    arr double precision DEFAULT 0 NOT NULL,
    "activeCustomers" integer DEFAULT 0 NOT NULL,
    "churnRate" double precision DEFAULT 0 NOT NULL,
    "retentionRate" double precision DEFAULT 0 NOT NULL,
    "revenueAtRisk" double precision DEFAULT 0 NOT NULL,
    "netRevenueRetention" double precision DEFAULT 0 NOT NULL,
    arpu double precision DEFAULT 0 NOT NULL,
    ltv double precision DEFAULT 0 NOT NULL,
    cac double precision,
    "grossMargin" double precision,
    "burnRate" double precision,
    runway integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.executive_kpi_snapshots OWNER TO postgres;

--
-- Name: feature_adoption_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_adoption_metrics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "featureName" text NOT NULL,
    "totalUsers" integer DEFAULT 0 NOT NULL,
    "activeUsers" integer DEFAULT 0 NOT NULL,
    "adoptionRate" double precision DEFAULT 0 NOT NULL,
    "totalUsageCount" integer DEFAULT 0 NOT NULL,
    "dailyAvgUsage" double precision DEFAULT 0 NOT NULL,
    "weeklyAvgUsage" double precision DEFAULT 0 NOT NULL,
    "monthlyAvgUsage" double precision DEFAULT 0 NOT NULL,
    "powerUserCount" integer DEFAULT 0 NOT NULL,
    "casualUserCount" integer DEFAULT 0 NOT NULL,
    "inactiveUserCount" integer DEFAULT 0 NOT NULL,
    "adoptionTrend" text DEFAULT 'STABLE'::text NOT NULL,
    "usageTrend" text DEFAULT 'STABLE'::text NOT NULL,
    "avgTimeToAdoptionDays" double precision DEFAULT 0 NOT NULL,
    "firstUsedAt" timestamp(3) without time zone,
    "lastUsedAt" timestamp(3) without time zone,
    metadata jsonb,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.feature_adoption_metrics OWNER TO postgres;

--
-- Name: feature_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_usage (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "featureName" text NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    "userId" integer,
    "totalDuration" double precision
);


ALTER TABLE public.feature_usage OWNER TO postgres;

--
-- Name: founder_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.founder_audit_logs (
    id text NOT NULL,
    "userId" integer,
    "resourceId" text NOT NULL,
    action text NOT NULL,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "actorUserId" integer
);


ALTER TABLE public.founder_audit_logs OWNER TO postgres;

--
-- Name: founder_control_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.founder_control_actions (
    id text NOT NULL,
    "actionType" public."FounderControlAction" NOT NULL,
    "targetId" text NOT NULL,
    "executedBy" integer NOT NULL,
    status public."ControlStatus" DEFAULT 'PENDING'::public."ControlStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.founder_control_actions OWNER TO postgres;

--
-- Name: founder_control_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.founder_control_states (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "automationEnabled" boolean DEFAULT false NOT NULL,
    "riskThreshold" text DEFAULT 'MEDIUM'::text NOT NULL,
    "autoExecuteThreshold" double precision DEFAULT 0.9 NOT NULL,
    "humanOverrideEnabled" boolean DEFAULT true NOT NULL,
    "auditLevel" text DEFAULT 'FULL'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.founder_control_states OWNER TO postgres;

--
-- Name: invoice_risk_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_risk_analytics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "invoiceId" text NOT NULL,
    "paymentRiskScore" double precision DEFAULT 0 NOT NULL,
    "collectionRiskScore" double precision DEFAULT 0 NOT NULL,
    "overallRiskLevel" text DEFAULT 'LOW'::text NOT NULL,
    "daysOverdue" integer DEFAULT 0 NOT NULL,
    "overdueAmount" double precision DEFAULT 0 NOT NULL,
    "customerPaymentHistoryScore" double precision DEFAULT 0 NOT NULL,
    "customerHealthScore" double precision DEFAULT 0 NOT NULL,
    "predictedPaymentDate" timestamp(3) without time zone,
    "predictedCollectionProbability" double precision DEFAULT 0 NOT NULL,
    "recommendedAction" text,
    "lastPaymentAttemptAt" timestamp(3) without time zone,
    "paymentAttemptsCount" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoice_risk_analytics OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "billingStatusId" text NOT NULL,
    "invoiceNumber" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."InvoiceStatus" NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueAt" timestamp(3) without time zone NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: organization_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_users (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "organizationId" integer NOT NULL,
    "organizationRole" text NOT NULL,
    "departmentId" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.organization_users OWNER TO postgres;

--
-- Name: organization_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organization_users_id_seq OWNER TO postgres;

--
-- Name: organization_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_users_id_seq OWNED BY public.organization_users.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    "subscriptionId" integer,
    "tenantId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "billingStatusId" text NOT NULL,
    "invoiceId" text,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentMethod" text,
    "transactionId" text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: platform_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_metrics (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "totalOrganizations" integer DEFAULT 0 NOT NULL,
    "activeOrganizations" integer DEFAULT 0 NOT NULL,
    "newOrganizations" integer DEFAULT 0 NOT NULL,
    "churnedOrganizations" integer DEFAULT 0 NOT NULL,
    "totalUsers" integer DEFAULT 0 NOT NULL,
    "activeUsers" integer DEFAULT 0 NOT NULL,
    mrr integer DEFAULT 0 NOT NULL,
    arr integer DEFAULT 0 NOT NULL,
    "starterCount" integer DEFAULT 0 NOT NULL,
    "professionalCount" integer DEFAULT 0 NOT NULL,
    "businessSuiteCount" integer DEFAULT 0 NOT NULL,
    "enterpriseCount" integer DEFAULT 0 NOT NULL,
    "churnRate" double precision DEFAULT 0 NOT NULL,
    "conversionRate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.platform_metrics OWNER TO postgres;

--
-- Name: platform_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platform_metrics_id_seq OWNER TO postgres;

--
-- Name: platform_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_metrics_id_seq OWNED BY public.platform_metrics.id;


--
-- Name: predictive_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictive_metrics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" integer,
    "metricType" public."PredictiveMetricType" NOT NULL,
    "metricName" text NOT NULL,
    score double precision NOT NULL,
    confidence double precision DEFAULT 0.0 NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    "churnRisk" double precision,
    "revenueImpact" double precision,
    "timeHorizon" text,
    "affectedEntityType" text,
    "affectedEntityId" text,
    metadata jsonb,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.predictive_metrics OWNER TO postgres;

--
-- Name: reconciliation_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reconciliation_reports (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "reportType" text NOT NULL,
    data jsonb NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reconciliation_reports OWNER TO postgres;

--
-- Name: revenue_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_analytics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "totalRevenue" double precision DEFAULT 0 NOT NULL,
    "recurringRevenue" double precision DEFAULT 0 NOT NULL,
    "oneTimeRevenue" double precision DEFAULT 0 NOT NULL,
    "revenueGrowthRate" double precision DEFAULT 0 NOT NULL,
    "revenueGrowthAmount" double precision DEFAULT 0 NOT NULL,
    "newCustomerRevenue" double precision DEFAULT 0 NOT NULL,
    "expansionRevenue" double precision DEFAULT 0 NOT NULL,
    "contractionRevenue" double precision DEFAULT 0 NOT NULL,
    "churnedRevenue" double precision DEFAULT 0 NOT NULL,
    "netRevenueRetention" double precision DEFAULT 0 NOT NULL,
    "grossRevenueRetention" double precision DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.revenue_analytics OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    tier text NOT NULL,
    "billingCycle" text NOT NULL,
    status text NOT NULL,
    "stripeSubscriptionId" text,
    "stripeCustomerId" text,
    "stripePriceId" text,
    "stripeProductId" text,
    "currentPeriodStart" timestamp(3) without time zone,
    "currentPeriodEnd" timestamp(3) without time zone,
    "trialStart" timestamp(3) without time zone,
    "trialEnd" timestamp(3) without time zone,
    "canceledAt" timestamp(3) without time zone,
    "seatCount" integer DEFAULT 1 NOT NULL,
    "seatLimit" integer DEFAULT 2 NOT NULL,
    "invoiceCountThisMonth" integer DEFAULT 0 NOT NULL,
    "storageUsedMB" integer DEFAULT 0 NOT NULL,
    "apiCallsToday" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: suspicious_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suspicious_activities (
    id text NOT NULL,
    "userId" integer,
    "companyId" text,
    "activityType" public."SuspiciousActivityType" DEFAULT 'FAILED_LOGIN_SPIKE'::public."SuspiciousActivityType" NOT NULL,
    description text NOT NULL,
    severity public."ActivitySeverity" DEFAULT 'LOW'::public."ActivitySeverity" NOT NULL,
    "detectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    metadata jsonb,
    evidence jsonb,
    "isActive" boolean DEFAULT true
);


ALTER TABLE public.suspicious_activities OWNER TO postgres;

--
-- Name: transaction_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_lines (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(65,30) DEFAULT 0 NOT NULL,
    credit numeric(65,30) DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transaction_lines OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "transactionNumber" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    type public."TransactionType" NOT NULL,
    description text,
    "referenceNumber" text,
    "totalAmount" numeric(65,30) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: trend_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trend_patterns (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "patternType" text NOT NULL,
    "patternCategory" text NOT NULL,
    severity text DEFAULT 'LOW'::text NOT NULL,
    "detectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "patternStart" timestamp(3) without time zone,
    "patternEnd" timestamp(3) without time zone,
    "baselineValue" double precision,
    "currentValue" double precision,
    "deviationPercentage" double precision,
    "confidenceScore" double precision DEFAULT 0 NOT NULL,
    description text,
    "potentialCauses" text[],
    "recommendedActions" text[],
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.trend_patterns OWNER TO postgres;

--
-- Name: usage_frequency_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_frequency_metrics (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" integer NOT NULL,
    "dailySessions" integer DEFAULT 0 NOT NULL,
    "weeklySessions" integer DEFAULT 0 NOT NULL,
    "monthlySessions" integer DEFAULT 0 NOT NULL,
    "avgSessionDurationMinutes" double precision DEFAULT 0 NOT NULL,
    "totalActions" integer DEFAULT 0 NOT NULL,
    "uniqueFeaturesUsed" integer DEFAULT 0 NOT NULL,
    "featureDiversityScore" double precision DEFAULT 0 NOT NULL,
    "userSegment" text DEFAULT 'CASUAL'::text NOT NULL,
    "engagementLevel" text DEFAULT 'LOW'::text NOT NULL,
    "frequencyTrend" text DEFAULT 'STABLE'::text NOT NULL,
    "engagementTrend" text DEFAULT 'STABLE'::text NOT NULL,
    "lastSessionAt" timestamp(3) without time zone,
    "daysSinceLastSession" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.usage_frequency_metrics OWNER TO postgres;

--
-- Name: user_activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activity_logs (
    id text NOT NULL,
    "userId" integer NOT NULL,
    "companyId" text NOT NULL,
    action text NOT NULL,
    details jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionId" text
);


ALTER TABLE public.user_activity_logs OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" integer NOT NULL,
    "sessionToken" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true,
    "startTime" timestamp(3) without time zone,
    duration double precision,
    "totalActions" integer DEFAULT 0,
    "companyId" text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "currentCompanyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: api_usage_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_usage_records ALTER COLUMN id SET DEFAULT nextval('public.api_usage_records_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: automation_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules ALTER COLUMN id SET DEFAULT nextval('public.automation_rules_id_seq'::regclass);


--
-- Name: custom_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_reports ALTER COLUMN id SET DEFAULT nextval('public.custom_reports_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: organization_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_users ALTER COLUMN id SET DEFAULT nextval('public.organization_users_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: platform_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_metrics ALTER COLUMN id SET DEFAULT nextval('public.platform_metrics_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: agency_client_relationships agency_client_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_client_relationships
    ADD CONSTRAINT agency_client_relationships_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: api_usage_records api_usage_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_usage_records
    ADD CONSTRAINT api_usage_records_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_proposals automation_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT automation_proposals_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: billing_status billing_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_status
    ADD CONSTRAINT billing_status_pkey PRIMARY KEY (id);


--
-- Name: churn_retention_analytics churn_retention_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_retention_analytics
    ADD CONSTRAINT churn_retention_analytics_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_members company_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT company_members_pkey PRIMARY KEY (id);


--
-- Name: custom_reports custom_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);


--
-- Name: customer_health_scores customer_health_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_health_scores
    ADD CONSTRAINT customer_health_scores_pkey PRIMARY KEY (id);


--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT dashboard_metrics_cache_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: executive_alerts executive_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_alerts
    ADD CONSTRAINT executive_alerts_pkey PRIMARY KEY (id);


--
-- Name: executive_analytics_snapshots executive_analytics_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_analytics_snapshots
    ADD CONSTRAINT executive_analytics_snapshots_pkey PRIMARY KEY (id);


--
-- Name: executive_kpi_snapshots executive_kpi_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_kpi_snapshots
    ADD CONSTRAINT executive_kpi_snapshots_pkey PRIMARY KEY (id);


--
-- Name: feature_adoption_metrics feature_adoption_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_adoption_metrics
    ADD CONSTRAINT feature_adoption_metrics_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_pkey PRIMARY KEY (id);


--
-- Name: founder_audit_logs founder_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_audit_logs
    ADD CONSTRAINT founder_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: founder_control_actions founder_control_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_control_actions
    ADD CONSTRAINT founder_control_actions_pkey PRIMARY KEY (id);


--
-- Name: founder_control_states founder_control_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_control_states
    ADD CONSTRAINT founder_control_states_pkey PRIMARY KEY (id);


--
-- Name: invoice_risk_analytics invoice_risk_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_risk_analytics
    ADD CONSTRAINT invoice_risk_analytics_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: organization_users organization_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT organization_users_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: platform_metrics platform_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_metrics
    ADD CONSTRAINT platform_metrics_pkey PRIMARY KEY (id);


--
-- Name: predictive_metrics predictive_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_metrics
    ADD CONSTRAINT predictive_metrics_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_reports reconciliation_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_reports
    ADD CONSTRAINT reconciliation_reports_pkey PRIMARY KEY (id);


--
-- Name: revenue_analytics revenue_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_analytics
    ADD CONSTRAINT revenue_analytics_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: suspicious_activities suspicious_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspicious_activities
    ADD CONSTRAINT suspicious_activities_pkey PRIMARY KEY (id);


--
-- Name: transaction_lines transaction_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_lines
    ADD CONSTRAINT transaction_lines_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: trend_patterns trend_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trend_patterns
    ADD CONSTRAINT trend_patterns_pkey PRIMARY KEY (id);


--
-- Name: usage_frequency_metrics usage_frequency_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_frequency_metrics
    ADD CONSTRAINT usage_frequency_metrics_pkey PRIMARY KEY (id);


--
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "accounts_companyId_code_key" ON public.accounts USING btree ("companyId", code);


--
-- Name: agency_client_relationships_agencyCompanyId_clientCompanyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "agency_client_relationships_agencyCompanyId_clientCompanyId_key" ON public.agency_client_relationships USING btree ("agencyCompanyId", "clientCompanyId");


--
-- Name: agency_client_relationships_agencyCompanyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agency_client_relationships_agencyCompanyId_idx" ON public.agency_client_relationships USING btree ("agencyCompanyId");


--
-- Name: agency_client_relationships_assignedAccountantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agency_client_relationships_assignedAccountantId_idx" ON public.agency_client_relationships USING btree ("assignedAccountantId");


--
-- Name: agency_client_relationships_clientCompanyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "agency_client_relationships_clientCompanyId_idx" ON public.agency_client_relationships USING btree ("clientCompanyId");


--
-- Name: agency_client_relationships_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX agency_client_relationships_status_idx ON public.agency_client_relationships USING btree (status);


--
-- Name: api_usage_records_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "api_usage_records_organizationId_idx" ON public.api_usage_records USING btree ("organizationId");


--
-- Name: api_usage_records_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_usage_records_timestamp_idx ON public.api_usage_records USING btree ("timestamp");


--
-- Name: api_usage_records_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "api_usage_records_userId_idx" ON public.api_usage_records USING btree ("userId");


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_organizationId_idx" ON public.audit_logs USING btree ("organizationId");


--
-- Name: audit_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_timestamp_idx ON public.audit_logs USING btree ("timestamp");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: automation_rules_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "automation_rules_isActive_idx" ON public.automation_rules USING btree ("isActive");


--
-- Name: automation_rules_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "automation_rules_organizationId_idx" ON public.automation_rules USING btree ("organizationId");


--
-- Name: billing_status_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "billing_status_companyId_key" ON public.billing_status USING btree ("companyId");


--
-- Name: churn_retention_analytics_churnRate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "churn_retention_analytics_churnRate_idx" ON public.churn_retention_analytics USING btree ("churnRate");


--
-- Name: churn_retention_analytics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "churn_retention_analytics_companyId_idx" ON public.churn_retention_analytics USING btree ("companyId");


--
-- Name: churn_retention_analytics_companyId_periodStart_periodEnd_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "churn_retention_analytics_companyId_periodStart_periodEnd_key" ON public.churn_retention_analytics USING btree ("companyId", "periodStart", "periodEnd");


--
-- Name: churn_retention_analytics_periodStart_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "churn_retention_analytics_periodStart_idx" ON public.churn_retention_analytics USING btree ("periodStart");


--
-- Name: company_members_userId_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "company_members_userId_companyId_key" ON public.company_members USING btree ("userId", "companyId");


--
-- Name: custom_reports_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "custom_reports_organizationId_idx" ON public.custom_reports USING btree ("organizationId");


--
-- Name: customer_health_scores_calculatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customer_health_scores_calculatedAt_idx" ON public.customer_health_scores USING btree ("calculatedAt");


--
-- Name: customer_health_scores_companyId_customerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "customer_health_scores_companyId_customerId_key" ON public.customer_health_scores USING btree ("companyId", "customerId");


--
-- Name: customer_health_scores_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customer_health_scores_companyId_idx" ON public.customer_health_scores USING btree ("companyId");


--
-- Name: customer_health_scores_healthGrade_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customer_health_scores_healthGrade_idx" ON public.customer_health_scores USING btree ("healthGrade");


--
-- Name: customer_health_scores_healthScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customer_health_scores_healthScore_idx" ON public.customer_health_scores USING btree ("healthScore");


--
-- Name: customer_health_scores_riskLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customer_health_scores_riskLevel_idx" ON public.customer_health_scores USING btree ("riskLevel");


--
-- Name: dashboard_metrics_cache_companyId_dashboardType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dashboard_metrics_cache_companyId_dashboardType_idx" ON public.dashboard_metrics_cache USING btree ("companyId", "dashboardType");


--
-- Name: dashboard_metrics_cache_companyId_dashboardType_metricKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "dashboard_metrics_cache_companyId_dashboardType_metricKey_key" ON public.dashboard_metrics_cache USING btree ("companyId", "dashboardType", "metricKey");


--
-- Name: dashboard_metrics_cache_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dashboard_metrics_cache_expiresAt_idx" ON public.dashboard_metrics_cache USING btree ("expiresAt");


--
-- Name: departments_organizationId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "departments_organizationId_code_key" ON public.departments USING btree ("organizationId", code);


--
-- Name: departments_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "departments_organizationId_idx" ON public.departments USING btree ("organizationId");


--
-- Name: documents_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_category_idx ON public.documents USING btree (category);


--
-- Name: documents_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_organizationId_idx" ON public.documents USING btree ("organizationId");


--
-- Name: executive_alerts_alertType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_alerts_alertType_idx" ON public.executive_alerts USING btree ("alertType");


--
-- Name: executive_alerts_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_alerts_companyId_idx" ON public.executive_alerts USING btree ("companyId");


--
-- Name: executive_alerts_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_alerts_createdAt_idx" ON public.executive_alerts USING btree ("createdAt");


--
-- Name: executive_alerts_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX executive_alerts_severity_idx ON public.executive_alerts USING btree (severity);


--
-- Name: executive_alerts_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX executive_alerts_status_idx ON public.executive_alerts USING btree (status);


--
-- Name: executive_analytics_snapshots_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_analytics_snapshots_companyId_idx" ON public.executive_analytics_snapshots USING btree ("companyId");


--
-- Name: executive_analytics_snapshots_companyId_snapshotDate_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "executive_analytics_snapshots_companyId_snapshotDate_key" ON public.executive_analytics_snapshots USING btree ("companyId", "snapshotDate");


--
-- Name: executive_analytics_snapshots_snapshotDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_analytics_snapshots_snapshotDate_idx" ON public.executive_analytics_snapshots USING btree ("snapshotDate");


--
-- Name: executive_kpi_snapshots_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_kpi_snapshots_companyId_idx" ON public.executive_kpi_snapshots USING btree ("companyId");


--
-- Name: executive_kpi_snapshots_companyId_snapshotDate_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "executive_kpi_snapshots_companyId_snapshotDate_key" ON public.executive_kpi_snapshots USING btree ("companyId", "snapshotDate");


--
-- Name: executive_kpi_snapshots_snapshotDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "executive_kpi_snapshots_snapshotDate_idx" ON public.executive_kpi_snapshots USING btree ("snapshotDate");


--
-- Name: feature_adoption_metrics_adoptionRate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "feature_adoption_metrics_adoptionRate_idx" ON public.feature_adoption_metrics USING btree ("adoptionRate");


--
-- Name: feature_adoption_metrics_adoptionTrend_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "feature_adoption_metrics_adoptionTrend_idx" ON public.feature_adoption_metrics USING btree ("adoptionTrend");


--
-- Name: feature_adoption_metrics_calculatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "feature_adoption_metrics_calculatedAt_idx" ON public.feature_adoption_metrics USING btree ("calculatedAt");


--
-- Name: feature_adoption_metrics_companyId_featureName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "feature_adoption_metrics_companyId_featureName_key" ON public.feature_adoption_metrics USING btree ("companyId", "featureName");


--
-- Name: feature_adoption_metrics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "feature_adoption_metrics_companyId_idx" ON public.feature_adoption_metrics USING btree ("companyId");


--
-- Name: feature_usage_companyId_featureName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "feature_usage_companyId_featureName_key" ON public.feature_usage USING btree ("companyId", "featureName");


--
-- Name: founder_control_states_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "founder_control_states_companyId_key" ON public.founder_control_states USING btree ("companyId");


--
-- Name: invoice_risk_analytics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_risk_analytics_companyId_idx" ON public.invoice_risk_analytics USING btree ("companyId");


--
-- Name: invoice_risk_analytics_companyId_invoiceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "invoice_risk_analytics_companyId_invoiceId_key" ON public.invoice_risk_analytics USING btree ("companyId", "invoiceId");


--
-- Name: invoice_risk_analytics_daysOverdue_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_risk_analytics_daysOverdue_idx" ON public.invoice_risk_analytics USING btree ("daysOverdue");


--
-- Name: invoice_risk_analytics_overallRiskLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_risk_analytics_overallRiskLevel_idx" ON public.invoice_risk_analytics USING btree ("overallRiskLevel");


--
-- Name: invoice_risk_analytics_paymentRiskScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "invoice_risk_analytics_paymentRiskScore_idx" ON public.invoice_risk_analytics USING btree ("paymentRiskScore");


--
-- Name: invoices_companyId_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "invoices_companyId_invoiceNumber_key" ON public.invoices USING btree ("companyId", "invoiceNumber");


--
-- Name: organization_users_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organization_users_organizationId_idx" ON public.organization_users USING btree ("organizationId");


--
-- Name: organization_users_organizationRole_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organization_users_organizationRole_idx" ON public.organization_users USING btree ("organizationRole");


--
-- Name: organization_users_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organization_users_userId_idx" ON public.organization_users USING btree ("userId");


--
-- Name: organization_users_userId_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "organization_users_userId_organizationId_key" ON public.organization_users USING btree ("userId", "organizationId");


--
-- Name: organizations_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);


--
-- Name: organizations_subscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organizations_subscriptionId_idx" ON public.organizations USING btree ("subscriptionId");


--
-- Name: organizations_subscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "organizations_subscriptionId_key" ON public.organizations USING btree ("subscriptionId");


--
-- Name: organizations_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organizations_tenantId_idx" ON public.organizations USING btree ("tenantId");


--
-- Name: organizations_tenantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "organizations_tenantId_key" ON public.organizations USING btree ("tenantId");


--
-- Name: platform_metrics_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_metrics_date_idx ON public.platform_metrics USING btree (date);


--
-- Name: platform_metrics_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX platform_metrics_date_key ON public.platform_metrics USING btree (date);


--
-- Name: predictive_metrics_calculatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "predictive_metrics_calculatedAt_idx" ON public.predictive_metrics USING btree ("calculatedAt");


--
-- Name: predictive_metrics_churnRisk_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "predictive_metrics_churnRisk_idx" ON public.predictive_metrics USING btree ("churnRisk");


--
-- Name: predictive_metrics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "predictive_metrics_companyId_idx" ON public.predictive_metrics USING btree ("companyId");


--
-- Name: predictive_metrics_metricType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "predictive_metrics_metricType_idx" ON public.predictive_metrics USING btree ("metricType");


--
-- Name: predictive_metrics_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX predictive_metrics_severity_idx ON public.predictive_metrics USING btree (severity);


--
-- Name: revenue_analytics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "revenue_analytics_companyId_idx" ON public.revenue_analytics USING btree ("companyId");


--
-- Name: revenue_analytics_companyId_periodStart_periodEnd_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "revenue_analytics_companyId_periodStart_periodEnd_key" ON public.revenue_analytics USING btree ("companyId", "periodStart", "periodEnd");


--
-- Name: revenue_analytics_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "revenue_analytics_createdAt_idx" ON public.revenue_analytics USING btree ("createdAt");


--
-- Name: revenue_analytics_periodStart_periodEnd_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "revenue_analytics_periodStart_periodEnd_idx" ON public.revenue_analytics USING btree ("periodStart", "periodEnd");


--
-- Name: subscriptions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_status_idx ON public.subscriptions USING btree (status);


--
-- Name: subscriptions_stripeCustomerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "subscriptions_stripeCustomerId_idx" ON public.subscriptions USING btree ("stripeCustomerId");


--
-- Name: subscriptions_stripeSubscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON public.subscriptions USING btree ("stripeSubscriptionId");


--
-- Name: subscriptions_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON public.subscriptions USING btree ("stripeSubscriptionId");


--
-- Name: transactions_companyId_transactionNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "transactions_companyId_transactionNumber_key" ON public.transactions USING btree ("companyId", "transactionNumber");


--
-- Name: trend_patterns_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "trend_patterns_companyId_idx" ON public.trend_patterns USING btree ("companyId");


--
-- Name: trend_patterns_detectedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "trend_patterns_detectedAt_idx" ON public.trend_patterns USING btree ("detectedAt");


--
-- Name: trend_patterns_patternType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "trend_patterns_patternType_idx" ON public.trend_patterns USING btree ("patternType");


--
-- Name: trend_patterns_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trend_patterns_severity_idx ON public.trend_patterns USING btree (severity);


--
-- Name: trend_patterns_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trend_patterns_status_idx ON public.trend_patterns USING btree (status);


--
-- Name: usage_frequency_metrics_calculatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "usage_frequency_metrics_calculatedAt_idx" ON public.usage_frequency_metrics USING btree ("calculatedAt");


--
-- Name: usage_frequency_metrics_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "usage_frequency_metrics_companyId_idx" ON public.usage_frequency_metrics USING btree ("companyId");


--
-- Name: usage_frequency_metrics_companyId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "usage_frequency_metrics_companyId_userId_key" ON public.usage_frequency_metrics USING btree ("companyId", "userId");


--
-- Name: usage_frequency_metrics_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "usage_frequency_metrics_userId_idx" ON public.usage_frequency_metrics USING btree ("userId");


--
-- Name: usage_frequency_metrics_userSegment_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "usage_frequency_metrics_userSegment_idx" ON public.usage_frequency_metrics USING btree ("userSegment");


--
-- Name: user_sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON public.user_sessions USING btree ("sessionToken");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: accounts accounts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounts accounts_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agency_client_relationships agency_client_relationships_agencyCompanyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_client_relationships
    ADD CONSTRAINT "agency_client_relationships_agencyCompanyId_fkey" FOREIGN KEY ("agencyCompanyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: agency_client_relationships agency_client_relationships_assignedAccountantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_client_relationships
    ADD CONSTRAINT "agency_client_relationships_assignedAccountantId_fkey" FOREIGN KEY ("assignedAccountantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: agency_client_relationships agency_client_relationships_clientCompanyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_client_relationships
    ADD CONSTRAINT "agency_client_relationships_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_insights ai_insights_entityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT "ai_insights_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_insights ai_insights_reviewedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT "ai_insights_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: api_usage_records api_usage_records_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_usage_records
    ADD CONSTRAINT "api_usage_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: api_usage_records api_usage_records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_usage_records
    ADD CONSTRAINT "api_usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: automation_proposals automation_proposals_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_proposals automation_proposals_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_proposals automation_proposals_executedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_proposals automation_proposals_insightId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES public.ai_insights(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: automation_proposals automation_proposals_rejectedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automation_proposals automation_proposals_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_proposals
    ADD CONSTRAINT "automation_proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: automation_rules automation_rules_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT "automation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: billing_status billing_status_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_status
    ADD CONSTRAINT "billing_status_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: churn_retention_analytics churn_retention_analytics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_retention_analytics
    ADD CONSTRAINT "churn_retention_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_members company_members_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT "company_members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_members company_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT "company_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: custom_reports custom_reports_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT "custom_reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_health_scores customer_health_scores_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_health_scores
    ADD CONSTRAINT "customer_health_scores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dashboard_metrics_cache dashboard_metrics_cache_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_metrics_cache
    ADD CONSTRAINT "dashboard_metrics_cache_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: departments departments_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: executive_alerts executive_alerts_acknowledgedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_alerts
    ADD CONSTRAINT "executive_alerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: executive_alerts executive_alerts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_alerts
    ADD CONSTRAINT "executive_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: executive_alerts executive_alerts_escalatedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_alerts
    ADD CONSTRAINT "executive_alerts_escalatedTo_fkey" FOREIGN KEY ("escalatedTo") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: executive_alerts executive_alerts_resolvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_alerts
    ADD CONSTRAINT "executive_alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: executive_analytics_snapshots executive_analytics_snapshots_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_analytics_snapshots
    ADD CONSTRAINT "executive_analytics_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: executive_kpi_snapshots executive_kpi_snapshots_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.executive_kpi_snapshots
    ADD CONSTRAINT "executive_kpi_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_adoption_metrics feature_adoption_metrics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_adoption_metrics
    ADD CONSTRAINT "feature_adoption_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_usage feature_usage_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT "feature_usage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_usage feature_usage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT "feature_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: founder_audit_logs founder_audit_logs_resourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_audit_logs
    ADD CONSTRAINT "founder_audit_logs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: founder_audit_logs founder_audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_audit_logs
    ADD CONSTRAINT "founder_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: founder_control_actions founder_control_actions_executedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_control_actions
    ADD CONSTRAINT "founder_control_actions_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: founder_control_states founder_control_states_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.founder_control_states
    ADD CONSTRAINT "founder_control_states_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_risk_analytics invoice_risk_analytics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_risk_analytics
    ADD CONSTRAINT "invoice_risk_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_billingStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_billingStatusId_fkey" FOREIGN KEY ("billingStatusId") REFERENCES public.billing_status(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_users organization_users_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "organization_users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organization_users organization_users_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "organization_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_users organization_users_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "organization_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organizations organizations_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "organizations_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_billingStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_billingStatusId_fkey" FOREIGN KEY ("billingStatusId") REFERENCES public.billing_status(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: predictive_metrics predictive_metrics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_metrics
    ADD CONSTRAINT "predictive_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: predictive_metrics predictive_metrics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictive_metrics
    ADD CONSTRAINT "predictive_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reconciliation_reports reconciliation_reports_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_reports
    ADD CONSTRAINT "reconciliation_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: revenue_analytics revenue_analytics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_analytics
    ADD CONSTRAINT "revenue_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suspicious_activities suspicious_activities_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspicious_activities
    ADD CONSTRAINT "suspicious_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: suspicious_activities suspicious_activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suspicious_activities
    ADD CONSTRAINT "suspicious_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transaction_lines transaction_lines_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_lines
    ADD CONSTRAINT "transaction_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transaction_lines transaction_lines_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_lines
    ADD CONSTRAINT "transaction_lines_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trend_patterns trend_patterns_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trend_patterns
    ADD CONSTRAINT "trend_patterns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usage_frequency_metrics usage_frequency_metrics_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_frequency_metrics
    ADD CONSTRAINT "usage_frequency_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usage_frequency_metrics usage_frequency_metrics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_frequency_metrics
    ADD CONSTRAINT "usage_frequency_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activity_logs user_activity_logs_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT "user_activity_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activity_logs user_activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT "user_activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict MXJVUgnpyXxFJ9MUJxS2x7kRISoUuOzQ9W8SWTRLjxCrJkrPAWkeeYmaivpm9Ax

