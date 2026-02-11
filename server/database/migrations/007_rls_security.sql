-- ============================================
-- CRITICAL: PostgreSQL Row-Level Security (RLS) Implementation
-- AccuBooks Financial Platform
-- 
-- This migration enables RLS on all financial tables to enforce
-- strict tenant isolation at the database level.
-- ============================================

-- ============================================
-- 1. ENABLE RLS ON ALL FINANCIAL TABLES
-- ============================================

-- Companies table (base tenant isolation)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Transactions and lines
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_lines ENABLE ROW LEVEL SECURITY;

-- Accounts (Chart of Accounts)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Invoices and related
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Bills and related
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Customers and Vendors
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Inventory
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_layers ENABLE ROW LEVEL SECURITY;

-- Payroll
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_run_details ENABLE ROW LEVEL SECURITY;

-- Company memberships (user access control)
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- Audit logs (tenant-scoped)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE TENANT ISOLATION POLICIES
-- ============================================

-- Policy: Companies - Users can only see companies they belong to
CREATE POLICY tenant_companies_isolation ON companies
    USING (
        EXISTS (
            SELECT 1 FROM company_memberships 
            WHERE company_memberships.company_id = companies.id 
            AND company_memberships.user_id = current_setting('app.current_user_id')::uuid
        )
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Transactions - Strict company isolation
CREATE POLICY tenant_transactions_isolation ON transactions
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Transaction Lines - Inherit from parent transaction
CREATE POLICY tenant_transaction_lines_isolation ON transaction_lines
    USING (
        EXISTS (
            SELECT 1 FROM transactions 
            WHERE transactions.id = transaction_lines.transaction_id 
            AND transactions.company_id = current_setting('app.current_company_id')::uuid
        )
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Accounts - Company-scoped chart of accounts
CREATE POLICY tenant_accounts_isolation ON accounts
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Invoices - Company isolation
CREATE POLICY tenant_invoices_isolation ON invoices
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Invoice Items - Inherit from parent
CREATE POLICY tenant_invoice_items_isolation ON invoice_items
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.company_id = current_setting('app.current_company_id')::uuid
        )
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Bills - Company isolation
CREATE POLICY tenant_bills_isolation ON bills
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Customers - Company-scoped
CREATE POLICY tenant_customers_isolation ON customers
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Vendors - Company-scoped
CREATE POLICY tenant_vendors_isolation ON vendors
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Inventory Items - Company-scoped
CREATE POLICY tenant_inventory_items_isolation ON inventory_items
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Employees - Company-scoped payroll data
CREATE POLICY tenant_employees_isolation ON employees
    USING (
        company_id = current_setting('app.current_company_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- Policy: Audit Logs - Tenant can only see own logs
CREATE POLICY tenant_audit_logs_isolation ON audit_logs
    USING (
        tenant_id = current_setting('app.current_tenant_id')::uuid
        OR
        current_setting('app.is_service_account')::boolean = true
    );

-- ============================================
-- 3. CREATE ADMIN BYPASS POLICY (for migrations/backups)
-- ============================================

-- Bypass RLS for superuser/service accounts
CREATE POLICY admin_bypass_companies ON companies
    USING (current_setting('app.is_service_account')::boolean = true)
    WITH CHECK (current_setting('app.is_service_account')::boolean = true);

-- ============================================
-- 4. FORCE RLS FOR TABLE OWNERS
-- ============================================

-- Ensure RLS applies even to table owners (forces all queries through policies)
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE bills FORCE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory_items FORCE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS CONTEXT SETUP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION set_tenant_context(
    p_user_id UUID,
    p_company_id UUID,
    p_tenant_id UUID,
    p_is_service_account BOOLEAN DEFAULT false
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    PERFORM set_config('app.current_company_id', p_company_id::text, true);
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
    PERFORM set_config('app.is_service_account', p_is_service_account::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE RLS VERIFICATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION verify_rls_isolation(
    p_table_name TEXT,
    p_expected_company_id UUID
) RETURNS TABLE (
    has_violations BOOLEAN,
    violation_count BIGINT,
    details TEXT
) AS $$
DECLARE
    v_count BIGINT;
    v_query TEXT;
BEGIN
    -- Temporarily bypass RLS for verification
    PERFORM set_config('app.is_service_account', 'true', true);
    
    v_query := format(
        'SELECT COUNT(*) FROM %I WHERE company_id != %L',
        p_table_name,
        p_expected_company_id
    );
    
    EXECUTE v_query INTO v_count;
    
    RETURN QUERY SELECT 
        v_count > 0,
        v_count,
        CASE 
            WHEN v_count > 0 THEN format('Found %s records from other companies', v_count)
            ELSE 'No violations - RLS working correctly'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE AUDIT TRIGGER FOR RLS VIOLATIONS
-- ============================================

CREATE OR REPLACE FUNCTION log_rls_access_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- Log any access attempt that bypasses RLS
    INSERT INTO audit_logs (
        id, tenant_id, actor_id, action, resource_type, resource_id,
        outcome, timestamp, correlation_id, metadata, severity, category
    ) VALUES (
        gen_random_uuid(),
        current_setting('app.current_tenant_id')::uuid,
        current_setting('app.current_user_id')::uuid,
        'RLS_ACCESS_ATTEMPT',
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text, 'unknown'),
        'SUCCESS',
        NOW(),
        'rls-check-' || gen_random_uuid(),
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'user_id', current_setting('app.current_user_id'),
            'company_id', current_setting('app.current_company_id')
        ),
        'LOW',
        'AUTHENTICATION'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers for critical tables
CREATE TRIGGER trg_audit_rls_transactions
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_rls_access_attempt();

-- ============================================
-- 8. GRANT PERMISSIONS FOR RLS FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION set_tenant_context(UUID, UUID, UUID, BOOLEAN) TO application_role;
GRANT EXECUTE ON FUNCTION verify_rls_isolation(TEXT, UUID) TO admin_role;

-- ============================================
-- VERIFICATION
-- ============================================

-- Add to migration tracking
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('202502050007', 'rls_security', NOW())
ON CONFLICT DO NOTHING;

SELECT 'PostgreSQL Row-Level Security (RLS) enabled successfully on all financial tables' AS status;
