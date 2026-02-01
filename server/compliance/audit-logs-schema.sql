-- CRITICAL: Audit Logs Table Schema
-- MANDATORY: Tamper-resistant, append-only audit logging

CREATE TABLE IF NOT EXISTS audit_logs (
    -- CRITICAL: Primary identifier (cryptographically secure)
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Tenant and Actor information
    tenant_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    
    -- CRITICAL: Event details
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    
    -- CRITICAL: Outcome and timing
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    correlation_id VARCHAR(64) NOT NULL,
    
    -- CRITICAL: Additional context
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category VARCHAR(32) NOT NULL CHECK (category IN ('AUTHENTICATION', 'AUTHORIZATION', 'DATA_MUTATION', 'ROLE_PERMISSION_CHANGE', 'TENANT_LIFECYCLE', 'CONFIGURATION_CHANGE')),
    
    -- CRITICAL: Cryptographic integrity protection
    hash VARCHAR(128) NOT NULL,
    previous_hash VARCHAR(128),
    
    -- CRITICAL: Append-only constraints
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Append-only trigger - prevents updates and deletes
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit logs cannot be updated';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs cannot be deleted';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- CRITICAL: Create triggers to prevent modification
CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- CRITICAL: Indexes for performance (read-only queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON audit_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(hash);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_timestamp ON audit_logs(category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_timestamp ON audit_logs(severity, timestamp DESC);

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's audit logs
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_audit_logs ON audit_logs
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_log_integrity(
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    is_valid BOOLEAN,
    total_checked INTEGER,
    tampered_count INTEGER,
    gap_count INTEGER,
    details JSONB
) AS $$
DECLARE
    v_tampered_count INTEGER := 0;
    v_gap_count INTEGER := 0;
    v_details JSONB := '[]'::JSONB;
    v_current_hash VARCHAR(128);
    v_previous_hash VARCHAR(128);
    v_expected_hash VARCHAR(128);
    audit_record RECORD;
BEGIN
    -- CRITICAL: Get audit logs in chronological order
    FOR audit_record IN 
        SELECT * FROM audit_logs 
        ORDER BY timestamp ASC, id ASC 
        LIMIT p_limit
    LOOP
        -- CRITICAL: Calculate expected hash
        v_expected_hash := encode(
            digest(
                audit_record.id || 
                audit_record.tenant_id || 
                audit_record.actor_id || 
                audit_record.action || 
                audit_record.resource_type || 
                COALESCE(audit_record.resource_id, '') || 
                audit_record.outcome || 
                to_char(audit_record.timestamp, 'YYYY-MM-DD HH24:MI:SS.US') || 
                audit_record.correlation_id || 
                COALESCE(audit_record.metadata::TEXT, '{}') || 
                COALESCE(audit_record.ip_address::TEXT, '') || 
                COALESCE(audit_record.user_agent, '') || 
                audit_record.severity || 
                audit_record.category || 
                COALESCE(audit_record.previous_hash, ''),
                'sha256'
            ),
            'hex'
        );
        
        -- CRITICAL: Check for tampering
        IF audit_record.hash != v_expected_hash THEN
            v_tampered_count := v_tampered_count + 1;
            v_details := v_details || jsonb_build_object(
                'type', 'tampered',
                'id', audit_record.id,
                'timestamp', audit_record.timestamp,
                'expected_hash', v_expected_hash,
                'actual_hash', audit_record.hash
            );
        END IF;
        
        -- CRITICAL: Check for gaps in hash chain
        IF v_previous_hash IS NOT NULL AND audit_record.previous_hash != v_previous_hash THEN
            v_gap_count := v_gap_count + 1;
            v_details := v_details || jsonb_build_object(
                'type', 'gap',
                'id', audit_record.id,
                'timestamp', audit_record.timestamp,
                'expected_previous_hash', v_previous_hash,
                'actual_previous_hash', audit_record.previous_hash
            );
        END IF;
        
        v_previous_hash := audit_record.hash;
    END LOOP;
    
    -- CRITICAL: Return results
    RETURN QUERY SELECT 
        (v_tampered_count = 0 AND v_gap_count = 0) as is_valid,
        p_limit as total_checked,
        v_tampered_count as tampered_count,
        v_gap_count as gap_count,
        v_details as details;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    total_events BIGINT,
    events_by_category JSONB,
    events_by_severity JSONB,
    events_by_outcome JSONB,
    recent_events JSONB
) AS $$
BEGIN
    -- CRITICAL: Get total events
    IF p_tenant_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT,
            jsonb_object_agg(category, category_count) as events_by_category,
            jsonb_object_agg(severity, severity_count) as events_by_severity,
            jsonb_object_agg(outcome, outcome_count) as events_by_outcome,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'tenant_id', tenant_id,
                    'actor_id', actor_id,
                    'action', action,
                    'resource_type', resource_type,
                    'resource_id', resource_id,
                    'outcome', outcome,
                    'timestamp', timestamp,
                    'correlation_id', correlation_id,
                    'severity', severity,
                    'category', category
                )
                ORDER BY timestamp DESC
                LIMIT 10
            ) as recent_events
        FROM (
            SELECT 
                COUNT(*) as total_events,
                category,
                COUNT(*) as category_count
            FROM audit_logs 
            WHERE tenant_id = p_tenant_id
            GROUP BY category
        ) category_stats
        CROSS JOIN (
            SELECT 
                severity,
                COUNT(*) as severity_count
            FROM audit_logs 
            WHERE tenant_id = p_tenant_id
            GROUP BY severity
        ) severity_stats
        CROSS JOIN (
            SELECT 
                outcome,
                COUNT(*) as outcome_count
            FROM audit_logs 
            WHERE tenant_id = p_tenant_id
            GROUP BY outcome
        ) outcome_stats
        CROSS JOIN (
            SELECT 
                id, tenant_id, actor_id, action, resource_type, resource_id,
                outcome, timestamp, correlation_id, severity, category
            FROM audit_logs 
            WHERE tenant_id = p_tenant_id
            ORDER BY timestamp DESC
            LIMIT 10
        ) recent;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT,
            jsonb_object_agg(category, category_count) as events_by_category,
            jsonb_object_agg(severity, severity_count) as events_by_severity,
            jsonb_object_agg(outcome, outcome_count) as events_by_outcome,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'tenant_id', tenant_id,
                    'actor_id', actor_id,
                    'action', action,
                    'resource_type', resource_type,
                    'resource_id', resource_id,
                    'outcome', outcome,
                    'timestamp', timestamp,
                    'correlation_id', correlation_id,
                    'severity', severity,
                    'category', category
                )
                ORDER BY timestamp DESC
                LIMIT 10
            ) as recent_events
        FROM (
            SELECT 
                COUNT(*) as total_events,
                category,
                COUNT(*) as category_count
            FROM audit_logs 
            GROUP BY category
        ) category_stats
        CROSS JOIN (
            SELECT 
                severity,
                COUNT(*) as severity_count
            FROM audit_logs 
            GROUP BY severity
        ) severity_stats
        CROSS JOIN (
            SELECT 
                outcome,
                COUNT(*) as outcome_count
            FROM audit_logs 
            GROUP BY outcome
        ) outcome_stats
        CROSS JOIN (
            SELECT 
                id, tenant_id, actor_id, action, resource_type, resource_id,
                outcome, timestamp, correlation_id, severity, category
            FROM audit_logs 
            ORDER BY timestamp DESC
            LIMIT 10
        ) recent;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Grant permissions
