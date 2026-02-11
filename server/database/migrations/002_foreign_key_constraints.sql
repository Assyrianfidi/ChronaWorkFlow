-- ============================================
-- CRITICAL: Foreign Key Constraints with ON DELETE RESTRICT
-- AccuBooks Financial Platform
-- ============================================
-- This migration adds comprehensive foreign key constraints
-- to prevent orphaned financial records and ensure referential integrity.

-- ============================================
-- 1. TRANSACTION LINES -> TRANSACTIONS
-- ============================================
-- Prevent orphaned transaction lines
ALTER TABLE transaction_lines
    DROP CONSTRAINT IF EXISTS fk_transaction_lines_transaction;
    
ALTER TABLE transaction_lines
    ADD CONSTRAINT fk_transaction_lines_transaction
    FOREIGN KEY (transaction_id) 
    REFERENCES transactions(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 2. TRANSACTION LINES -> ACCOUNTS
-- ============================================
ALTER TABLE transaction_lines
    DROP CONSTRAINT IF EXISTS fk_transaction_lines_account;
    
ALTER TABLE transaction_lines
    ADD CONSTRAINT fk_transaction_lines_account
    FOREIGN KEY (account_id) 
    REFERENCES accounts(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 3. TRANSACTIONS -> COMPANIES
-- ============================================
ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS fk_transactions_company;
    
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 4. INVOICES -> COMPANIES
-- ============================================
ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS fk_invoices_company;
    
ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 5. INVOICES -> CUSTOMERS
-- ============================================
ALTER TABLE invoices
    DROP CONSTRAINT IF EXISTS fk_invoices_customer;
    
ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_customer
    FOREIGN KEY (customer_id) 
    REFERENCES customers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 6. BILLS -> COMPANIES
-- ============================================
ALTER TABLE bills
    DROP CONSTRAINT IF EXISTS fk_bills_company;
    
ALTER TABLE bills
    ADD CONSTRAINT fk_bills_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 7. BILLS -> VENDORS
-- ============================================
ALTER TABLE bills
    DROP CONSTRAINT IF EXISTS fk_bills_vendor;
    
ALTER TABLE bills
    ADD CONSTRAINT fk_bills_vendor
    FOREIGN KEY (vendor_id) 
    REFERENCES vendors(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 8. ACCOUNTS -> COMPANIES
-- ============================================
ALTER TABLE accounts
    DROP CONSTRAINT IF EXISTS fk_accounts_company;
    
ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 9. CUSTOMERS -> COMPANIES
-- ============================================
ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS fk_customers_company;
    
ALTER TABLE customers
    ADD CONSTRAINT fk_customers_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 10. VENDORS -> COMPANIES
-- ============================================
ALTER TABLE vendors
    DROP CONSTRAINT IF EXISTS fk_vendors_company;
    
ALTER TABLE vendors
    ADD CONSTRAINT fk_vendors_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 11. EMPLOYEES -> COMPANIES
-- ============================================
ALTER TABLE employees
    DROP CONSTRAINT IF EXISTS fk_employees_company;
    
ALTER TABLE employees
    ADD CONSTRAINT fk_employees_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 12. PAYROLL PERIODS -> COMPANIES
-- ============================================
ALTER TABLE payroll_periods
    DROP CONSTRAINT IF EXISTS fk_payroll_periods_company;
    
ALTER TABLE payroll_periods
    ADD CONSTRAINT fk_payroll_periods_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 13. PAY RUNS -> PAYROLL PERIODS
-- ============================================
ALTER TABLE pay_runs
    DROP CONSTRAINT IF EXISTS fk_pay_runs_period;
    
ALTER TABLE pay_runs
    ADD CONSTRAINT fk_pay_runs_period
    FOREIGN KEY (payroll_period_id) 
    REFERENCES payroll_periods(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 14. INVENTORY ITEMS -> COMPANIES
-- ============================================
ALTER TABLE inventory_items
    DROP CONSTRAINT IF EXISTS fk_inventory_items_company;
    
ALTER TABLE inventory_items
    ADD CONSTRAINT fk_inventory_items_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 15. INVENTORY TRANSACTIONS -> INVENTORY ITEMS
-- ============================================
ALTER TABLE inventory_transactions
    DROP CONSTRAINT IF EXISTS fk_inventory_transactions_item;
    
ALTER TABLE inventory_transactions
    ADD CONSTRAINT fk_inventory_transactions_item
    FOREIGN KEY (item_id) 
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- ============================================
-- 16. COMPANY MEMBERSHIPS -> COMPANIES
-- ============================================
ALTER TABLE company_memberships
    DROP CONSTRAINT IF EXISTS fk_company_memberships_company;
    
ALTER TABLE company_memberships
    ADD CONSTRAINT fk_company_memberships_company
    FOREIGN KEY (company_id) 
    REFERENCES companies(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ============================================
-- 17. COMPANY MEMBERSHIPS -> USERS
-- ============================================
ALTER TABLE company_memberships
    DROP CONSTRAINT IF EXISTS fk_company_memberships_user;
    
ALTER TABLE company_memberships
    ADD CONSTRAINT fk_company_memberships_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ============================================
-- 18. AUDIT LOGS -> COMPANIES (if company_id exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audit_logs' AND column_name = 'company_id') THEN
        ALTER TABLE audit_logs
            DROP CONSTRAINT IF EXISTS fk_audit_logs_company;
            
        ALTER TABLE audit_logs
            ADD CONSTRAINT fk_audit_logs_company
            FOREIGN KEY (company_id) 
            REFERENCES companies(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 19. AUDIT LOGS -> USERS (actor tracking)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audit_logs' AND column_name = 'actor_id') THEN
        ALTER TABLE audit_logs
            DROP CONSTRAINT IF EXISTS fk_audit_logs_actor;
            
        ALTER TABLE audit_logs
            ADD CONSTRAINT fk_audit_logs_actor
            FOREIGN KEY (actor_id) 
            REFERENCES users(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 20. SOFT DELETE PROTECTION TRIGGER
-- ============================================
-- Prevent accidental deletion of companies with financial data
CREATE OR REPLACE FUNCTION prevent_company_deletion()
RETURNS TRIGGER AS $$
DECLARE
    has_transactions BOOLEAN;
    has_invoices BOOLEAN;
    has_bills BOOLEAN;
    has_accounts BOOLEAN;
BEGIN
    -- Check for any financial data
    SELECT EXISTS(SELECT 1 FROM transactions WHERE company_id = OLD.id) INTO has_transactions;
    SELECT EXISTS(SELECT 1 FROM invoices WHERE company_id = OLD.id) INTO has_invoices;
    SELECT EXISTS(SELECT 1 FROM bills WHERE company_id = OLD.id) INTO has_bills;
    SELECT EXISTS(SELECT 1 FROM accounts WHERE company_id = OLD.id) INTO has_accounts;
    
    IF has_transactions OR has_invoices OR has_bills OR has_accounts THEN
        RAISE EXCEPTION 'Cannot delete company %: financial records exist (transactions, invoices, bills, or accounts)', OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_company_deletion ON companies;
CREATE TRIGGER trg_prevent_company_deletion
    BEFORE DELETE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_company_deletion();

-- ============================================
-- 21. INDEXES FOR FOREIGN KEY PERFORMANCE
-- ============================================
-- These indexes speed up FK validation and cascade operations
CREATE INDEX IF NOT EXISTS idx_transaction_lines_transaction_id ON transaction_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_account_id ON transaction_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_company_id ON bills(company_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_company_id ON inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company_id ON payroll_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_pay_runs_period_id ON pay_runs(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON company_memberships(user_id);

-- ============================================
-- VERIFICATION
-- ============================================
COMMENT ON FUNCTION prevent_company_deletion() IS 
    'Prevents deletion of companies that have financial records, protecting data integrity';

-- Add to migration tracking
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('202502050002', 'foreign_key_constraints', NOW())
ON CONFLICT DO NOTHING;

SELECT 'Foreign key constraints with ON DELETE RESTRICT installed successfully' AS status;
