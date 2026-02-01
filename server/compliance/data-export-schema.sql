-- CRITICAL: Data Export Jobs Schema
-- MANDATORY: Tenant-scoped data export tracking with security controls

CREATE TABLE IF NOT EXISTS data_export_jobs (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Tenant and user information
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    
    -- CRITICAL: Export configuration
    export_type VARCHAR(32) NOT NULL CHECK (export_type IN ('USER_DATA', 'TRANSACTIONS', 'INVOICES', 'REPORTS', 'AUDIT_LOGS', 'FULL_EXPORT')),
    format VARCHAR(8) NOT NULL CHECK (format IN ('JSON', 'CSV')),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED')),
    
    -- CRITICAL: Timestamps
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- CRITICAL: Export results
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    record_count INTEGER,
    
    -- CRITICAL: Request details
    reason TEXT NOT NULL,
    correlation_id VARCHAR(64) NOT NULL,
    filters JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- CRITICAL: Error tracking
    errors JSONB DEFAULT '[]'::JSONB,
    
    -- CRITICAL: Additional tracking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_tenant_id ON data_export_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_user_id ON data_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_export_type ON data_export_jobs(export_type);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_status ON data_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_requested_at ON data_export_jobs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_expires_at ON data_export_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_correlation_id ON data_export_jobs(correlation_id);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_tenant_status ON data_export_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_tenant_type ON data_export_jobs(tenant_id, export_type);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_user_status ON data_export_jobs(user_id, status);

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE data_export_jobs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's export jobs
CREATE POLICY tenant_isolation_data_export_jobs ON data_export_jobs
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_data_export_jobs ON data_export_jobs
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to create data export job
CREATE OR REPLACE FUNCTION create_data_export_job(
    p_tenant_id VARCHAR(64),
    p_user_id VARCHAR(64),
    p_export_type VARCHAR(32),
    p_format VARCHAR(8),
    p_reason TEXT,
    p_correlation_id VARCHAR(64),
    p_filters JSONB DEFAULT '{}'::JSONB,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_job_id VARCHAR(64);
    v_random_bytes BYTEA;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- CRITICAL: Generate secure job ID
    v_random_bytes := gen_random_bytes(16);
    v_job_id := 'export_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Calculate expiration time
    v_expires_at := NOW() + (p_expires_hours || 24) * INTERVAL '1 hour';
    
    -- CRITICAL: Create export job
    INSERT INTO data_export_jobs (
        id, tenant_id, user_id, export_type, format, status,
        reason, correlation_id, filters, metadata, expires_at
    ) VALUES (
        v_job_id, p_tenant_id, p_user_id, p_export_type, p_format, 
        'PENDING', p_reason, p_correlation_id, p_filters, p_metadata, v_expires_at
    );
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to update export job status
CREATE OR REPLACE FUNCTION update_export_job_status(
    p_job_id VARCHAR(64),
    p_status VARCHAR(32),
    p_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_file_url TEXT DEFAULT NULL,
    p_file_name TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL,
    p_record_count INTEGER DEFAULT NULL,
    p_errors JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Update export job
    UPDATE data_export_jobs 
    SET 
        status = p_status,
        started_at = COALESCE(p_started_at, started_at),
        completed_at = COALESCE(p_completed_at, completed_at),
        file_url = COALESCE(p_file_url, file_url),
        file_name = COALESCE(p_file_name, file_name),
        file_size = COALESCE(p_file_size, file_size),
        record_count = COALESCE(p_record_count, record_count),
        errors = COALESCE(p_errors, errors),
        updated_at = NOW()
    WHERE id = p_job_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get export job
CREATE OR REPLACE FUNCTION get_export_job(
    p_job_id VARCHAR(64),
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR(64),
    tenant_id VARCHAR(64),
    user_id VARCHAR(64),
    export_type VARCHAR(32),
    format VARCHAR(8),
    status VARCHAR(32),
    requested_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    record_count INTEGER,
    reason TEXT,
    correlation_id VARCHAR(64),
    filters JSONB,
    metadata JSONB,
    errors JSONB
) AS $$
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            dej.id, dej.tenant_id, dej.user_id, dej.export_type, dej.format, dej.status,
            dej.requested_at, dej.started_at, dej.completed_at, dej.expires_at,
            dej.file_url, dej.file_name, dej.file_size, dej.record_count, dej.reason,
            dej.correlation_id, dej.filters, dej.metadata, dej.errors
        FROM data_export_jobs dej
        WHERE dej.id = p_job_id 
        AND dej.tenant_id = p_tenant_id;
    ELSE
        RETURN QUERY
        SELECT 
            dej.id, dej.tenant_id, dej.user_id, dej.export_type, dej.format, dej.status,
            dej.requested_at, dej.started_at, dej.completed_at, dej.expires_at,
            dej.file_url, dej.file_name, dej.file_size, dej.record_count, dej.reason,
            dej.correlation_id, dej.filters, dej.metadata, dej.errors
        FROM data_export_jobs dej
        WHERE dej.id = p_job_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get user export jobs
CREATE OR REPLACE FUNCTION get_user_export_jobs(
    p_tenant_id VARCHAR(64),
    p_user_id VARCHAR(64) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id VARCHAR(64),
    tenant_id VARCHAR(64),
    user_id VARCHAR(64),
    export_type VARCHAR(32),
    format VARCHAR(8),
    status VARCHAR(32),
    requested_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    record_count INTEGER,
    reason TEXT,
    correlation_id VARCHAR(64)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dej.id, dej.tenant_id, dej.user_id, dej.export_type, dej.format, dej.status,
        dej.requested_at, dej.started_at, dej.completed_at, dej.expires_at,
        dej.file_url, dej.file_name, dej.file_size, dej.record_count, dej.reason,
        dej.correlation_id
    FROM data_export_jobs dej
    WHERE dej.tenant_id = p_tenant_id
    AND (p_user_id IS NULL OR dej.user_id = p_user_id)
    ORDER BY dej.requested_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get export statistics
CREATE OR REPLACE FUNCTION get_export_statistics(
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    total_exports BIGINT,
    exports_by_type JSONB,
    exports_by_format JSONB,
    active_jobs BIGINT,
    recent_jobs JSONB,
    total_data_exported BIGINT
) AS $$
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_exports,
            jsonb_object_agg(export_type, type_count) as exports_by_type,
            jsonb_object_agg(format, format_count) as exports_by_format,
            COALESCE(active.active_count, 0)::BIGINT as active_jobs,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'export_type', export_type,
                    'format', format,
                    'status', status,
                    'requested_at', requested_at,
                    'file_size', file_size,
                    'record_count', record_count
                )
                ORDER BY requested_at DESC
                LIMIT 10
            ) as recent_jobs,
            COALESCE(SUM(file_size), 0)::BIGINT as total_data_exported
        FROM data_export_jobs dej
        LEFT JOIN (
            SELECT COUNT(*) as active_count
            FROM data_export_jobs 
            WHERE tenant_id = p_tenant_id
            AND status IN ('PENDING', 'RUNNING')
        ) active ON true
        WHERE dej.tenant_id = p_tenant_id;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_exports,
            jsonb_object_agg(export_type, type_count) as exports_by_type,
            jsonb_object_agg(format, format_count) as exports_by_format,
            COALESCE(active.active_count, 0)::BIGINT as active_jobs,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'export_type', export_type,
                    'format', format,
                    'status', status,
                    'requested_at', requested_at,
                    'file_size', file_size,
                    'record_count', record_count
                )
                ORDER BY requested_at DESC
                LIMIT 10
            ) as recent_jobs,
            COALESCE(SUM(file_size), 0)::BIGINT as total_data_exported
        FROM data_export_jobs dej
        LEFT JOIN (
            SELECT COUNT(*) as active_count
            FROM data_export_jobs 
            WHERE status IN ('PENDING', 'RUNNING')
        ) active ON true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to cleanup expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS TABLE (
    cleaned_count BIGINT,
    total_size_freed BIGINT
) AS $$
DECLARE
    v_cleaned_count BIGINT;
    v_total_size BIGINT;
