-- CRITICAL: Legal Holds and Retention Schema
-- MANDATORY: Legal hold tracking and retention policy enforcement

CREATE TABLE IF NOT EXISTS legal_holds (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Legal hold details
    tenant_id VARCHAR(64) NOT NULL,
    data_type VARCHAR(32) NOT NULL CHECK (data_type IN ('AUDIT_LOGS', 'DATABASE_BACKUPS', 'SOFT_DELETED_TENANTS', 'USER_DATA')),
    reason TEXT NOT NULL,
    requested_by VARCHAR(64) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- CRITICAL: Additional context
    metadata JSONB,
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Retention Jobs tracking
CREATE TABLE IF NOT EXISTS retention_jobs (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Job details
    data_type VARCHAR(32) NOT NULL CHECK (data_type IN ('AUDIT_LOGS', 'DATABASE_BACKUPS', 'SOFT_DELETED_TENANTS', 'USER_DATA')),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- CRITICAL: Job statistics
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_deleted INTEGER NOT NULL DEFAULT 0,
    records_skipped INTEGER NOT NULL DEFAULT 0,
    legal_holds_blocked INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    
    -- CRITICAL: Error tracking
    errors JSONB DEFAULT '[]'::JSONB,
    
    -- CRITICAL: Additional context
    metadata JSONB,
    correlation_id VARCHAR(64),
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Retention Policies configuration
CREATE TABLE IF NOT EXISTS retention_policies (
    -- CRITICAL: Primary identifier
    data_type VARCHAR(32) PRIMARY KEY CHECK (data_type IN ('AUDIT_LOGS', 'DATABASE_BACKUPS', 'SOFT_DELETED_TENANTS', 'USER_DATA')),
    
    -- CRITICAL: Policy configuration
    retention_days INTEGER NOT NULL,
    enforcement_enabled BOOLEAN NOT NULL DEFAULT true,
    legal_hold_exceptions TEXT[] DEFAULT '{}',
    
    -- CRITICAL: Tracking
    last_enforced_at TIMESTAMP WITH TIME ZONE,
    last_enforced_by VARCHAR(64),
    
    -- CRITICAL: Additional context
    metadata JSONB,
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_holds_tenant_id ON legal_holds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_holds_data_type ON legal_holds(data_type);
CREATE INDEX IF NOT EXISTS idx_legal_holds_is_active ON legal_holds(is_active);
CREATE INDEX IF NOT EXISTS idx_legal_holds_expires_at ON legal_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_legal_holds_requested_at ON legal_holds(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_retention_jobs_data_type ON retention_jobs(data_type);
CREATE INDEX IF NOT EXISTS idx_retention_jobs_status ON retention_jobs(status);
CREATE INDEX IF NOT EXISTS idx_retention_jobs_started_at ON retention_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_jobs_correlation_id ON retention_jobs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_retention_policies_enforcement_enabled ON retention_policies(enforcement_enabled);
CREATE INDEX IF NOT EXISTS idx_retention_policies_last_enforced_at ON retention_policies(last_enforced_at DESC);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_legal_holds_tenant_active ON legal_holds(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_legal_holds_type_active ON legal_holds(data_type, is_active);
CREATE INDEX IF NOT EXISTS idx_retention_jobs_type_status ON retention_jobs(data_type, status);

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_jobs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's legal holds
CREATE POLICY tenant_isolation_legal_holds ON legal_holds
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_legal_holds ON legal_holds
    FOR ALL
    TO system_administrators
    USING (true);

CREATE POLICY admin_full_access_retention_jobs ON retention_jobs
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to check if data is under legal hold
CREATE OR REPLACE FUNCTION is_under_legal_hold(
    p_tenant_id VARCHAR(64),
    p_data_type VARCHAR(32)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_hold_count INTEGER;
BEGIN
    -- CRITICAL: Check for active legal holds
    SELECT COUNT(*) INTO v_hold_count
    FROM legal_holds 
    WHERE tenant_id = p_tenant_id 
    AND data_type = p_data_type 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_hold_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get retention policy
CREATE OR REPLACE FUNCTION get_retention_policy(
    p_data_type VARCHAR(32)
)
RETURNS TABLE (
    data_type VARCHAR(32),
    retention_days INTEGER,
    enforcement_enabled BOOLEAN,
    legal_hold_exceptions TEXT[],
    last_enforced_at TIMESTAMP WITH TIME ZONE,
    last_enforced_by VARCHAR(64)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.data_type,
        rp.retention_days,
        rp.enforcement_enabled,
        rp.legal_hold_exceptions,
        rp.last_enforced_at,
        rp.last_enforced_by
    FROM retention_policies rp
    WHERE rp.data_type = p_data_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to create retention job
CREATE OR REPLACE FUNCTION create_retention_job(
    p_data_type VARCHAR(32),
    p_correlation_id VARCHAR(64),
    p_dry_run BOOLEAN DEFAULT false,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_job_id VARCHAR(64);
    v_random_bytes BYTEA;
BEGIN
    -- CRITICAL: Generate secure job ID
    v_random_bytes := gen_random_bytes(16);
    v_job_id := 'retention_job_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Create retention job
    INSERT INTO retention_jobs (
        id, data_type, status, correlation_id, metadata
    ) VALUES (
        v_job_id, p_data_type, 'PENDING', p_correlation_id, 
        jsonb_set(p_metadata, '{dry_run}', to_jsonb(p_dry_run))
    );
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to update retention job
CREATE OR REPLACE FUNCTION update_retention_job(
    p_job_id VARCHAR(64),
    p_status VARCHAR(32),
    p_records_processed INTEGER DEFAULT NULL,
    p_records_deleted INTEGER DEFAULT NULL,
    p_records_skipped INTEGER DEFAULT NULL,
    p_legal_holds_blocked INTEGER DEFAULT NULL,
    p_errors JSONB DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Update retention job
    UPDATE retention_jobs 
    SET 
        status = p_status,
        records_processed = COALESCE(p_records_processed, records_processed),
        records_deleted = COALESCE(p_records_deleted, records_deleted),
        records_skipped = COALESCE(p_records_skipped, records_skipped),
        legal_holds_blocked = COALESCE(p_legal_holds_blocked, legal_holds_blocked),
        errors = COALESCE(p_errors, errors),
        duration_ms = COALESCE(p_duration_ms, duration_ms),
        started_at = CASE WHEN p_status = 'RUNNING' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN p_status IN ('COMPLETED', 'FAILED') THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to place legal hold
CREATE OR REPLACE FUNCTION place_legal_hold(
    p_tenant_id VARCHAR(64),
    p_data_type VARCHAR(32),
    p_reason TEXT,
    p_requested_by VARCHAR(64),
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_hold_id VARCHAR(64);
    v_random_bytes BYTEA;
BEGIN
    -- CRITICAL: Generate secure hold ID
    v_random_bytes := gen_random_bytes(16);
    v_hold_id := 'legal_hold_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Create legal hold
    INSERT INTO legal_holds (
        id, tenant_id, data_type, reason, requested_by, expires_at, metadata
    ) VALUES (
        v_hold_id, p_tenant_id, p_data_type, p_reason, p_requested_by, p_expires_at, p_metadata
    );
    
    RETURN v_hold_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to release legal hold
CREATE OR REPLACE FUNCTION release_legal_hold(
    p_hold_id VARCHAR(64)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Deactivate legal hold
    UPDATE legal_holds 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_hold_id AND is_active = true;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get active legal holds for data type
CREATE OR REPLACE FUNCTION get_active_legal_holds(
    p_data_type VARCHAR(32) DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR(64),
    tenant_id VARCHAR(64),
    data_type VARCHAR(32),
    reason TEXT,
    requested_by VARCHAR(64),
    requested_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    metadata JSONB
) AS $$
BEGIN
    IF p_data_type IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            lh.id, lh.tenant_id, lh.data_type, lh.reason, lh.requested_by,
            lh.requested_at, lh.expires_at, lh.is_active, lh.metadata
        FROM legal_holds lh
        WHERE lh.data_type = p_data_type 
        AND lh.is_active = true
        ORDER BY lh.requested_at DESC;
    ELSE
        RETURN QUERY
        SELECT 
            lh.id, lh.tenant_id, lh.data_type, lh.reason, lh.requested_by,
            lh.requested_at, lh.expires_at, lh.is_active, lh.metadata
        FROM legal_holds lh
        WHERE lh.is_active = true
        ORDER BY lh.requested_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get retention statistics
CREATE OR REPLACE FUNCTION get_retention_statistics()
RETURNS TABLE (
    data_type VARCHAR(32),
    retention_days INTEGER,
    enforcement_enabled BOOLEAN,
    legal_hold_count BIGINT,
    last_enforced_at TIMESTAMP WITH TIME ZONE,
    active_jobs_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.data_type,
        rp.retention_days,
        rp.enforcement_enabled,
        COALESCE(lh.hold_count, 0)::BIGINT as legal_hold_count,
        rp.last_enforced_at,
        COALESCE(rj.job_count, 0)::BIGINT as active_jobs_count
    FROM retention_policies rp
    LEFT JOIN (
        SELECT data_type, COUNT(*) as hold_count
        FROM legal_holds 
        WHERE is_active = true
        GROUP BY data_type
    ) lh ON rp.data_type = lh.data_type
    LEFT JOIN (
        SELECT data_type, COUNT(*) as job_count
        FROM retention_jobs 
        WHERE status = 'RUNNING'
        GROUP BY data_type
    ) rj ON rp.data_type = rj.data_type
    ORDER BY rp.data_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Initialize default retention policies
INSERT INTO retention_policies (data_type, retention_days, enforcement_enabled) VALUES
    ('AUDIT_LOGS', 2555, true), -- 7 years for SOX compliance
    ('DATABASE_BACKUPS', 365, true), -- 1 year
    ('SOFT_DELETED_TENANTS', 90, true), -- 90 days
    ('USER_DATA', 730, true) -- 2 years for GDPR compliance
ON CONFLICT (data_type) DO NOTHING;

-- CRITICAL: Grant permissions
GRANT SELECT ON legal_holds TO authenticated_users;
GRANT SELECT ON retention_jobs TO system_administrators;
GRANT SELECT, INSERT, UPDATE ON retention_jobs TO system_administrators;
GRANT SELECT ON retention_policies TO system_administrators;
GRANT SELECT, INSERT, UPDATE ON retention_policies TO system_administrators;

GRANT EXECUTE ON FUNCTION is_under_legal_hold TO system_administrators;
GRANT EXECUTE ON FUNCTION get_retention_policy TO system_administrators;
GRANT EXECUTE ON FUNCTION create_retention_job TO system_administrators;
GRANT EXECUTE ON FUNCTION update_retention_job TO system_administrators;
GRANT EXECUTE ON FUNCTION place_legal_hold TO system_administrators;
GRANT EXECUTE ON FUNCTION release_legal_hold TO system_administrators;
GRANT EXECUTE ON FUNCTION get_active_legal_holds TO system_administrators;
GRANT EXECUTE ON FUNCTION get_retention_statistics TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE legal_holds IS 'Legal holds that block data deletion for compliance';
COMMENT ON TABLE retention_jobs IS 'Background jobs for enforcing retention policies';
COMMENT ON TABLE retention_policies IS 'Configuration for data retention policies';

COMMENT ON COLUMN legal_holds.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN legal_holds.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN legal_holds.data_type IS 'Type of data under legal hold';
COMMENT ON COLUMN legal_holds.reason IS 'Reason for legal hold (e.g., litigation, investigation)';
COMMENT ON COLUMN legal_holds.requested_by IS 'User who requested the legal hold';
COMMENT ON COLUMN legal_holds.expires_at IS 'Optional expiration date for the legal hold';

COMMENT ON COLUMN retention_jobs.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN retention_jobs.data_type IS 'Type of data being processed';
COMMENT ON COLUMN retention_jobs.status IS 'Current status of the retention job';
COMMENT ON COLUMN retention_jobs.records_processed IS 'Total records examined';
COMMENT ON COLUMN retention_jobs.records_deleted IS 'Total records deleted';
COMMENT ON COLUMN retention_jobs.records_skipped IS 'Total records skipped (e.g., due to legal holds)';
COMMENT ON COLUMN retention_jobs.legal_holds_blocked IS 'Total records blocked by legal holds';

COMMENT ON FUNCTION is_under_legal_hold() IS 'Check if tenant data is under legal hold';
COMMENT ON FUNCTION get_retention_policy() IS 'Get retention policy for data type';
COMMENT ON FUNCTION create_retention_job() IS 'Create a new retention enforcement job';
COMMENT ON FUNCTION update_retention_job() IS 'Update retention job status and statistics';
COMMENT ON FUNCTION place_legal_hold() IS 'Place a legal hold on tenant data';
COMMENT ON FUNCTION release_legal_hold() IS 'Release an active legal hold';
COMMENT ON FUNCTION get_active_legal_holds() IS 'Get all active legal holds';
COMMENT ON FUNCTION get_retention_statistics() IS 'Get retention policy statistics';
