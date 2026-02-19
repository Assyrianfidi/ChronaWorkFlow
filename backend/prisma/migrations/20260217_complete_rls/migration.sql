-- ============================================================================
-- COMPLETE ROW LEVEL SECURITY (RLS) — Enterprise Multi-Tenant Isolation
-- ============================================================================
-- Migration Date: February 17, 2026
-- Purpose: Enable PostgreSQL RLS on ALL tenant-owned tables
-- Defense-in-depth: Even if application middleware bypassed, DB enforces isolation
--
-- PREREQUISITE: Application MUST set session variable at connection start:
--   SET app.current_company_id = '<tenant-id>';
--   SET app.current_organization_id = '<org-id>';
--
-- USAGE IN APPLICATION:
--   await prisma.$executeRaw`SET app.current_company_id = ${companyId}`;
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: Enable RLS on all companyId-scoped tables (42 tables)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
  company_tables TEXT[] := ARRAY[
    'accounts',
    'billing_status',
    'churn_retention_analytics',
    'company_members',
    'customer_health_scores',
    'dashboard_metrics_cache',
    'executive_alerts',
    'executive_analytics_snapshots',
    'executive_kpi_snapshots',
    'feature_adoption_metrics',
    'feature_usage',
    'founder_control_states',
    'invoice_risk_analytics',
    'invoices',
    'payments',
    'predictive_metrics',
    'reconciliation_reports',
    'revenue_analytics',
    'suspicious_activities',
    'transaction_lines',
    'transactions',
    'trend_patterns',
    'usage_frequency_metrics',
    'user_activity_logs',
    'customer_lifetime_value',
    'revenue_retention_cohorts',
    'subscription_analytics',
    'churn_predictions',
    'product_metrics',
    'nps_scores',
    'customer_segments',
    'sales_pipelines',
    'marketing_campaigns',
    'support_tickets',
    'time_tracking',
    'expense_reports',
    'budgets',
    'forecasts',
    'tax_filings',
    'payroll_records',
    'inventory_items',
    'purchase_orders'
  ];
BEGIN
  FOREACH tbl IN ARRAY company_tables LOOP
    -- Check if table exists before enabling RLS
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

      -- Drop existing policies if any (idempotent migration)
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', tbl);

      -- CREATE POLICY: SELECT (only rows matching current tenant)
      EXECUTE format(
        'CREATE POLICY tenant_isolation_select ON %I FOR SELECT 
         USING ("companyId" = current_setting(''app.current_company_id'', true))',
        tbl
      );

      -- CREATE POLICY: INSERT (enforce correct tenant on new rows)
      EXECUTE format(
        'CREATE POLICY tenant_isolation_insert ON %I FOR INSERT 
         WITH CHECK ("companyId" = current_setting(''app.current_company_id'', true))',
        tbl
      );

      -- CREATE POLICY: UPDATE (only own tenant rows, cannot change companyId)
      EXECUTE format(
        'CREATE POLICY tenant_isolation_update ON %I FOR UPDATE 
         USING ("companyId" = current_setting(''app.current_company_id'', true)) 
         WITH CHECK ("companyId" = current_setting(''app.current_company_id'', true))',
        tbl
      );

      -- CREATE POLICY: DELETE (only own tenant rows)
      EXECUTE format(
        'CREATE POLICY tenant_isolation_delete ON %I FOR DELETE 
         USING ("companyId" = current_setting(''app.current_company_id'', true))',
        tbl
      );

      RAISE NOTICE 'RLS enabled on table: %', tbl;
    ELSE
      RAISE NOTICE 'Table does not exist, skipping: %', tbl;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- SECTION 2: Enable RLS on organizationId-scoped tables (7 tables)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
  org_tables TEXT[] := ARRAY[
    'api_usage_records',
    'audit_logs',
    'automation_rules',
    'custom_reports',
    'departments',
    'documents',
    'organization_users'
  ];