BEGIN
    -- CRITICAL: Update expired jobs to EXPIRED status
    UPDATE data_export_jobs 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'COMPLETED' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    -- CRITICAL: Calculate total size of expired exports
    SELECT COALESCE(SUM(file_size), 0) INTO v_total_size
    FROM data_export_jobs 
    WHERE status = 'EXPIRED'
    AND file_url IS NOT NULL;
    
    -- CRITICAL: In a real implementation, you would delete the actual files here
    
    RETURN QUERY SELECT v_cleaned_count, v_total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to check export rate limits
CREATE OR REPLACE FUNCTION check_export_rate_limit(
    p_tenant_id VARCHAR(64),
    p_user_id VARCHAR(64),
    p_window_hours INTEGER DEFAULT 1,
    p_max_requests INTEGER DEFAULT 5
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_count INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_current_count INTEGER;
    v_reset_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- CRITICAL: Count exports in the time window
    SELECT COUNT(*) INTO v_current_count
    FROM data_export_jobs 
    WHERE tenant_id = p_tenant_id 
    AND user_id = p_user_id
    AND requested_at > NOW() - (p_window_hours || ' hours')::INTERVAL;
    
    -- CRITICAL: Calculate reset time
    v_reset_time := NOW() + (p_window_hours || ' hours')::INTERVAL;
    
    -- CRITICAL: Check if allowed
    RETURN QUERY SELECT 
        (v_current_count < p_max_requests) as allowed,
        v_current_count,
        v_reset_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Grant permissions
GRANT SELECT ON data_export_jobs TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON data_export_jobs TO system_administrators;

GRANT EXECUTE ON FUNCTION create_data_export_job TO system_administrators;
GRANT EXECUTE ON FUNCTION update_export_job_status TO system_administrators;
GRANT EXECUTE ON FUNCTION get_export_job TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_export_job TO system_administrators;
GRANT EXECUTE ON FUNCTION get_user_export_jobs TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_user_export_jobs TO system_administrators;
GRANT EXECUTE ON FUNCTION get_export_statistics TO system_administrators;
GRANT EXECUTE ON FUNCTION cleanup_expired_exports TO system_administrators;
GRANT EXECUTE ON FUNCTION check_export_rate_limit TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE data_export_jobs IS 'Tenant-scoped data export jobs with security controls';
COMMENT ON COLUMN data_export_jobs.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN data_export_jobs.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN data_export_jobs.user_id IS 'User who requested the export';
COMMENT ON COLUMN data_export_jobs.export_type IS 'Type of data being exported';
COMMENT ON COLUMN data_export_jobs.format IS 'Export format (JSON or CSV)';
COMMENT ON COLUMN data_export_jobs.status IS 'Current status of the export job';
COMMENT ON COLUMN data_export_jobs.expires_at IS 'When the export file expires';
COMMENT ON COLUMN data_export_jobs.file_url IS 'Secure URL for downloading the export';
COMMENT ON COLUMN data_export_jobs.file_size IS 'Size of the exported file in bytes';
COMMENT ON COLUMN data_export_jobs.record_count IS 'Number of records exported';
COMMENT ON COLUMN data_export_jobs.reason IS 'Reason for the export request';
COMMENT ON COLUMN data_export_jobs.correlation_id IS 'Request correlation ID for tracing';
COMMENT ON COLUMN data_export_jobs.filters IS 'Export filters and criteria';
COMMENT ON COLUMN data_export_jobs.metadata IS 'Additional export metadata';
COMMENT ON COLUMN data_export_jobs.errors IS 'Any errors that occurred during export';

COMMENT ON FUNCTION create_data_export_job() IS 'Create a new data export job';
COMMENT ON FUNCTION update_export_job_status() IS 'Update export job status and results';
COMMENT ON FUNCTION get_export_job() IS 'Get export job details';
COMMENT ON FUNCTION get_user_export_jobs() IS 'Get export jobs for a user or tenant';
COMMENT ON FUNCTION get_export_statistics() IS 'Get export statistics and metrics';
COMMENT ON FUNCTION cleanup_expired_exports() IS 'Clean up expired export jobs';
COMMENT ON FUNCTION check_export_rate_limit() IS 'Check if user is within export rate limits';
