-- CRITICAL: Idempotency Schema
-- MANDATORY: Database-level idempotency enforcement with exactly-once semantics

CREATE TABLE IF NOT EXISTS idempotency_keys (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Key definition
    key VARCHAR(512) NOT NULL,
    scope VARCHAR(32) NOT NULL CHECK (scope IN ('GLOBAL', 'TENANT', 'USER', 'SESSION', 'OPERATION')),
    tenant_id VARCHAR(64),
    user_id VARCHAR(64),
    session_id VARCHAR(128),
    operation_type VARCHAR(128) NOT NULL,
    
    -- CRITICAL: Execution state
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED')),
    result JSONB,
    error TEXT,
    
    -- CRITICAL: Execution tracking
    execution_count INTEGER NOT NULL DEFAULT 0,
    max_executions INTEGER NOT NULL DEFAULT 1,
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- CRITICAL: Additional metadata
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- CRITICAL: Constraints
    UNIQUE(key),
    CONSTRAINT idempotency_keys_execution_check CHECK (
        (status IN ('COMPLETED', 'FAILED', 'EXPIRED')) OR 
        (status IN ('PENDING', 'IN_PROGRESS') AND execution_count <= max_executions)
    ),
    CONSTRAINT idempotency_keys_expiration_check CHECK (expires_at > created_at),
    CONSTRAINT idempotency_keys_execution_count_check CHECK (execution_count >= 0 AND max_executions >= 1)
);

