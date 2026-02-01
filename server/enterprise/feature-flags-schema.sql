-- CRITICAL: Feature Flags Schema
-- MANDATORY: Tenant-scoped feature flags with strict isolation

CREATE TABLE IF NOT EXISTS feature_flags (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Flag definition
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('SECURITY', 'COMPLIANCE', 'OPERATIONS', 'INTEGRATIONS', 'UI', 'API')),
    default_value BOOLEAN NOT NULL DEFAULT false,
    is_global BOOLEAN NOT NULL DEFAULT false,
    
    -- CRITICAL: Access control
    required_permissions TEXT[] DEFAULT '{}',
    
    -- CRITICAL: Additional metadata
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CRITICAL: Tenant-specific feature flag values
CREATE TABLE IF NOT EXISTS tenant_feature_flags (
    -- CRITICAL: Primary identifier
    id VARCHAR(64) PRIMARY KEY,
    
    -- CRITICAL: Tenant and flag references
    tenant_id VARCHAR(64) NOT NULL,
    flag_id VARCHAR(64) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    -- CRITICAL: Flag state
    enabled BOOLEAN NOT NULL DEFAULT false,
    enabled_at TIMESTAMP WITH TIME ZONE,
    enabled_by VARCHAR(64),
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by VARCHAR(64),
    
    -- CRITICAL: Change tracking
    reason TEXT,
    correlation_id VARCHAR(64),
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- CRITICAL: Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- CRITICAL: Constraints
    UNIQUE(tenant_id, flag_id)
);

