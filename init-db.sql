-- Create the database
drop database if exists accubooks;
create database accubooks;

-- Connect to the database
\c accubooks

-- Create the users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial admin user
INSERT INTO users (id, username, email, password, name, role, email_verified, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'admin@accubooks.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', -- password: password
  'System Administrator',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert initial company
INSERT INTO companies (id, name, email, phone, address, tax_id, currency, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Demo Company',
  'demo@accubooks.com',
  '+1-555-0123',
  '123 Business St, City, Country',
  'TAX-123456',
  'USD',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
