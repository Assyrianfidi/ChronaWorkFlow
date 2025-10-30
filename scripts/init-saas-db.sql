-- AccuBooks SaaS Database Initialization
-- Creates admin tenant, demo tenant, and subscription tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create SaaS-specific tables
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'incomplete',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, metric_name, recorded_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_date ON usage_metrics(tenant_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create admin tenant
INSERT INTO tenants (id, name, slug, subscription_tier, subscription_status)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'AccuBooks Admin',
    'admin',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Create demo tenant
INSERT INTO tenants (id, name, slug, subscription_tier, subscription_status, trial_ends_at)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Demo Company',
    'demo',
    'standard',
    'trial',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Create admin user
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@accubooks.com',
    '$2b$10$rEuVt2cC8kXz3vV9mM7QXeKJ8z9f5v2r8z9f5v2r8z9f5v2r8z9f5v2', -- "<REDACTED_DEFAULT_PASSWORD>"
    'System',
    'Administrator',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- Create demo user
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'demo@accubooks.com',
    '$2b$10$rEuVt2cC8kXz3vV9mM7QXeKJ8z9f5v2r8z9f5v2r8z9f5v2r8z9f5v2', -- "demo123"
    'Demo',
    'User',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- Create functions for tenant isolation
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- This would be set by middleware based on JWT token or subdomain
    -- For now, return a default tenant
    RETURN '00000000-0000-0000-0000-000000000002'::uuid;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) setup
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant isolation
CREATE POLICY tenant_isolation_tenants ON tenants
    FOR ALL USING (id = get_current_tenant_id());

CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_subscriptions ON subscriptions
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_usage ON usage_metrics
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_audit ON audit_logs
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- Admin override policies
CREATE POLICY admin_access_tenants ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_setting('app.current_user_id', true)::uuid
            AND users.role = 'admin'
            AND users.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
        )
    );

-- Function to create new tenant
CREATE OR REPLACE FUNCTION create_tenant(
    tenant_name VARCHAR(255),
    tenant_slug VARCHAR(100),
    owner_email VARCHAR(255),
    owner_password VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
    user_id UUID;
BEGIN
    -- Create tenant
    INSERT INTO tenants (name, slug, trial_ends_at)
    VALUES (tenant_name, tenant_slug, CURRENT_TIMESTAMP + INTERVAL '14 days')
    RETURNING id INTO tenant_id;

    -- Create owner user
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, email_verified)
    VALUES (
        tenant_id,
        owner_email,
        crypt(owner_password, gen_salt('bf')),
        split_part(owner_email, '@', 1),
        'Owner',
        'admin',
        false
    ) RETURNING id INTO user_id;

    -- Log tenant creation
    INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, new_values)
    VALUES (tenant_id, user_id, 'tenant_created', 'tenant', tenant_id::text,
            jsonb_build_object('name', tenant_name, 'slug', tenant_slug));

    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription tier
CREATE OR REPLACE FUNCTION update_tenant_subscription(
    p_tenant_id UUID,
    p_tier VARCHAR(50),
    p_stripe_customer_id VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE tenants
    SET
        subscription_tier = p_tier,
        stripe_customer_id = p_stripe_customer_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_tenant_id;

    -- Log subscription change
    INSERT INTO audit_logs (tenant_id, action, resource_type, resource_id, new_values)
    VALUES (p_tenant_id, 'subscription_updated', 'tenant', p_tenant_id::text,
            jsonb_build_object('tier', p_tier, 'stripe_customer_id', p_stripe_customer_id));
END;
$$ LANGUAGE plpgsql;

-- Function to record usage metrics
CREATE OR REPLACE FUNCTION record_usage_metric(
    p_tenant_id UUID,
    p_metric_name VARCHAR(100),
    p_metric_value DECIMAL(15,2)
) RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_metrics (tenant_id, metric_name, metric_value)
    VALUES (p_tenant_id, p_metric_name, p_metric_value)
    ON CONFLICT (tenant_id, metric_name, recorded_at)
    DO UPDATE SET
        metric_value = p_metric_value,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data for demo tenant
DO $$
DECLARE
    demo_tenant_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
    demo_user_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
BEGIN
    -- Create sample companies for demo
    INSERT INTO companies (id, tenant_id, name, legal_name, tax_id, address, phone, email, website, is_active)
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, demo_tenant_id, 'Demo Accounting Firm', 'Demo Accounting Services LLC', '12-3456789', '123 Demo Street, Demo City, DC 12345', '+1-555-0123', 'info@demoaccounting.com', 'https://demoaccounting.com', true),
        ('10000000-0000-0000-0000-000000000002'::uuid, demo_tenant_id, 'Sample Client Corp', 'Sample Client Corporation', '98-7654321', '456 Sample Ave, Sample City, SC 67890', '+1-555-0456', 'contact@sampleclient.com', 'https://sampleclient.com', true)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample accounts
    INSERT INTO accounts (id, tenant_id, company_id, name, type, number, balance, is_active)
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Checking Account', 'asset', '1000', 50000.00, true),
        ('20000000-0000-0000-0000-000000000002'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Accounts Receivable', 'asset', '1100', 25000.00, true),
        ('20000000-0000-0000-0000-000000000003'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Office Equipment', 'asset', '1500', 15000.00, true),
        ('20000000-0000-0000-0000-000000000004'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Accounts Payable', 'liability', '2000', 8000.00, true),
        ('20000000-0000-0000-0000-000000000005'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Retained Earnings', 'equity', '3000', 84000.00, true)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample customers
    INSERT INTO customers (id, tenant_id, company_id, first_name, last_name, email, phone, billing_address, is_active)
    VALUES
        ('30000000-0000-0000-0000-000000000001'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'John', 'Smith', 'john.smith@email.com', '+1-555-1001', '789 Customer St, Customer City, CC 11111', true),
        ('30000000-0000-0000-0000-000000000002'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Jane', 'Doe', 'jane.doe@email.com', '+1-555-1002', '321 Client Ave, Client City, CC 22222', true)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample transactions
    INSERT INTO transactions (id, tenant_id, company_id, description, total_amount, date, reference_number, notes)
    VALUES
        ('40000000-0000-0000-0000-000000000001'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Office supplies purchase', -250.00, CURRENT_DATE - INTERVAL '5 days', 'TXN-001', 'Monthly office supplies'),
        ('40000000-0000-0000-0000-000000000002'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Client payment received', 1500.00, CURRENT_DATE - INTERVAL '3 days', 'TXN-002', 'Invoice #INV-001 payment'),
        ('40000000-0000-0000-0000-000000000003'::uuid, demo_tenant_id, '10000000-0000-0000-0000-000000000001'::uuid, 'Software subscription', -99.00, CURRENT_DATE - INTERVAL '1 day', 'TXN-003', 'Monthly software subscription')
    ON CONFLICT (id) DO NOTHING;

    -- Log demo data creation
    INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, new_values)
    VALUES (demo_tenant_id, demo_user_id, 'demo_data_created', 'system',
            jsonb_build_object('message', 'Demo data initialized for tenant'));
END $$;

-- Analyze tables for query optimization
ANALYZE tenants;
ANALYZE users;
ANALYZE subscriptions;
ANALYZE usage_metrics;
ANALYZE audit_logs;

COMMIT;