-- CRITICAL: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope ON idempotency_keys(scope);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_id ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_session_id ON idempotency_keys(session_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_operation_type ON idempotency_keys(operation_type);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON idempotency_keys(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_last_executed_at ON idempotency_keys(last_executed_at DESC);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_status ON idempotency_keys(scope, status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_status ON idempotency_keys(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_operation_status ON idempotency_keys(operation_type, status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_status ON idempotency_keys(expires_at, status);

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's keys
CREATE POLICY tenant_isolation_idempotency_keys ON idempotency_keys
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id IS NULL);

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_idempotency_keys ON idempotency_keys
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to create idempotency key
CREATE OR REPLACE FUNCTION create_idempotency_key(
    p_key VARCHAR(512),
    p_scope VARCHAR(32),
    p_tenant_id VARCHAR(64) DEFAULT NULL,
    p_user_id VARCHAR(64) DEFAULT NULL,
    p_session_id VARCHAR(128) DEFAULT NULL,
    p_operation_type VARCHAR(128),
    p_ttl INTEGER DEFAULT 3600000, -- 1 hour in milliseconds
    p_max_executions INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_key_id VARCHAR(64);
    v_random_bytes BYTEA;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- CRITICAL: Generate secure key ID
    v_random_bytes := gen_random_bytes(16);
    v_key_id := 'idemp_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Calculate expiration time
    v_expires_at := NOW() + (p_ttl / 1000) * INTERVAL '1 second';
    
    -- CRITICAL: Create idempotency key with upsert to handle race conditions
    INSERT INTO idempotency_keys (
        id, key, scope, tenant_id, user_id, session_id, operation_type,
        status, execution_count, max_executions, expires_at, metadata
    ) VALUES (
        v_key_id, p_key, p_scope, p_tenant_id, p_user_id, p_session_id, p_operation_type,
        'PENDING', 0, p_max_executions, v_expires_at, p_metadata
    )
    ON CONFLICT (key) DO NOTHING;
    
    -- CRITICAL: Check if key was created or already exists
    IF NOT FOUND THEN
        -- CRITICAL: Key already exists, get existing key
        SELECT id INTO v_key_id
        FROM idempotency_keys
        WHERE key = p_key;
    END IF;
    
    RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to check idempotency
CREATE OR REPLACE FUNCTION check_idempotency(
    p_key VARCHAR(512),
    p_operation_type VARCHAR(128),
    p_scope VARCHAR(32),
    p_tenant_id VARCHAR(64) DEFAULT NULL,
    p_user_id VARCHAR(64) DEFAULT NULL,
    p_session_id VARCHAR(128) DEFAULT NULL,
    p_ttl INTEGER DEFAULT 3600000,
    p_max_executions INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    key_id VARCHAR(64),
    key VARCHAR(512),
    status VARCHAR(32),
    result JSONB,
    error TEXT,
    execution_count INTEGER,
    max_executions INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_duplicate BOOLEAN,
    should_execute BOOLEAN
) AS $$
DECLARE
    v_key_id VARCHAR(64);
    v_current_status VARCHAR(32);
    v_current_result JSONB;
    v_current_error TEXT;
    v_current_execution_count INTEGER;
    v_current_max_executions INTEGER;
    v_current_expires_at TIMESTAMP WITH TIME ZONE;
    v_is_duplicate BOOLEAN := FALSE;
    v_should_execute BOOLEAN := FALSE;
BEGIN
    -- CRITICAL: Try to create key (handles race conditions)
    v_key_id := create_idempotency_key(
        p_key, p_scope, p_tenant_id, p_user_id, p_session_id,
        p_operation_type, p_ttl, p_max_executions, p_metadata
    );
    
    -- CRITICAL: Get current key state
    SELECT 
        ik.status, ik.result, ik.error, ik.execution_count, ik.max_executions, ik.expires_at
    INTO 
        v_current_status, v_current_result, v_current_error, v_current_execution_count, 
        v_current_max_executions, v_current_expires_at
    FROM idempotency_keys ik
    WHERE ik.id = v_key_id;
    
    -- CRITICAL: Check if key has expired
    IF v_current_expires_at < NOW() THEN
        -- CRITICAL: Update status to expired
        UPDATE idempotency_keys
        SET status = 'EXPIRED'
        WHERE id = v_key_id;
        
        v_current_status := 'EXPIRED';
    END IF;
    
    -- CRITICAL: Determine if duplicate and should execute
    CASE v_current_status
        WHEN 'PENDING' THEN
            v_is_duplicate := FALSE;
            v_should_execute := TRUE;
        WHEN 'IN_PROGRESS' THEN
            v_is_duplicate := TRUE;
            v_should_execute := FALSE;
            v_current_error := COALESCE(v_current_error, 'Operation currently in progress');
        WHEN 'COMPLETED' THEN
            v_is_duplicate := TRUE;
            v_should_execute := FALSE;
        WHEN 'FAILED' THEN
            v_is_duplicate := TRUE;
            v_should_execute := FALSE;
        WHEN 'EXPIRED' THEN
            v_is_duplicate := TRUE;
            v_should_execute := FALSE;
            v_current_error := 'Key expired';
        ELSE
            v_is_duplicate := TRUE;
            v_should_execute := FALSE;
            v_current_error := 'Unknown status';
    END CASE;
    
    -- CRITICAL: Check execution count limit
    IF v_current_execution_count >= v_current_max_executions THEN
        v_should_execute := FALSE;
        v_current_error := COALESCE(v_current_error, 'Maximum execution count exceeded');
    END IF;
    
    RETURN QUERY SELECT 
        v_key_id, p_key, v_current_status, v_current_result, v_current_error,
        v_current_execution_count, v_current_max_executions, v_current_expires_at,
        v_is_duplicate, v_should_execute;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to start execution
CREATE OR REPLACE FUNCTION start_execution(
    p_key_id VARCHAR(64),
    p_user_id VARCHAR(64) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
    v_current_status VARCHAR(32);
BEGIN
    -- CRITICAL: Get current status
    SELECT status INTO v_current_status
    FROM idempotency_keys
    WHERE id = p_key_id;
    
    -- CRITICAL: Can only start execution from PENDING status
    IF v_current_status != 'PENDING' THEN
        RETURN FALSE;
    END IF;
    
    -- CRITICAL: Update status to IN_PROGRESS
    UPDATE idempotency_keys
    SET 
        status = 'IN_PROGRESS',
        execution_count = execution_count + 1,
        last_executed_at = NOW()
    WHERE id = p_key_id AND status = 'PENDING';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to complete execution
CREATE OR REPLACE FUNCTION complete_execution(
    p_key_id VARCHAR(64),
    p_result JSONB,
    p_user_id VARCHAR(64) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
    v_current_status VARCHAR(32);
BEGIN
    -- CRITICAL: Get current status
    SELECT status INTO v_current_status
    FROM idempotency_keys
    WHERE id = p_key_id;
    
    -- CRITICAL: Can only complete execution from IN_PROGRESS status
    IF v_current_status != 'IN_PROGRESS' THEN
        RETURN FALSE;
    END IF;
    
    -- CRITICAL: Update status to COMPLETED
    UPDATE idempotency_keys
    SET 
        status = 'COMPLETED',
        result = p_result,
        completed_at = NOW(),
        last_executed_at = NOW()
    WHERE id = p_key_id AND status = 'IN_PROGRESS';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to fail execution
CREATE OR REPLACE FUNCTION fail_execution(
    p_key_id VARCHAR(64),
    p_error TEXT,
    p_user_id VARCHAR(64) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
    v_current_status VARCHAR(32);
BEGIN
    -- CRITICAL: Get current status
    SELECT status INTO v_current_status
    FROM idempotency_keys
    WHERE id = p_key_id;
    
    -- CRITICAL: Can only fail execution from IN_PROGRESS status
    IF v_current_status != 'IN_PROGRESS' THEN
        RETURN FALSE;
    END IF;
    
    -- CRITICAL: Update status to FAILED
    UPDATE idempotency_keys
    SET 
        status = 'FAILED',
        error = p_error,
        last_executed_at = NOW()
    WHERE id = p_key_id AND status = 'IN_PROGRESS';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to cleanup expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS TABLE (
    cleaned_count BIGINT
) AS $$
DECLARE
    v_cleaned_count BIGINT;
BEGIN
    -- CRITICAL: Delete expired keys
    DELETE FROM idempotency_keys
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get idempotency statistics
CREATE OR REPLACE FUNCTION get_idempotency_statistics(
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    total_keys BIGINT,
    keys_by_status JSONB,
    keys_by_scope JSONB,
    keys_by_operation JSONB,
    average_execution_count NUMERIC,
    expired_keys BIGINT,
    keys_per_tenant JSONB
) AS $$
DECLARE
    v_total_keys BIGINT;
    v_keys_by_status JSONB;
    v_keys_by_scope JSONB;
    v_keys_by_operation JSONB;
    v_average_execution_count NUMERIC;
    v_expired_keys BIGINT;
    v_keys_per_tenant JSONB;
BEGIN
    -- CRITICAL: Get total keys
    SELECT COUNT(*)::BIGINT INTO v_total_keys
    FROM idempotency_keys
    WHERE p_tenant_id IS NULL OR tenant_id = p_tenant_id;
    
    -- CRITICAL: Get keys by status
    SELECT jsonb_object_agg(status, key_count) INTO v_keys_by_status
    FROM (
        SELECT status, COUNT(*)::BIGINT as key_count
        FROM idempotency_keys
        WHERE p_tenant_id IS NULL OR tenant_id = p_tenant_id
        GROUP BY status
    ) status_counts;
    
    -- CRITICAL: Get keys by scope
    SELECT jsonb_object_agg(scope, key_count) INTO v_keys_by_scope
    FROM (
        SELECT scope, COUNT(*)::BIGINT as key_count
        FROM idempotency_keys
        WHERE p_tenant_id IS NULL OR tenant_id = p_tenant_id
        GROUP BY scope
    ) scope_counts;
    
    -- CRITICAL: Get keys by operation
    SELECT jsonb_object_agg(operation_type, key_count) INTO v_keys_by_operation
    FROM (
        SELECT operation_type, COUNT(*)::BIGINT as key_count
        FROM idempotency_keys
        WHERE p_tenant_id IS NULL OR tenant_id = p_tenant_id
        GROUP BY operation_type
    ) operation_counts;
    
    -- CRITICAL: Get average execution count
    SELECT COALESCE(AVG(execution_count), 0) INTO v_average_execution_count
    FROM idempotency_keys
    WHERE p_tenant_id IS NULL OR tenant_id = p_tenant_id;
    
    -- CRITICAL: Get expired keys count
    SELECT COUNT(*)::BIGINT INTO v_expired_keys
    FROM idempotency_keys
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND expires_at < NOW();
    
    -- CRITICAL: Get keys per tenant (if not filtered by tenant)
    IF p_tenant_id IS NULL THEN
        SELECT jsonb_object_agg(tenant_id, key_count) INTO v_keys_per_tenant
        FROM (
            SELECT COALESCE(tenant_id, 'GLOBAL') as tenant_id, COUNT(*)::BIGINT as key_count
            FROM idempotency_keys
            GROUP BY COALESCE(tenant_id, 'GLOBAL')
        ) tenant_counts;
    ELSE
        v_keys_per_tenant := jsonb_build_object(p_tenant_id, v_total_keys);
    END IF;
    
    RETURN QUERY SELECT 
        v_total_keys, v_keys_by_status, v_keys_by_scope, v_keys_by_operation,
        v_average_execution_count, v_expired_keys, v_keys_per_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to enforce exactly-once constraint
CREATE OR REPLACE FUNCTION enforce_exactly_once_constraint()
RETURNS TRIGGER AS $$
BEGIN
    -- CRITICAL: This trigger prevents duplicate execution
    -- It's called when attempting to update a key to IN_PROGRESS status
    
    -- CRITICAL: Check if key is already IN_PROGRESS
    IF EXISTS (
        SELECT 1 FROM idempotency_keys 
        WHERE key = NEW.key AND status = 'IN_PROGRESS' AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Duplicate execution detected for key: %', NEW.key;
    END IF;
    
    -- CRITICAL: Check execution count limit
    IF NEW.execution_count > NEW.max_executions THEN
        RAISE EXCEPTION 'Execution count exceeded for key: %', NEW.key;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CRITICAL: Create trigger for exactly-once enforcement
CREATE TRIGGER idempotency_keys_exactly_once_trigger
    BEFORE INSERT OR UPDATE ON idempotency_keys
    FOR EACH ROW
    EXECUTE FUNCTION enforce_exactly_once_constraint();

-- CRITICAL: Grant permissions
GRANT SELECT ON idempotency_keys TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON idempotency_keys TO system_administrators;

GRANT EXECUTE ON FUNCTION create_idempotency_key TO system_administrators;
GRANT EXECUTE ON FUNCTION check_idempotency TO authenticated_users;
GRANT EXECUTE ON FUNCTION check_idempotency TO system_administrators;
GRANT EXECUTE ON FUNCTION start_execution TO system_administrators;
GRANT EXECUTE ON FUNCTION complete_execution TO system_administrators;
GRANT EXECUTE ON FUNCTION fail_execution TO system_administrators;
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency_keys TO system_administrators;
GRANT EXECUTE ON FUNCTION get_idempotency_statistics TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE idempotency_keys IS 'Idempotency keys for exactly-once execution guarantees';
COMMENT ON COLUMN idempotency_keys.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN idempotency_keys.key IS 'Unique idempotency key';
COMMENT ON COLUMN idempotency_keys.scope IS 'Scope of the idempotency key';
COMMENT ON COLUMN idempotency_keys.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN idempotency_keys.user_id IS 'User identifier for user-scoped keys';
COMMENT ON COLUMN idempotency_keys.session_id IS 'Session identifier for session-scoped keys';
COMMENT ON COLUMN idempotency_keys.operation_type IS 'Type of operation being protected';
COMMENT ON COLUMN idempotency_keys.status IS 'Current execution status';
COMMENT ON COLUMN idempotency_keys.result IS 'Result of successful execution';
COMMENT ON COLUMN idempotency_keys.error IS 'Error message if execution failed';
COMMENT ON COLUMN idempotency_keys.execution_count IS 'Number of execution attempts';
COMMENT ON COLUMN idempotency_keys.max_executions IS 'Maximum allowed executions';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'Expiration time for the key';
COMMENT ON COLUMN idempotency_keys.last_executed_at IS 'Last time the operation was executed';
COMMENT ON COLUMN idempotency_keys.completed_at IS 'Time when execution completed';

COMMENT ON FUNCTION create_idempotency_key() IS 'Create a new idempotency key with conflict handling';
COMMENT ON FUNCTION check_idempotency() IS 'Check idempotency and determine if execution should proceed';
COMMENT ON FUNCTION start_execution() IS 'Mark execution as started';
COMMENT ON FUNCTION complete_execution() IS 'Mark execution as completed with result';
COMMENT ON FUNCTION fail_execution() IS 'Mark execution as failed with error';
COMMENT ON FUNCTION cleanup_expired_idempotency_keys() IS 'Clean up expired idempotency keys';
COMMENT ON FUNCTION get_idempotency_statistics() IS 'Get statistics about idempotency keys';
COMMENT ON FUNCTION enforce_exactly_once_constraint() IS 'Trigger to enforce exactly-once execution';