-- CRITICAL: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_global ON feature_flags(is_global);
CREATE INDEX IF NOT EXISTS idx_feature_flags_created_at ON feature_flags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant_id ON tenant_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_flag_id ON tenant_feature_flags(flag_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_enabled ON tenant_feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_enabled_at ON tenant_feature_flags(enabled_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_correlation_id ON tenant_feature_flags(correlation_id);

-- CRITICAL: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant_enabled ON tenant_feature_flags(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_flag_enabled ON tenant_feature_flags(flag_id, enabled);

-- CRITICAL: RLS (Row Level Security) for tenant isolation
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- CRITICAL: RLS Policies - users can only see their own tenant's flags
CREATE POLICY tenant_isolation_tenant_feature_flags ON tenant_feature_flags
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- CRITICAL: Admin policy for full access (system administrators only)
CREATE POLICY admin_full_access_tenant_feature_flags ON tenant_feature_flags
    FOR ALL
    TO system_administrators
    USING (true);

-- CRITICAL: Function to create feature flag
CREATE OR REPLACE FUNCTION create_feature_flag(
    p_name VARCHAR(64),
    p_description TEXT,
    p_category VARCHAR(32),
    p_default_value BOOLEAN DEFAULT false,
    p_is_global BOOLEAN DEFAULT false,
    p_required_permissions TEXT[] DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_flag_id VARCHAR(64);
    v_random_bytes BYTEA;
BEGIN
    -- CRITICAL: Generate secure flag ID
    v_random_bytes := gen_random_bytes(16);
    v_flag_id := 'flag_' || encode(v_random_bytes, 'hex');
    
    -- CRITICAL: Create feature flag
    INSERT INTO feature_flags (
        id, name, description, category, default_value, is_global,
        required_permissions, metadata
    ) VALUES (
        v_flag_id, p_name, p_description, p_category, p_default_value, 
        p_is_global, p_required_permissions, p_metadata
    );
    
    RETURN v_flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to update feature flag
CREATE OR REPLACE FUNCTION update_feature_flag(
    p_flag_id VARCHAR(64),
    p_description TEXT DEFAULT NULL,
    p_default_value BOOLEAN DEFAULT NULL,
    p_required_permissions TEXT[] DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- CRITICAL: Update feature flag
    UPDATE feature_flags 
    SET 
        description = COALESCE(p_description, description),
        default_value = COALESCE(p_default_value, default_value),
        required_permissions = COALESCE(p_required_permissions, required_permissions),
        metadata = COALESCE(p_metadata, metadata),
        updated_at = NOW()
    WHERE id = p_flag_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get feature flag
CREATE OR REPLACE FUNCTION get_feature_flag(
    p_flag_name VARCHAR(64)
)
RETURNS TABLE (
    id VARCHAR(64),
    name VARCHAR(64),
    description TEXT,
    category VARCHAR(32),
    default_value BOOLEAN,
    is_global BOOLEAN,
    required_permissions TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id, ff.name, ff.description, ff.category, ff.default_value, ff.is_global,
        ff.required_permissions, ff.metadata, ff.created_at, ff.updated_at
    FROM feature_flags ff
    WHERE ff.name = p_flag_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get all feature flags
CREATE OR REPLACE FUNCTION get_all_feature_flags()
RETURNS TABLE (
    id VARCHAR(64),
    name VARCHAR(64),
    description TEXT,
    category VARCHAR(32),
    default_value BOOLEAN,
    is_global BOOLEAN,
    required_permissions TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id, ff.name, ff.description, ff.category, ff.default_value, ff.is_global,
        ff.required_permissions, ff.metadata, ff.created_at, ff.updated_at
    FROM feature_flags ff
    ORDER BY ff.category, ff.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get feature flag for tenant
CREATE OR REPLACE FUNCTION get_tenant_feature_flag(
    p_tenant_id VARCHAR(64),
    p_flag_name VARCHAR(64)
)
RETURNS TABLE (
    flag_id VARCHAR(64),
    flag_name VARCHAR(64),
    enabled BOOLEAN,
    enabled_at TIMESTAMP WITH TIME ZONE,
    enabled_by VARCHAR(64),
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by VARCHAR(64),
    reason TEXT,
    correlation_id VARCHAR(64),
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id as flag_id,
        ff.name as flag_name,
        COALESCE(tff.enabled, ff.default_value) as enabled,
        tff.enabled_at,
        tff.enabled_by,
        tff.disabled_at,
        tff.disabled_by,
        tff.reason,
        tff.correlation_id,
        tff.metadata
    FROM feature_flags ff
    LEFT JOIN tenant_feature_flags tff ON ff.id = tff.flag_id AND tff.tenant_id = p_tenant_id
    WHERE ff.name = p_flag_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get all feature flags for tenant
CREATE OR REPLACE FUNCTION get_tenant_feature_flags(
    p_tenant_id VARCHAR(64)
)
RETURNS TABLE (
    flag_id VARCHAR(64),
    flag_name VARCHAR(64),
    flag_description TEXT,
    flag_category VARCHAR(32),
    enabled BOOLEAN,
    source VARCHAR(32),
    enabled_at TIMESTAMP WITH TIME ZONE,
    enabled_by VARCHAR(64),
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by VARCHAR(64),
    reason TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.id as flag_id,
        ff.name as flag_name,
        ff.description as flag_description,
        ff.category as flag_category,
        COALESCE(tff.enabled, ff.default_value) as enabled,
        CASE 
            WHEN tff.id IS NOT NULL THEN 'TENANT'
            WHEN ff.is_global THEN 'GLOBAL'
            ELSE 'DEFAULT'
        END as source,
        tff.enabled_at,
        tff.enabled_by,
        tff.disabled_at,
        tff.disabled_by,
        tff.reason,
        tff.metadata
    FROM feature_flags ff
    LEFT JOIN tenant_feature_flags tff ON ff.id = tff.flag_id AND tff.tenant_id = p_tenant_id
    ORDER BY ff.category, ff.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to enable feature flag for tenant
CREATE OR REPLACE FUNCTION enable_tenant_feature_flag(
    p_tenant_id VARCHAR(64),
    p_flag_name VARCHAR(64),
    p_enabled_by VARCHAR(64),
    p_reason TEXT DEFAULT NULL,
    p_correlation_id VARCHAR(64) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_flag_id VARCHAR(64);
    v_tenant_flag_id VARCHAR(64);
    v_random_bytes BYTEA;
    v_existing_count INTEGER;
BEGIN
    -- CRITICAL: Get flag ID
    SELECT id INTO v_flag_id
    FROM feature_flags 
    WHERE name = p_flag_name;
    
    IF v_flag_id IS NULL THEN
        RAISE EXCEPTION 'Feature flag % not found', p_flag_name;
    END IF;
    
    -- CRITICAL: Check if global flag
    SELECT is_global INTO v_existing_count
    FROM feature_flags 
    WHERE id = v_flag_id AND is_global = true;
    
    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'Global feature flag % cannot be modified per tenant', p_flag_name;
    END IF;
    
    -- CRITICAL: Check if tenant flag already exists
    SELECT COUNT(*) INTO v_existing_count
    FROM tenant_feature_flags 
    WHERE tenant_id = p_tenant_id AND flag_id = v_flag_id;
    
    IF v_existing_count > 0 THEN
        -- CRITICAL: Update existing flag
        UPDATE tenant_feature_flags
        SET 
            enabled = true,
            enabled_at = NOW(),
            enabled_by = p_enabled_by,
            disabled_at = NULL,
            disabled_by = NULL,
            reason = p_reason,
            correlation_id = p_correlation_id,
            metadata = p_metadata,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id AND flag_id = v_flag_id;
    ELSE
        -- CRITICAL: Create new tenant flag
        v_random_bytes := gen_random_bytes(16);
        v_tenant_flag_id := 'tenant_flag_' || encode(v_random_bytes, 'hex');
        
        INSERT INTO tenant_feature_flags (
            id, tenant_id, flag_id, enabled, enabled_at, enabled_by,
            reason, correlation_id, metadata, created_at, updated_at
        ) VALUES (
            v_tenant_flag_id, p_tenant_id, v_flag_id, true, NOW(), p_enabled_by,
            p_reason, p_correlation_id, p_metadata, NOW(), NOW()
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to disable feature flag for tenant
CREATE OR REPLACE FUNCTION disable_tenant_feature_flag(
    p_tenant_id VARCHAR(64),
    p_flag_name VARCHAR(64),
    p_disabled_by VARCHAR(64),
    p_reason TEXT DEFAULT NULL,
    p_correlation_id VARCHAR(64) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_flag_id VARCHAR(64);
    v_existing_count INTEGER;
BEGIN
    -- CRITICAL: Get flag ID
    SELECT id INTO v_flag_id
    FROM feature_flags 
    WHERE name = p_flag_name;
    
    IF v_flag_id IS NULL THEN
        RAISE EXCEPTION 'Feature flag % not found', p_flag_name;
    END IF;
    
    -- CRITICAL: Check if global flag
    SELECT is_global INTO v_existing_count
    FROM feature_flags 
    WHERE id = v_flag_id AND is_global = true;
    
    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'Global feature flag % cannot be modified per tenant', p_flag_name;
    END IF;
    
    -- CRITICAL: Check if tenant flag exists
    SELECT COUNT(*) INTO v_existing_count
    FROM tenant_feature_flags 
    WHERE tenant_id = p_tenant_id AND flag_id = v_flag_id;
    
    IF v_existing_count = 0 THEN
        -- CRITICAL: Create new tenant flag (disabled)
        INSERT INTO tenant_feature_flags (
            id, tenant_id, flag_id, enabled, disabled_at, disabled_by,
            reason, correlation_id, metadata, created_at, updated_at
        ) VALUES (
            gen_random_bytes(16)::text, p_tenant_id, v_flag_id, false, NOW(), p_disabled_by,
            p_reason, p_correlation_id, p_metadata, NOW(), NOW()
        );
    ELSE
        -- CRITICAL: Update existing flag
        UPDATE tenant_feature_flags
        SET 
            enabled = false,
            disabled_at = NOW(),
            disabled_by = p_disabled_by,
            reason = p_reason,
            correlation_id = p_correlation_id,
            metadata = p_metadata,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id AND flag_id = v_flag_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Function to get feature flag statistics
CREATE OR REPLACE FUNCTION get_feature_flag_statistics()
RETURNS TABLE (
    total_flags BIGINT,
    enabled_flags BIGINT,
    disabled_flags BIGINT,
    flags_by_category JSONB,
    tenant_usage JSONB
) AS $$
DECLARE
    v_category_stats JSONB;
    v_tenant_usage JSONB;
BEGIN
    -- CRITICAL: Get category statistics
    SELECT jsonb_object_agg(category, flag_count) INTO v_category_stats
    FROM (
        SELECT category, COUNT(*) as flag_count
        FROM feature_flags
        GROUP BY category
    ) category_counts;
    
    -- CRITICAL: Get tenant usage
    SELECT jsonb_object_agg(tenant_id, enabled_count) INTO v_tenant_usage
    FROM (
        SELECT tenant_id, COUNT(*) as enabled_count
        FROM tenant_feature_flags
        WHERE enabled = true
        GROUP BY tenant_id
    ) tenant_counts;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_flags,
        COUNT(*) FILTER (WHERE default_value = true)::BIGINT as enabled_flags,
        COUNT(*) FILTER (WHERE default_value = false)::BIGINT as disabled_flags,
        COALESCE(v_category_stats, '{}'::JSONB) as flags_by_category,
        COALESCE(v_tenant_usage, '{}'::JSONB) as tenant_usage
    FROM feature_flags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: Grant permissions
GRANT SELECT ON feature_flags TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON feature_flags TO system_administrators;

GRANT SELECT ON tenant_feature_flags TO authenticated_users;
GRANT SELECT, INSERT, UPDATE ON tenant_feature_flags TO system_administrators;

GRANT EXECUTE ON FUNCTION create_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION update_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION get_feature_flag TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION get_all_feature_flags TO system_administrators;
GRANT EXECUTE ON FUNCTION get_tenant_feature_flag TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_tenant_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION get_tenant_feature_flags TO authenticated_users;
GRANT EXECUTE ON FUNCTION get_tenant_feature_flags TO system_administrators;
GRANT EXECUTE ON FUNCTION enable_tenant_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION disable_tenant_feature_flag TO system_administrators;
GRANT EXECUTE ON FUNCTION get_feature_flag_statistics TO system_administrators;

-- CRITICAL: Add comments for documentation
COMMENT ON TABLE feature_flags IS 'Feature flag definitions with tenant-scoped overrides';
COMMENT ON TABLE tenant_feature_flags IS 'Tenant-specific feature flag values with audit trail';

COMMENT ON COLUMN feature_flags.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN feature_flags.name IS 'Unique feature flag name';
COMMENT ON COLUMN feature_flags.description IS 'Human-readable description of the feature';
COMMENT ON COLUMN feature_flags.category IS 'Category of the feature flag';
COMMENT ON COLUMN feature_flags.default_value IS 'Default value when not overridden';
COMMENT ON COLUMN feature_flags.is_global IS 'Whether this flag is global (cannot be overridden per tenant)';
COMMENT ON COLUMN feature_flags.required_permissions IS 'Permissions required to modify this flag';

COMMENT ON COLUMN tenant_feature_flags.id IS 'Cryptographically secure unique identifier';
COMMENT ON COLUMN tenant_feature_flags.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN tenant_feature_flags.flag_id IS 'Reference to the feature flag definition';
COMMENT ON COLUMN tenant_feature_flags.enabled IS 'Current enabled state for this tenant';
COMMENT ON COLUMN tenant_feature_flags.enabled_at IS 'When the flag was enabled';
COMMENT ON COLUMN tenant_feature_flags.enabled_by IS 'Who enabled the flag';
COMMENT ON COLUMN tenant_feature_flags.disabled_at IS 'When the flag was disabled';
COMMENT ON COLUMN tenant_feature_flags.disabled_by IS 'Who disabled the flag';
COMMENT ON COLUMN tenant_feature_flags.reason IS 'Reason for the flag change';
COMMENT ON COLUMN tenant_feature_flags.correlation_id IS 'Request correlation ID for tracing';

COMMENT ON FUNCTION create_feature_flag() IS 'Create a new feature flag';
COMMENT ON FUNCTION update_feature_flag() IS 'Update an existing feature flag';
COMMENT ON FUNCTION get_feature_flag() IS 'Get a specific feature flag';
COMMENT ON FUNCTION get_all_feature_flags() IS 'Get all feature flags';
COMMENT ON FUNCTION get_tenant_feature_flag() IS 'Get feature flag value for a tenant';
COMMENT ON FUNCTION get_tenant_feature_flags() IS 'Get all feature flags for a tenant';
COMMENT ON FUNCTION enable_tenant_feature_flag() IS 'Enable a feature flag for a tenant';
COMMENT ON FUNCTION disable_tenant_feature_flag() IS 'Disable a feature flag for a tenant';
COMMENT ON FUNCTION get_feature_flag_statistics() IS 'Get feature flag usage statistics';
