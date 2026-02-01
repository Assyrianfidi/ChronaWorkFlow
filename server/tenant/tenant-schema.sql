// Database schema for multi-tenancy
// Add tenant and user-tenant relationship tables

-- Create tenant enum types
CREATE TYPE tenant_subscription_plan AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE tenant_subscription_status AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID');
CREATE TYPE tenant_user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');

-- Create tenants table
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT UNIQUE,
    logo TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    subscription_plan tenant_subscription_plan NOT NULL DEFAULT 'FREE',
    subscription_status tenant_subscription_status NOT NULL DEFAULT 'ACTIVE',
    max_users INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create user_tenants junction table
CREATE TABLE user_tenants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role tenant_user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    invited_by TEXT REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_domain ON tenants(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_tenants_user_id ON user_tenants(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_tenants_active ON user_tenants(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_tenants_role ON user_tenants(role) WHERE deleted_at IS NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tenants_updated_at 
    BEFORE UPDATE ON user_tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create default tenant settings function
CREATE OR REPLACE FUNCTION default_tenant_settings()
RETURNS JSONB AS $$
BEGIN
    RETURN JSONB_BUILD_OBJECT(
        'allowUserRegistration', false,
        'requireEmailVerification', true,
        'defaultUserRole', 'EMPLOYEE',
        'sessionTimeout', 480,
        'passwordPolicy', JSONB_BUILD_OBJECT(
            'minLength', 8,
            'requireUppercase', true,
            'requireLowercase', true,
            'requireNumbers', true,
            'requireSpecialChars', false,
            'preventReuse', 3
        ),
        'twoFactorRequired', false,
        'auditLogRetention', 90,
        'dataRetention', 2555
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tenants they belong to
CREATE POLICY tenants_user_access ON tenants
    FOR ALL USING (
        id IN (
            SELECT tenant_id FROM user_tenants 
            WHERE user_id = current_setting('app.current_user_id', true) 
            AND is_active = true 
            AND deleted_at IS NULL
        )
    );

-- Policy: Users can only see their own tenant memberships
CREATE POLICY user_tenants_user_access ON user_tenants
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', true)
    );

-- Policy: Service accounts can access all tenant data
CREATE POLICY tenants_service_access ON tenants
    FOR ALL USING (
        current_setting('app.is_service_account', true) = 'true'
    );

CREATE POLICY user_tenants_service_access ON user_tenants
    FOR ALL USING (
        current_setting('app.is_service_account', true) = 'true'
    );

-- Create function to check tenant membership
CREATE OR REPLACE FUNCTION has_tenant_role(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_role tenant_user_role
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_tenants 
        WHERE user_id = p_user_id 
        AND tenant_id = p_tenant_id 
        AND role = p_role
        AND is_active = true 
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check any tenant role
CREATE OR REPLACE FUNCTION has_any_tenant_role(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_roles tenant_user_role[]
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_tenants 
        WHERE user_id = p_user_id 
        AND tenant_id = p_tenant_id 
        AND role = ANY(p_roles)
        AND is_active = true 
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's primary tenant
CREATE OR REPLACE FUNCTION get_primary_tenant(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
    primary_tenant_id TEXT;
BEGIN
    SELECT t.id INTO primary_tenant_id
    FROM tenants t
    JOIN user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = p_user_id
    AND ut.is_active = true
    AND ut.deleted_at IS NULL
    AND t.deleted_at IS NULL
    ORDER BY 
        CASE WHEN ut.last_active_at IS NOT NULL THEN ut.last_active_at ELSE ut.joined_at END DESC
    LIMIT 1;
    
    RETURN primary_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate tenant user limit
CREATE OR REPLACE FUNCTION check_tenant_user_limit(
    p_tenant_id TEXT,
    p_additional_users INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_users INTEGER;
BEGIN
    SELECT COUNT(*), t.max_users
    INTO current_count, max_users
    FROM user_tenants ut
    JOIN tenants t ON ut.tenant_id = t.id
    WHERE ut.tenant_id = p_tenant_id
    AND ut.is_active = true
    AND ut.deleted_at IS NULL
    AND t.deleted_at IS NULL;
    
    RETURN (current_count + p_additional_users) <= max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last active timestamp
CREATE OR REPLACE FUNCTION update_last_active(
    p_user_id TEXT,
    p_tenant_id TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE user_tenants 
    SET last_active_at = NOW(), updated_at = NOW
    WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id 
    AND is_active = true 
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create default tenant for new users
CREATE OR REPLACE FUNCTION create_default_tenant()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id TEXT;
    new_membership_id TEXT;
BEGIN
    -- Create default tenant for new user
    new_tenant_id := 'tn_' || encode(gen_random_bytes(16), 'hex');
    
    INSERT INTO tenants (
        id, name, slug, settings, subscription_plan, subscription_status, 
        max_users, is_active, created_at, updated_at, created_by
    ) VALUES (
        new_tenant_id, 
        NEW.name || ' Personal', 
        lower(regexp_replace(NEW.name || '-personal', '[^a-z0-9]+', '-', 'g')),
        default_tenant_settings(),
        'FREE',
        'ACTIVE',
        5,
        true,
        NOW(),
        NOW(),
        NEW.id
    );
    
    -- Add user as owner of their default tenant
    new_membership_id := 'mb_' || encode(gen_random_bytes(16), 'hex');
    
    INSERT INTO user_tenants (
        id, user_id, tenant_id, role, is_active, 
        joined_at, created_at, updated_at
    ) VALUES (
        new_membership_id,
        NEW.id,
        new_tenant_id,
        'OWNER',
        true,
        NOW(),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic default tenant creation
CREATE TRIGGER create_default_tenant_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_tenant();

-- Create view for tenant users with details
CREATE VIEW tenant_users_view AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.is_active as user_is_active,
    u.last_login as user_last_login,
    ut.id as membership_id,
    ut.role as tenant_role,
    ut.is_active as membership_is_active,
    ut.invited_at,
    ut.joined_at,
    ut.last_active_at,
    ut.created_at as membership_created_at,
    ut.invited_by,
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.domain as tenant_domain,
    t.logo as tenant_logo,
    t.subscription_plan,
    t.subscription_status,
    t.is_active as tenant_is_active
FROM user_tenants ut
JOIN users u ON ut.user_id = u.id
JOIN tenants t ON ut.tenant_id = t.id
WHERE ut.deleted_at IS NULL
AND u.deleted_at IS NULL
AND t.deleted_at IS NULL;

-- Create view for active tenant summary
CREATE VIEW active_tenants_view AS
SELECT 
    t.id,
    t.name,
    t.slug,
    t.domain,
    t.subscription_plan,
    t.subscription_status,
    t.max_users,
    t.created_at,
    COUNT(ut.id) as active_users,
    COUNT(CASE WHEN ut.last_active_at > NOW() - INTERVAL '30 days' THEN 1 END) as recently_active_users
FROM tenants t
LEFT JOIN user_tenants ut ON t.id = ut.tenant_id 
    AND ut.is_active = true 
    AND ut.deleted_at IS NULL
WHERE t.deleted_at IS NULL
AND t.is_active = true
GROUP BY t.id, t.name, t.slug, t.domain, t.subscription_plan, t.subscription_status, t.max_users, t.created_at;
