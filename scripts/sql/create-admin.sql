-- Create the role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'accubooks') THEN
        CREATE ROLE accubooks WITH LOGIN PASSWORD 'accubooks_password';
    END IF;
END $$;

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE accubooks WITH OWNER = accubooks'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'accubooks')\gexec

-- Connect to the database
\c accubooks

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    email_verified TIMESTAMPTZ,
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the admin user if it doesn't exist
INSERT INTO "User" (email, name, password, role, email_verified)
SELECT 'admin@example.com', 'Admin User', '$2a$12$1QJ2YvU1wX9z8KZJf5wX2.3F4G5H6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z', 'ADMIN', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@example.com');

-- Grant all privileges to the accubooks user
GRANT ALL PRIVILEGES ON DATABASE accubooks TO accubooks;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO accubooks;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO accubooks;
