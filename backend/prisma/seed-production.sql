-- AccuBooks Production Database Seed Script
-- Run this after migrations to create initial admin account
-- Generated: 2026-02-11

-- Create admin user with OWNER role
-- Password: TempAdmin123! (bcrypt hashed)
INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin@accubooks.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oJmZu6',
  'System Administrator',
  'OWNER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create demo company for testing
INSERT INTO companies (id, name, "isActive", "createdAt", "updatedAt")
VALUES (
  'demo-company-001',
  'Demo Company',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Link admin to demo company
INSERT INTO company_members (id, "userId", "companyId", role, "createdAt", "updatedAt")
SELECT 
  'member-' || u.id || '-demo',
  u.id,
  'demo-company-001',
  'OWNER',
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'admin@accubooks.com'
ON CONFLICT (id) DO NOTHING;

-- Create billing status for demo company
INSERT INTO billing_status (
  id,
  "companyId",
  plan,
  status,
  "currentPeriodStart",
  "currentPeriodEnd",
  "createdAt",
  "updatedAt"
)
VALUES (
  'billing-demo-001',
  'demo-company-001',
  'TRIAL',
  'active',
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify seed data
SELECT 
  'Admin user created' as status,
  email,
  role,
  "isActive"
FROM users
WHERE email = 'admin@accubooks.com';

SELECT 
  'Demo company created' as status,
  id,
  name,
  "isActive"
FROM companies
WHERE id = 'demo-company-001';

SELECT 
  'Billing status created' as status,
  plan,
  status,
  "currentPeriodEnd"
FROM billing_status
WHERE "companyId" = 'demo-company-001';
