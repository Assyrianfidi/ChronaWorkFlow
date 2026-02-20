-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Enterprise Multi-Tenant Isolation
-- ============================================================================
-- This migration enables PostgreSQL RLS on all tenant-owned tables.
-- Defense-in-depth: even if application middleware is bypassed, the DB
-- itself will block cross-tenant access.
--
-- PREREQUISITE: The application MUST set the session variable
--   app.current_company_id  (for companyId-scoped tables)
--   app.current_organization_id (for organizationId-scoped tables)
-- at the start of every connection/transaction.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Add companyId column to transaction_lines FIRST (required by RLS)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_lines' AND column_name = 'companyId'
  ) THEN
    -- Add column
    ALTER TABLE transaction_lines ADD COLUMN "companyId" TEXT;

    -- Backfill from parent transactions
    UPDATE transaction_lines tl
    SET "companyId" = t."companyId"
    FROM transactions t
    WHERE tl."transactionId" = t.id;

    -- Make NOT NULL after backfill
    ALTER TABLE transaction_lines ALTER COLUMN "companyId" SET NOT NULL;

    -- Add FK to companies
    ALTER TABLE transaction_lines
      ADD CONSTRAINT fk_transaction_lines_company
      FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

    -- Add composite unique
    ALTER TABLE transaction_lines
      ADD CONSTRAINT uq_transaction_lines_id_companyId
      UNIQUE (id, "companyId");

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_transaction_lines_companyId
      ON transaction_lines ("companyId");

    RAISE NOTICE 'Added companyId to transaction_lines with backfill';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Enable RLS on all companyId-scoped tables
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  company_tables TEXT[] := ARRAY[
    'accounts', 'billing_status', 'churn_retention_analytics',
    'company_members', 'customer_health_scores', 'dashboard_metrics_cache',
    'executive_alerts', 'executive_analytics_snapshots',
    'executive_kpi_snapshots', 'feature_adoption_metrics', 'feature_usage',
    'founder_control_states', 'invoice_risk_analytics', 'invoices',
    'payments', 'predictive_metrics', 'reconciliation_reports',
    'revenue_analytics', 'suspicious_activities', 'transaction_lines',
    'transactions', 'trend_patterns', 'usage_frequency_metrics',
    'user_activity_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY company_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Drop existing policies if any (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', tbl);

    -- SELECT: only rows matching current tenant
    EXECUTE format(
      'CREATE POLICY tenant_isolation_select ON %I FOR SELECT USING ("companyId" = current_setting(''app.current_company_id'', true))',
      tbl
    );

    -- INSERT: enforce correct tenant on new rows
    EXECUTE format(
      'CREATE POLICY tenant_isolation_insert ON %I FOR INSERT WITH CHECK ("companyId" = current_setting(''app.current_company_id'', true))',
      tbl
    );

    -- UPDATE: only own tenant rows, cannot change companyId
    EXECUTE format(
      'CREATE POLICY tenant_isolation_update ON %I FOR UPDATE USING ("companyId" = current_setting(''app.current_company_id'', true)) WITH CHECK ("companyId" = current_setting(''app.current_company_id'', true))',
      tbl
    );

    -- DELETE: only own tenant rows
    EXECUTE format(
      'CREATE POLICY tenant_isolation_delete ON %I FOR DELETE USING ("companyId" = current_setting(''app.current_company_id'', true))',
      tbl
    );

    RAISE NOTICE 'RLS enabled on table: %', tbl;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 3: Enable RLS on organizationId-scoped tables
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  org_tables TEXT[] := ARRAY[
    'api_usage_records', 'audit_logs', 'automation_rules',
    'custom_reports', 'departments', 'documents', 'organization_users'
  ];
BEGIN
  FOREACH tbl IN ARRAY org_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', tbl);

    EXECUTE format(
      'CREATE POLICY tenant_isolation_select ON %I FOR SELECT USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_isolation_insert ON %I FOR INSERT WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_isolation_update ON %I FOR UPDATE USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int) WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY tenant_isolation_delete ON %I FOR DELETE USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
      tbl
    );

    RAISE NOTICE 'RLS enabled on table: %', tbl;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 4: Special tables with non-standard tenant fields
-- ============================================================================

-- automation_proposals uses tenantId
ALTER TABLE automation_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_proposals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON automation_proposals;
DROP POLICY IF EXISTS tenant_isolation_insert ON automation_proposals;
DROP POLICY IF EXISTS tenant_isolation_update ON automation_proposals;
DROP POLICY IF EXISTS tenant_isolation_delete ON automation_proposals;
CREATE POLICY tenant_isolation_select ON automation_proposals FOR SELECT USING ("tenantId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_insert ON automation_proposals FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_update ON automation_proposals FOR UPDATE USING ("tenantId" = current_setting('app.current_company_id', true)) WITH CHECK ("tenantId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_delete ON automation_proposals FOR DELETE USING ("tenantId" = current_setting('app.current_company_id', true));

-- founder_audit_logs uses resourceId (maps to companyId)
ALTER TABLE founder_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON founder_audit_logs;
DROP POLICY IF EXISTS tenant_isolation_insert ON founder_audit_logs;
DROP POLICY IF EXISTS tenant_isolation_update ON founder_audit_logs;
DROP POLICY IF EXISTS tenant_isolation_delete ON founder_audit_logs;
CREATE POLICY tenant_isolation_select ON founder_audit_logs FOR SELECT USING ("resourceId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_insert ON founder_audit_logs FOR INSERT WITH CHECK ("resourceId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_update ON founder_audit_logs FOR UPDATE USING ("resourceId" = current_setting('app.current_company_id', true)) WITH CHECK ("resourceId" = current_setting('app.current_company_id', true));
CREATE POLICY tenant_isolation_delete ON founder_audit_logs FOR DELETE USING ("resourceId" = current_setting('app.current_company_id', true));

-- ============================================================================
-- SECTION 5: Superuser bypass role (for migrations and admin operations)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'accubooks_admin') THEN
    CREATE ROLE accubooks_admin SUPERUSER;
    RAISE NOTICE 'Created accubooks_admin role with RLS bypass';
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: Add composite unique constraints (@@unique([id, companyId]))
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  constraint_name TEXT;
  company_tables TEXT[] := ARRAY[
    'accounts', 'churn_retention_analytics', 'company_members',
    'customer_health_scores', 'dashboard_metrics_cache', 'executive_alerts',
    'executive_analytics_snapshots', 'executive_kpi_snapshots',
    'feature_adoption_metrics', 'feature_usage', 'invoice_risk_analytics',
    'invoices', 'payments', 'predictive_metrics', 'reconciliation_reports',
    'revenue_analytics', 'trend_patterns', 'usage_frequency_metrics',
    'user_activity_logs', 'transactions', 'transaction_lines'
  ];
BEGIN
  FOREACH tbl IN ARRAY company_tables LOOP
    constraint_name := 'uq_' || tbl || '_id_companyId';
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_name = constraint_name AND tc.table_name = tbl
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (id, "companyId")',
        tbl, constraint_name
      );
      RAISE NOTICE 'Added composite unique (id, companyId) to %', tbl;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