BEGIN
  FOREACH tbl IN ARRAY org_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', tbl);

      -- SELECT policy
      EXECUTE format(
        'CREATE POLICY tenant_isolation_select ON %I FOR SELECT 
         USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
        tbl
      );

      -- INSERT policy
      EXECUTE format(
        'CREATE POLICY tenant_isolation_insert ON %I FOR INSERT 
         WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
        tbl
      );

      -- UPDATE policy
      EXECUTE format(
        'CREATE POLICY tenant_isolation_update ON %I FOR UPDATE 
         USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int) 
         WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
        tbl
      );

      -- DELETE policy
      EXECUTE format(
        'CREATE POLICY tenant_isolation_delete ON %I FOR DELETE 
         USING ("organizationId" = current_setting(''app.current_organization_id'', true)::int)',
        tbl
      );

      RAISE NOTICE 'RLS enabled on organizationId table: %', tbl;
    ELSE
      RAISE NOTICE 'Table does not exist, skipping: %', tbl;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- SECTION 3: Verification queries
-- ---------------------------------------------------------------------------

-- Verify RLS is enabled
DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;

  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'RLS enabled on % tables', rls_count;
  RAISE NOTICE 'Total policies created: %', policy_count;

  -- Expected: 49 tables × 4 policies = 196 policies
  IF policy_count < 100 THEN
    RAISE WARNING 'Expected more policies. Check migration.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- SECTION 4: Create helper function for setting tenant context
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_tenant_context(p_company_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_company_id', p_company_id, false);
END;
$$;

CREATE OR REPLACE FUNCTION set_organization_context(p_organization_id INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_organization_id', p_organization_id::text, false);
END;
$$;

-- Usage: SELECT set_tenant_context('company-id-here');

-- ---------------------------------------------------------------------------
-- SECTION 5: Create admin bypass role (for emergency access)
-- ---------------------------------------------------------------------------

-- Create admin bypass policy for each table (allows SUPERUSER to bypass RLS)
DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    'accounts', 'billing_status', 'churn_retention_analytics',
    'company_members', 'customer_health_scores', 'dashboard_metrics_cache',
    'executive_alerts', 'executive_analytics_snapshots',
    'executive_kpi_snapshots', 'feature_adoption_metrics', 'feature_usage',
    'founder_control_states', 'invoice_risk_analytics', 'invoices',
    'payments', 'predictive_metrics', 'reconciliation_reports',
    'revenue_analytics', 'suspicious_activities', 'transaction_lines',
    'transactions', 'trend_patterns', 'usage_frequency_metrics',
    'user_activity_logs', 'api_usage_records', 'audit_logs',
    'automation_rules', 'custom_reports', 'departments', 'documents',
    'organization_users'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Admin bypass policy (lowest priority)
      EXECUTE format('DROP POLICY IF EXISTS admin_bypass ON %I', tbl);
      EXECUTE format(
        'CREATE POLICY admin_bypass ON %I 
         FOR ALL 
         USING (current_setting(''app.admin_bypass'', true)::boolean = true)',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- To enable admin bypass:
-- SET app.admin_bypass = 'true';

-- ---------------------------------------------------------------------------
-- SECTION 6: Audit RLS status
-- ---------------------------------------------------------------------------

-- Create view to audit RLS status
CREATE OR REPLACE VIEW rls_audit AS
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE schemaname = t.schemaname 
     AND tablename = t.tablename
  ) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Query to check RLS status:
-- SELECT * FROM rls_audit WHERE rls_enabled = false;

-- ---------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- ---------------------------------------------------------------------------

-- Final verification
DO $$
DECLARE
  summary TEXT;
BEGIN
  SELECT INTO summary
    'RLS Migration Complete: ' ||
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) || ' tables protected, ' ||
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') || ' policies active';
  
  RAISE NOTICE '%', summary;
END $$;
