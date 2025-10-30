CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO users (id, username, email, password, name, role, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'admin@accubooks.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', -- <REDACTED_DEFAULT_PASSWORD> hashed
  'System Administrator',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (id, name, email, phone, address, tax_id, currency, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Demo Company',
  'demo@accubooks.com',
  '+1-555-0123',
  '123 Business St, City, State 12345',
  '12-3456789',
  'USD',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, company_id, code, name, type, balance, description, is_active, created_at, updated_at)
VALUES
  -- Assets
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '1110', 'Cash', 'asset', '10000.00', 'Primary cash account', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '1120', 'Accounts Receivable', 'asset', '5000.00', 'Money owed by customers', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', '1130', 'Inventory', 'asset', '15000.00', 'Inventory assets', true, NOW(), NOW()),

  -- Liabilities
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', '2110', 'Accounts Payable', 'liability', '3000.00', 'Money owed to vendors', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', '2120', 'Credit Card', 'liability', '1500.00', 'Business credit card', true, NOW(), NOW()),

  -- Equity
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', '3110', 'Retained Earnings', 'equity', '25000.00', 'Accumulated profits', true, NOW(), NOW()),

  -- Revenue
  ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '4110', 'Sales Revenue', 'revenue', '50000.00', 'Product sales', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '4120', 'Service Revenue', 'revenue', '15000.00', 'Service income', true, NOW(), NOW()),

  -- Expenses
  ('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440001', '5110', 'Cost of Goods Sold', 'expense', '25000.00', 'Cost of inventory sold', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440001', '5120', 'Rent Expense', 'expense', '6000.00', 'Office rent', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440001', '5130', 'Utilities', 'expense', '1200.00', 'Electricity, water, internet', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