GRANT SELECT ON audit_logs TO authenticated_users;
GRANT SELECT ON audit_logs TO system_administrators;
GRANT EXECUTE ON FUNCTION verify_audit_log_integrity TO system_administrators;
GRANT EXECUTE ON FUNCTION get_audit_statistics TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit log for compliance and security monitoring';
COMMENT ON COLUMN audit_logs.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN audit_logs.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN audit_logs.actor_id IS 'User or system identifier that performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Specific action performed (e.g., LOGIN, CREATE, DELETE)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., USER, INVOICE)';
COMMENT ON COLUMN audit_logs.resource_id IS 'Specific resource identifier';
COMMENT ON COLUMN audit_logs.outcome IS 'Result of the action (SUCCESS, FAILURE, DENIED)';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Request correlation ID for tracing';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context information (sanitized)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the actor';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string';
COMMENT ON COLUMN audit_logs.severity IS 'Security severity level (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN audit_logs.category IS 'Event category for classification';
COMMENT ON COLUMN audit_logs.hash IS 'Cryptographic hash for integrity verification';
COMMENT ON COLUMN audit_logs.previous_hash IS 'Previous event hash for chain integrity';

COMMENT ON FUNCTION prevent_audit_log_modification() IS 'Trigger function to prevent audit log modification';
COMMENT ON FUNCTION verify_audit_log_integrity() IS 'Function to verify audit log integrity';
COMMENT ON FUNCTION get_audit_statistics() IS 'Function to get audit statistics';
