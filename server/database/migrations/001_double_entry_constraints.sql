-- ============================================
-- CRITICAL: Database-Level Double-Entry Enforcement
-- AccuBooks Financial Platform
-- ============================================
-- This migration adds CONSTRAINT TRIGGERS to enforce accounting invariants
-- at the database level, preventing race conditions and ensuring data integrity.

-- ============================================
-- 1. VALIDATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION validate_double_entry()
RETURNS TRIGGER AS $$
DECLARE
    total_debits NUMERIC(19,4);
    total_credits NUMERIC(19,4);
    line_count INTEGER;
BEGIN
    -- Get sum of all debits and credits for this transaction
    SELECT 
        COALESCE(SUM(CAST(debit AS NUMERIC)), 0),
        COALESCE(SUM(CAST(credit AS NUMERIC)), 0),
        COUNT(*)
    INTO total_debits, total_credits, line_count
    FROM transaction_lines
    WHERE transaction_id = NEW.transaction_id;
    
    -- Must have at least 2 lines (double-entry requirement)
    IF line_count < 2 THEN
        RAISE EXCEPTION 'Double-entry violation: Transaction % must have at least 2 lines, found %',
            NEW.transaction_id, line_count;
    END IF;
    
    -- Debits must equal credits
    IF ABS(total_debits - total_credits) > 0.0001 THEN
        RAISE EXCEPTION 'Double-entry violation: Transaction % is unbalanced. Debits: %, Credits: %',
            NEW.transaction_id, total_debits, total_credits;
    END IF;
    
    -- All amounts must be positive
    IF EXISTS (
        SELECT 1 FROM transaction_lines 
        WHERE transaction_id = NEW.transaction_id 
        AND (CAST(debit AS NUMERIC) < 0 OR CAST(credit AS NUMERIC) < 0)
    ) THEN
        RAISE EXCEPTION 'Double-entry violation: Transaction % contains negative amounts',
            NEW.transaction_id;
    END IF;
    
    -- Each line must have either debit OR credit, not both, not neither
    IF EXISTS (
        SELECT 1 FROM transaction_lines 
        WHERE transaction_id = NEW.transaction_id 
        AND (
            (CAST(debit AS NUMERIC) > 0 AND CAST(credit AS NUMERIC) > 0)
            OR (CAST(debit AS NUMERIC) = 0 AND CAST(credit AS NUMERIC) = 0)
        )
    ) THEN
        RAISE EXCEPTION 'Double-entry violation: Transaction % has invalid line (both/zero debit and credit)',
            NEW.transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CONSTRAINT TRIGGERS (DEFERRABLE)
-- ============================================

-- Trigger to validate after each INSERT on transaction_lines
DROP TRIGGER IF EXISTS trg_validate_double_entry_insert ON transaction_lines;
CREATE CONSTRAINT TRIGGER trg_validate_double_entry_insert
    AFTER INSERT ON transaction_lines
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_double_entry();

-- Trigger to validate after each UPDATE on transaction_lines
DROP TRIGGER IF EXISTS trg_validate_double_entry_update ON transaction_lines;
CREATE CONSTRAINT TRIGGER trg_validate_double_entry_update
    AFTER UPDATE ON transaction_lines
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_double_entry();

-- Trigger to validate before DELETE (ensure remaining lines still balance)
DROP TRIGGER IF EXISTS trg_validate_double_entry_delete ON transaction_lines;
CREATE CONSTRAINT TRIGGER trg_validate_double_entry_delete
    AFTER DELETE ON transaction_lines
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_double_entry();

-- ============================================
-- 3. TRANSACTION-LEVEL VALIDATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION validate_transaction_on_commit()
RETURNS TRIGGER AS $$
DECLARE
    total_debits NUMERIC(19,4);
    total_credits NUMERIC(19,4);
    line_count INTEGER;
BEGIN
    -- Validate the entire transaction on any modification
    SELECT 
        COALESCE(SUM(CAST(debit AS NUMERIC)), 0),
        COALESCE(SUM(CAST(credit AS NUMERIC)), 0),
        COUNT(*)
    INTO total_debits, total_credits, line_count
    FROM transaction_lines
    WHERE transaction_id = NEW.id;
    
    -- Only validate if lines exist (some transactions may be created before lines)
    IF line_count > 0 THEN
        IF line_count < 2 THEN
            RAISE EXCEPTION 'Transaction % must have at least 2 entry lines', NEW.id;
        END IF;
        
        IF ABS(total_debits - total_credits) > 0.0001 THEN
            RAISE EXCEPTION 'Transaction % is unbalanced: Debits=%, Credits=%', 
                NEW.id, total_debits, total_credits;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_transaction ON transactions;
CREATE CONSTRAINT TRIGGER trg_validate_transaction
    AFTER INSERT OR UPDATE ON transactions
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_on_commit();

-- ============================================
-- 4. LEDGER BALANCE CHECK FUNCTION (for account balances)
-- ============================================
CREATE OR REPLACE FUNCTION validate_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    new_balance NUMERIC(19,4);
    account_type TEXT;
    allow_negative BOOLEAN;
BEGIN
    -- Get account type to determine if negative balances are allowed
    SELECT type, allow_negative_balance 
    INTO account_type, allow_negative
    FROM accounts 
    WHERE id = NEW.account_id;
    
    -- Calculate new balance
    SELECT COALESCE(SUM(CAST(debit AS NUMERIC) - CAST(credit AS NUMERIC)), 0)
    INTO new_balance
    FROM transaction_lines
    WHERE account_id = NEW.account_id;
    
    -- Asset and Expense accounts typically shouldn't go negative
    -- (unless explicitly configured)
    IF account_type IN ('asset', 'expense') AND NOT COALESCE(allow_negative, FALSE) THEN
        IF new_balance < 0 THEN
            RAISE EXCEPTION 'Account % would have negative balance: %', NEW.account_id, new_balance;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for account balance validation
DROP TRIGGER IF EXISTS trg_validate_account_balance ON transaction_lines;
CREATE CONSTRAINT TRIGGER trg_validate_account_balance
    AFTER INSERT OR UPDATE ON transaction_lines
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION validate_account_balance();

-- ============================================
-- 5. VERIFICATION
-- ============================================
COMMENT ON FUNCTION validate_double_entry() IS 
    'Ensures all transactions maintain double-entry accounting invariants at the database level';

COMMENT ON FUNCTION validate_transaction_on_commit() IS 
    'Validates transaction integrity when committing to the database';

-- Add to migration tracking
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('202502050001', 'double_entry_constraints', NOW())
ON CONFLICT DO NOTHING;

SELECT 'Double-entry database constraints installed successfully' AS status;
