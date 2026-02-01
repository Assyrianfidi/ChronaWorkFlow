-- CRITICAL: Approval Workflows Schema
-- MANDATORY: Two-step approval workflow with configurable policies

CREATE TABLE IF NOT EXISTS approval_requests (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Operation reference
    operation_id VARCHAR(64) NOT NULL,
    operation_name VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    
    -- CRITICAL: Request details
    requested_by VARCHAR(64) NOT NULL,
    correlation_id VARCHAR(64) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::JSONB,
    reason TEXT NOT NULL,
    
    -- CRITICAL: Status and approval
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTED', 'FAILED')),
    approval_policy VARCHAR(32) NOT NULL CHECK (approval_policy IN ('NONE', 'SINGLE_ADMIN', 'MULTI_ADMIN', 'OWNER_ONLY')),
    required_approvers INTEGER NOT NULL DEFAULT 1,
    current_approvals TEXT[] DEFAULT '{}',
    rejections TEXT[] DEFAULT '{}',
    
    -- CRITICAL: Timestamps
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- CRITICAL: Execution details
    executed_by VARCHAR(64),
    execution_result JSONB,
    execution_error TEXT,
    
    -- CRITICAL: Additional metadata
    metadata JSONB DEFAULT '{}'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_id ON approval_requests(id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_operation_id ON approval_requests(operation_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_id ON approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approval_policy ON approval_requests(approval_policy);
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires_at ON approval_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at ON approval_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_correlation_id ON approval_requests(correlation_id);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status ON approval_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_operation_status ON approval_requests(operation_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_pending ON approval_requests(tenant_id, status) WHERE status = 'PENDING';

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's requests
CREATE POLICY tenant_isolation_approval_requests ON approval_requests
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_approval_requests ON approval_requests
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to create approval request
CREATE OR REPLACE FUNCTION create_approval_request(
    p_operation_id VARCHAR(64),
    p_operation_name VARCHAR(100),
    p_tenant_id VARCHAR(64),
    p_requested_by VARCHAR(64),
    p_correlation_id VARCHAR(64),
    p_parameters JSONB DEFAULT '{}'::JSONB,
    p_reason TEXT,
    p_approval_policy VARCHAR(32),
    p_required_approvers INTEGER DEFAULT 1,
    p_expires_hours INTEGER DEFAULT 24,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_request_id VARCHAR(64);
    v_random_bytes BYTEA;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- CRITICAL: Generate secure request ID
    v_random_bytes := gen_random_bytes(16);
    v_request_id := 'approval_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Calculate expiration time
    v_expires_at := NOW() + (p_expires_hours || 24) * INTERVAL '1 hour';
    
    -- CRITICAL: Create approval request
    INSERT INTO approval_requests (
        id, operation_id, operation_name, tenant_id, requested_by, correlation_id,
        parameters, reason, approval_policy, required_approvers, expires_at, metadata
    ) VALUES (
        v_request_id, p_operation_id, p_operation_name, p_tenant_id, p_requested_by,
        p_correlation_id, p_parameters, p_reason, p_approval_policy, p_required_approvers,
        v_expires_at, p_metadata
    );
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to update approval request
CREATE OR REPLACE FUNCTION update_approval_request(
    p_request_id VARCHAR(64),
    p_status VARCHAR(32),
    p_current_approvals TEXT[] DEFAULT NULL,
    p_rejections TEXT[] DEFAULT NULL,
    p_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_executed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_executed_by VARCHAR(64) DEFAULT NULL,
    p_execution_result JSONB DEFAULT NULL,
    p_execution_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Update approval request
    UPDATE approval_requests 
    SET 
        status = p_status,
        current_approvals = COALESCE(p_current_approvals, current_approvals),
        rejections = COALESCE(p_rejections, rejections),
        approved_at = COALESCE(p_approved_at, approved_at),
        rejected_at = COALESCE(p_rejected_at, rejected_at),
        executed_at = COALESCE(p_executed_at, executed_at),
        executed_by = COALESCE(p_executed_by, executed_by),
        execution_result = COALESCE(p_execution_result, execution_result),
        execution_error = COALESCE(p_execution_error, execution_error),
        updated_at = NOW()
    WHERE id = p_request_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get approval request
CREATE OR REPLACE FUNCTION get_approval_request(
    p_request_id VARCHAR(64),
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR(64),
    operation_id VARCHAR(64),
    operation_name VARCHAR(100),
    tenant_id VARCHAR(64),
    requested_by VARCHAR(64),
    correlation_id VARCHAR(64),
    parameters JSONB,
    reason TEXT,
    status VARCHAR(32),
    approval_policy VARCHAR(32),
    required_approvers INTEGER,
    current_approvals TEXT[],
    rejections TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by VARCHAR(64),
    execution_result JSONB,
    execution_error TEXT,
    metadata JSONB
) AS $$
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            ar.id, ar.operation_id, ar.operation_name, ar.tenant_id, ar.requested_by,
            ar.correlation_id, ar.parameters, ar.reason, ar.status, ar.approval_policy,
            ar.required_approvers, ar.current_approvals, ar.rejections, ar.expires_at,
            ar.requested_at, ar.approved_at, ar.rejected_at, ar.executed_at, ar.executed_by,
            ar.execution_result, ar.execution_error, ar.metadata
        FROM approval_requests ar
        WHERE ar.id = p_request_id 
        AND ar.tenant_id = p_tenant_id;
    ELSE
        RETURN QUERY
        SELECT 
            ar.id, ar.operation_id, ar.operation_name, ar.tenant_id, ar.requested_by,
            ar.correlation_id, ar.parameters, ar.reason, ar.status, ar.approval_policy,
            ar.required_approvers, ar.current_approvals, ar.rejections, ar.expires_at,
            ar.requested_at, ar.approved_at, ar.rejected_at, ar.executed_at, ar.executed_by,
            ar.execution_result, ar.execution_error, ar.metadata
        FROM approval_requests ar
        WHERE ar.id = p_request_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get pending requests for tenant
CREATE OR REPLACE FUNCTION get_pending_approval_requests(
    p_tenant_id VARCHAR(64)
)
RETURNS TABLE (
    id VARCHAR(64),
    operation_id VARCHAR(64),
    operation_name VARCHAR(100),
    requested_by VARCHAR(64),
    reason TEXT,
    approval_policy VARCHAR(32),
    required_approvers INTEGER,
    current_approvals TEXT[],
    rejections TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    requested_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id, ar.operation_id, ar.operation_name, ar.requested_by, ar.reason,
        ar.approval_policy, ar.required_approvers, ar.current_approvals, ar.rejections,
        ar.expires_at, ar.requested_at, ar.metadata
    FROM approval_requests ar
    WHERE ar.tenant_id = p_tenant_id 
    AND ar.status = 'PENDING'
    ORDER BY ar.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to check if user can approve request
CREATE OR REPLACE FUNCTION can_approve_request(
    p_request_id VARCHAR(64),
    p_user_id VARCHAR(64
)
RETURNS TABLE (
    can_approve BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_request RECORD;
    v_already_approved BOOLEAN;
    v_already_rejected BOOLEAN;
    v_is_self_approval BOOLEAN;
    v_is_expired BOOLEAN;
BEGIN
    -- CRITICAL: Get request details
    SELECT * INTO v_request
    FROM approval_requests 
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Request not found';
        RETURN;
    END IF;
    
    -- CRITICAL: Check if request is pending
    IF v_request.status != 'PENDING' THEN
        RETURN QUERY SELECT false, 'Request is not pending (status: ' || v_request.status || ')';
        RETURN;
    END IF;
    
    -- CRITICAL: Check if expired
    v_is_expired := (NOW() > v_request.expires_at);
    IF v_is_expired THEN
        RETURN QUERY SELECT false, 'Request has expired';
        RETURN;
    END IF;
    
    -- CRITICAL: Check for self-approval
    v_is_self_approval := (v_request.requested_by = p_user_id);
    IF v_is_self_approval THEN
        RETURN QUERY SELECT false, 'Self-approval is not allowed';
        RETURN;
    END IF;
    
    -- CRITICAL: Check if already approved
    v_already_approved := (p_user_id = ANY(v_request.current_approvals));
    IF v_already_approved THEN
        RETURN QUERY SELECT false, 'User has already approved this request';
        RETURN;
    END IF;
    
    -- CRITICAL: Check if already rejected
    v_already_rejected := (p_user_id = ANY(v_request.rejections));
    IF v_already_rejected THEN
        RETURN QUERY SELECT false, 'User has already rejected this request';
        RETURN;
    END IF;
    
    -- CRITICAL: Check if enough approvers remaining
    IF array_length(v_request.current_approvals, 1) >= v_request.required_approvers THEN
        RETURN QUERY SELECT false, 'Request already has sufficient approvals';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'User can approve request';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to process approval decision
CREATE OR REPLACE FUNCTION process_approval_decision(
    p_request_id VARCHAR(64),
    p_approver_id VARCHAR(64),
    p_decision VARCHAR(32), -- 'APPROVE' or 'REJECT'
    p_reason TEXT,
    p_correlation_id VARCHAR(64),
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_status VARCHAR(32)
) AS $$
DECLARE
    v_request RECORD;
    v_can_approve BOOLEAN;
    v_approval_reason TEXT;
    v_current_approvals TEXT[];
    v_rejections TEXT[];
    v_new_status VARCHAR(32);
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Check if user can approve
    SELECT can_approve, reason INTO v_can_approve, v_approval_reason
    FROM can_approve_request(p_request_id, p_approver_id)
    LIMIT 1;
    
    IF NOT v_can_approve THEN
        RETURN QUERY SELECT false, v_approval_reason, NULL;
        RETURN;
    END IF;
    
    -- CRITICAL: Get current request state
    SELECT * INTO v_request
    FROM approval_requests 
    WHERE id = p_request_id;
    
    -- CRITICAL: Prepare updated arrays
    v_current_approvals := v_request.current_approvals;
    v_rejections := v_request.rejections;
    
    -- CRITICAL: Apply decision
    IF p_decision = 'APPROVE' THEN
        v_current_approvals := array_append(v_current_approvals, p_approver_id);
        
        -- CRITICAL: Check if fully approved
        IF array_length(v_current_approvals, 1) >= v_request.required_approvers THEN
            v_new_status := 'APPROVED';
        ELSE
            v_new_status := 'PENDING';
        END IF;
    ELSIF p_decision = 'REJECT' THEN
        v_rejections := array_append(v_rejections, p_approver_id);
        v_new_status := 'REJECTED';
    ELSE
        RETURN QUERY SELECT false, 'Invalid decision: ' || p_decision, NULL;
        RETURN;
    END IF;
    
    -- CRITICAL: Update request
    UPDATE approval_requests
    SET 
        status = v_new_status,
        current_approvals = v_current_approvals,
        rejections = v_rejections,
        approved_at = CASE WHEN v_new_status = 'APPROVED' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN v_new_status = 'REJECTED' THEN NOW() ELSE rejected_at END,
        updated_at = NOW()
    WHERE id = p_request_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RETURN QUERY SELECT true, 'Decision processed successfully', v_new_status;
    ELSE
        RETURN QUERY SELECT false, 'Failed to update request', NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to expire old requests
CREATE OR REPLACE FUNCTION expire_old_approval_requests()
RETURNS TABLE (
    expired_count BIGINT
) AS $$
DECLARE
    v_expired_count BIGINT;
BEGIN
    -- CRITICAL: Update expired requests
    UPDATE approval_requests 
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'PENDING' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get approval statistics
CREATE OR REPLACE FUNCTION get_approval_statistics(
    p_tenant_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    approved_requests BIGINT,
    rejected_requests BIGINT,
    executed_requests BIGINT,
    expired_requests BIGINT,
    average_approval_time NUMERIC,
    approval_rate NUMERIC
) AS $$
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_requests,
            COUNT(*) FILTER (WHERE status = 'PENDING')::BIGINT as pending_requests,
            COUNT(*) FILTER (WHERE status = 'APPROVED')::BIGINT as approved_requests,
            COUNT(*) FILTER (WHERE status = 'REJECTED')::BIGINT as rejected_requests,
            COUNT(*) FILTER (WHERE status = 'EXECUTED')::BIGINT as executed_requests,
            COUNT(*) FILTER (WHERE status = 'EXPIRED')::BIGINT as expired_requests,
            AVG(EXTRACT(EPOCH FROM (approved_at - requested_at))) as average_approval_time,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(*) FILTER (WHERE status = 'APPROVED')::NUMERIC / COUNT(*)::NUMERIC) * 100
                ELSE 0 
            END as approval_rate
        FROM approval_requests
        WHERE tenant_id = p_tenant_id;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_requests,
            COUNT(*) FILTER (WHERE status = 'PENDING')::BIGINT as pending_requests,
            COUNT(*) FILTER (WHERE status = 'APPROVED')::BIGINT as approved_requests,
            COUNT(*) FILTER (WHERE status = 'REJECTED')::BIGINT as rejected_requests,
            COUNT(*) FILTER (WHERE status = 'EXECUTED')::BIGINT as executed_requests,
            COUNT(*) FILTER (WHERE status = 'EXPIRED')::BIGINT as expired_requests,
            AVG(EXTRACT(EPOCH FROM (approved_at - requested_at))) as average_approval_time,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    (COUNT(*) FILTER (WHERE status = 'APPROVED')::NUMERIC / COUNT(*)::NUMERIC) * 100
                ELSE 0 
            END as approval_rate
        FROM approval_requests;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Grant permissions
GRANT SELECT ON approval_requests TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON approval_requests TO system_administrators;

GRANT EXECUTE ON FUNCTION create_approval_request TO system_administrators;
GRANT EXECUTE ON FUNCTION update_approval_request TO system_administrators;
GRANT EXECUTE ON FUNCTION get_approval_request TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_approval_request TO system_administrators;
GRANT EXECUTE ON FUNCTION get_pending_approval_requests TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_pending_approval_requests TO system_administrators;
GRANT EXECUTE ON FUNCTION can_approve_request TO system_administrators;
GRANT EXECUTE ON FUNCTION process_approval_decision TO system_administrators;
GRANT EXECUTE ON FUNCTION expire_old_approval_requests TO system_administrators;
GRANT EXECUTE ON FUNCTION get_approval_statistics TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE approval_requests IS 'Two-step approval workflow requests for dangerous operations';
COMMENT ON COLUMN approval_requests.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN approval_requests.operation_id IS 'Reference to the dangerous operation';
COMMENT ON COLUMN approval_requests.operation_name IS 'Human-readable operation name';
COMMENT ON COLUMN approval_requests.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN approval_requests.requested_by IS 'User who requested the operation';
COMMENT ON COLUMN approval_requests.correlation_id IS 'Request correlation ID for tracing';
COMMENT ON COLUMN approval_requests.parameters IS 'Operation parameters';
COMMENT ON COLUMN approval_requests.reason IS 'Reason for the operation request';
COMMENT ON COLUMN approval_requests.status IS 'Current status of the approval request';
COMMENT ON COLUMN approval_requests.approval_policy IS 'Approval policy required for this operation';
COMMENT ON COLUMN approval_requests.required_approvers IS 'Number of approvals required';
COMMENT ON COLUMN approval_requests.current_approvals IS 'List of users who have approved';
COMMENT ON COLUMN approval_requests.rejections IS 'List of users who have rejected';
COMMENT ON COLUMN approval_requests.expires_at IS 'When the approval request expires';
COMMENT ON COLUMN approval_requests.executed_at IS 'When the operation was executed';
COMMENT ON COLUMN approval_requests.executed_by IS 'User who executed the operation';
COMMENT ON COLUMN approval_requests.execution_result IS 'Result of the operation execution';
COMMENT ON COLUMN approval_requests.execution_error IS 'Error if execution failed';

COMMENT ON FUNCTION create_approval_request() IS 'Create a new approval request';
COMMENT ON FUNCTION update_approval_request() IS 'Update an existing approval request';
COMMENT ON FUNCTION get_approval_request() IS 'Get a specific approval request';
COMMENT ON FUNCTION get_pending_approval_requests() IS 'Get pending approval requests for a tenant';
COMMENT ON FUNCTION can_approve_request() IS 'Check if user can approve a request';
COMMENT ON FUNCTION process_approval_decision() IS 'Process an approval decision';
COMMENT ON FUNCTION expire_old_approval_requests() IS 'Expire old approval requests';
COMMENT ON FUNCTION get_approval_statistics() IS 'Get approval workflow statistics';
