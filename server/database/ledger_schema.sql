/**
 * Ledger Service - Database Schema
 * PostgreSQL schema for double-entry accounting with dimensional support
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CHART OF ACCOUNTS
-- ============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,              -- e.g., "1000", "4100"
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    subtype VARCHAR(50),                    -- e.g., "current_asset", "long_term_debt"
    parent_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    
    -- Account configuration
    is_bank_account BOOLEAN DEFAULT FALSE,
    bank_account_id UUID,                   -- Reference to bank_accounts table
    
    -- Tax and compliance
    tax_code VARCHAR(50),
    
    -- Dimensional tracking (which dimensions this account accepts)
    track_location BOOLEAN DEFAULT FALSE,
    track_department BOOLEAN DEFAULT FALSE,
    track_project BOOLEAN DEFAULT FALSE,
    track_class BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,        -- System accounts cannot be deleted
    
    -- Metadata
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_company_account_code UNIQUE (company_id, code),
    CONSTRAINT no_self_parent CHECK (parent_id != id)
);

-- Index for fast lookup
CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_accounts_company_active ON accounts(company_id, is_active);
CREATE INDEX idx_accounts_type ON accounts(company_id, type);

-- ============================================
-- DIMENSIONS (Location, Department, Project, Class)
-- ============================================

CREATE TABLE dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,             -- "Location", "Department"
    code VARCHAR(50) NOT NULL,              -- "LOC", "DEPT"
    type VARCHAR(20) NOT NULL CHECK (type IN ('location', 'department', 'project', 'class')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_company_dimension UNIQUE (company_id, code)
);

CREATE TABLE dimension_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,              -- "NYC", "MARKETING"
    name VARCHAR(255) NOT NULL,             -- "New York Office"
    parent_id UUID REFERENCES dimension_values(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_dimension_value UNIQUE (dimension_id, code)
);

CREATE INDEX idx_dimensions_company ON dimensions(company_id);
CREATE INDEX idx_dimension_values_dimension ON dimension_values(dimension_id);

-- ============================================
-- ACCOUNTING PERIODS
-- ============================================

CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,              -- "January 2026"
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('month', 'quarter', 'year')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Period status
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    
    -- Close adjustments
    adjustment_transaction_id UUID,         -- Reference to closing entries
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT unique_company_period UNIQUE (company_id, start_date, period_type)
);

CREATE INDEX idx_periods_company ON accounting_periods(company_id);
CREATE INDEX idx_periods_date_range ON accounting_periods(company_id, start_date, end_date);

-- ============================================
-- TRANSACTIONS (Journal Entries)
-- ============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    
    -- Transaction metadata
    transaction_number VARCHAR(50) NOT NULL,    -- Human-readable reference
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(255),                       -- External reference (invoice #, check #)
    
    -- Transaction type
    type VARCHAR(50) NOT NULL,                    -- "manual", "invoice", "payment", "bank_import", "adjustment"
    source_id UUID,                               -- Reference to source document
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed', 'pending')),
    
    -- Posting metadata
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID,
    
    -- Reversal tracking (immutable ledger)
    reversed_transaction_id UUID REFERENCES transactions(id),
    reversal_reason TEXT,
    
    -- Idempotency for retries
    idempotency_key VARCHAR(255) UNIQUE,
    
    -- Dimensional values (at transaction level - can be overridden per line)
    location_id UUID REFERENCES dimension_values(id),
    department_id UUID REFERENCES dimension_values(id),
    project_id UUID REFERENCES dimension_values(id),
    class_id UUID REFERENCES dimension_values(id),
    
    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_company_transaction_number UNIQUE (company_id, transaction_number)
);

CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_date ON transactions(company_id, date);
CREATE INDEX idx_transactions_status ON transactions(company_id, status);
CREATE INDEX idx_transactions_type ON transactions(company_id, type);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================
-- TRANSACTION LINES (Double-Entry Lines)
-- ============================================

CREATE TABLE transaction_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    
    -- Account reference
    account_id UUID NOT NULL REFERENCES accounts(id),
    
    -- Amounts (stored as cents to avoid floating point)
    debit_cents BIGINT NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
    credit_cents BIGINT NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
    
    -- Cannot have both debit and credit
    CONSTRAINT valid_amount CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR 
        (credit_cents > 0 AND debit_cents = 0) OR 
        (debit_cents = 0 AND credit_cents = 0)
    ),
    
    -- Line description
    description TEXT,
    
    -- Dimensional values (override transaction-level)
    location_id UUID REFERENCES dimension_values(id),
    department_id UUID REFERENCES dimension_values(id),
    project_id UUID REFERENCES dimension_values(id),
    class_id UUID REFERENCES dimension_values(id),
    
    -- Source reference
    source_type VARCHAR(50),                    -- "invoice_line", "payment", "allocation"
    source_id UUID,
    
    -- Line order for display
    line_number INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_line_number CHECK (line_number >= 0)
);

CREATE INDEX idx_transaction_lines_transaction ON transaction_lines(transaction_id);
CREATE INDEX idx_transaction_lines_account ON transaction_lines(account_id);
CREATE INDEX idx_transaction_lines_company_account ON transaction_lines(company_id, account_id);

-- ============================================
-- CRITICAL CONSTRAINT: Transaction Balance
-- This ensures every transaction balances to zero
-- ============================================

CREATE OR REPLACE FUNCTION validate_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation for draft transactions
    IF NEW.status = 'draft' THEN
        RETURN NEW;
    END IF;
    
    -- Calculate total debits and credits for this transaction
    DECLARE
        total_debits BIGINT;
        total_credits BIGINT;
    BEGIN
        SELECT COALESCE(SUM(debit_cents), 0), COALESCE(SUM(credit_cents), 0)
        INTO total_debits, total_credits
        FROM transaction_lines
        WHERE transaction_id = NEW.id;
        
        -- Transaction must balance
        IF total_debits != total_credits THEN
            RAISE EXCEPTION 'Transaction does not balance: debits=%, credits=%', 
                total_debits, total_credits;
        END IF;
        
        -- Must have at least 2 lines
        IF (SELECT COUNT(*) FROM transaction_lines WHERE transaction_id = NEW.id) < 2 THEN
            RAISE EXCEPTION 'Transaction must have at least 2 lines';
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_transaction_balance
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.status = 'draft' AND NEW.status = 'posted')
    EXECUTE FUNCTION validate_transaction_balance();

-- ============================================
-- ACCOUNT BALANCES (Materialized View)
-- ============================================

CREATE TABLE account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    
    -- Dimensional breakdown (NULL means "all" for that dimension)
    location_id UUID,
    department_id UUID,
    project_id UUID,
    class_id UUID,
    
    -- Balance as of date
    as_of_date DATE NOT NULL,
    
    -- Running totals
    debit_total_cents BIGINT NOT NULL DEFAULT 0,
    credit_total_cents BIGINT NOT NULL DEFAULT 0,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    
    -- Normal balance type determines if positive is debit or credit
    -- For assets/expenses: positive = debit balance
    -- For liabilities/equity/revenue: positive = credit balance
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_balance_slice UNIQUE (company_id, account_id, location_id, department_id, project_id, class_id, as_of_date)
);

CREATE INDEX idx_account_balances_lookup ON account_balances(company_id, account_id, as_of_date);
CREATE INDEX idx_account_balances_dimensions ON account_balances(company_id, location_id, department_id, project_id, class_id);

-- ============================================
-- AUDIT LOG (Immutable event log)
-- ============================================

CREATE TABLE ledger_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    
    event_type VARCHAR(50) NOT NULL,        -- "transaction_posted", "transaction_reversed", "period_closed"
    entity_type VARCHAR(50) NOT NULL,       -- "transaction", "account", "period"
    entity_id UUID NOT NULL,
    
    -- Actor
    user_id UUID,
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Change details
    before_state JSONB,
    after_state JSONB,
    change_summary JSONB,
    
    -- Tamper-evident chain
    previous_hash VARCHAR(64),
    event_hash VARCHAR(64) NOT NULL,       -- SHA-256 of (prev_hash + event_data)
    
    -- Timing
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Correlation for distributed tracing
    correlation_id UUID,
    request_id UUID
);

CREATE INDEX idx_audit_log_company ON ledger_audit_log(company_id, occurred_at);
CREATE INDEX idx_audit_log_entity ON ledger_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_correlation ON ledger_audit_log(correlation_id);

-- ============================================
-- IDEMPOTENCY STORE (For retries)
-- ============================================

CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    company_id UUID NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,   -- Hash of request body
    response_body JSONB,
    response_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL  -- TTL for cleanup
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- ============================================
-- LEDGER INTEGRITY CHECKS
-- ============================================

-- Function to verify ledger integrity
CREATE OR REPLACE FUNCTION verify_ledger_integrity(p_company_id UUID)
RETURNS TABLE (
    check_name VARCHAR,
    is_valid BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- Check 1: All posted transactions balance
    RETURN QUERY
    SELECT 
        'balanced_transactions'::VARCHAR,
        COUNT(*) = 0,
        COALESCE(
            string_agg(t.transaction_number, ', '),
            'All transactions balance'
        )
    FROM transactions t
    WHERE t.company_id = p_company_id
      AND t.status = 'posted'
      AND EXISTS (
          SELECT 1 FROM transaction_lines tl 
          WHERE tl.transaction_id = t.id
          HAVING COALESCE(SUM(tl.debit_cents), 0) != COALESCE(SUM(tl.credit_cents), 0)
      );
    
    -- Check 2: No orphaned transaction lines
    RETURN QUERY
    SELECT 
        'no_orphaned_lines'::VARCHAR,
        COUNT(*) = 0,
        COALESCE(COUNT(*)::TEXT || ' orphaned lines found', 'No orphaned lines')
    FROM transaction_lines tl
    LEFT JOIN transactions t ON tl.transaction_id = t.id
    WHERE tl.company_id = p_company_id
      AND t.id IS NULL;
    
    -- Check 3: Period date continuity
    RETURN QUERY
    SELECT 
        'period_continuity'::VARCHAR,
        COUNT(*) = 0,
        COALESCE(
            string_agg(p.name, ', '),
            'Periods are continuous'
        )
    FROM accounting_periods p
    WHERE p.company_id = p_company_id
      AND p.period_type = 'month'
      AND EXISTS (
          SELECT 1 FROM accounting_periods p2
          WHERE p2.company_id = p_company_id
            AND p2.period_type = 'month'
            AND p2.start_date > p.end_date
            AND p2.start_date != (p.end_date + INTERVAL '1 day')::DATE
            AND p2.start_date = (
                SELECT MIN(p3.start_date) 
                FROM accounting_periods p3 
                WHERE p3.company_id = p_company_id 
                  AND p3.period_type = 'month'
                  AND p3.start_date > p.end_date
            )
      );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Standard Chart of Accounts Template
-- ============================================

CREATE TABLE coa_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Template accounts (JSON array)
    accounts JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard COA template
INSERT INTO coa_templates (name, industry, is_default, accounts) VALUES (
    'Standard Small Business',
    'general',
    TRUE,
    '[
        {"code": "1000", "name": "Cash", "type": "asset", "subtype": "current_asset", "is_bank_account": true},
        {"code": "1100", "name": "Accounts Receivable", "type": "asset", "subtype": "current_asset"},
        {"code": "1200", "name": "Inventory", "type": "asset", "subtype": "current_asset"},
        {"code": "1500", "name": "Fixed Assets", "type": "asset", "subtype": "long_term_asset"},
        {"code": "1600", "name": "Accumulated Depreciation", "type": "asset", "subtype": "contra_asset"},
        {"code": "2000", "name": "Accounts Payable", "type": "liability", "subtype": "current_liability"},
        {"code": "2100", "name": "Credit Cards", "type": "liability", "subtype": "current_liability"},
        {"code": "2200", "name": "Payroll Liabilities", "type": "liability", "subtype": "current_liability"},
        {"code": "2500", "name": "Long Term Debt", "type": "liability", "subtype": "long_term_liability"},
        {"code": "3000", "name": "Owner Equity", "type": "equity", "subtype": "equity"},
        {"code": "3100", "name": "Retained Earnings", "type": "equity", "subtype": "equity"},
        {"code": "3200", "name": "Distributions", "type": "equity", "subtype": "equity"},
        {"code": "4000", "name": "Sales Revenue", "type": "revenue", "subtype": "operating_revenue"},
        {"code": "4100", "name": "Service Revenue", "type": "revenue", "subtype": "operating_revenue"},
        {"code": "5000", "name": "Cost of Goods Sold", "type": "expense", "subtype": "cogs"},
        {"code": "6000", "name": "Advertising", "type": "expense", "subtype": "operating_expense"},
        {"code": "6100", "name": "Bank Fees", "type": "expense", "subtype": "operating_expense"},
        {"code": "6200", "name": "Insurance", "type": "expense", "subtype": "operating_expense"},
        {"code": "6300", "name": "Interest Expense", "type": "expense", "subtype": "operating_expense"},
        {"code": "6400", "name": "Office Supplies", "type": "expense", "subtype": "operating_expense"},
        {"code": "6500", "name": "Payroll Expenses", "type": "expense", "subtype": "operating_expense"},
        {"code": "6600", "name": "Rent", "type": "expense", "subtype": "operating_expense"},
        {"code": "6700", "name": "Utilities", "type": "expense", "subtype": "operating_expense"}
    ]'::JSONB
);
