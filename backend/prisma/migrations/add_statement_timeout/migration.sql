-- AUDIT FIX P0-5: Add PostgreSQL statement timeout
-- Prevents long-running queries from exhausting connection pool
-- Sets 30 second timeout for all statements

-- Set default statement timeout for the database
ALTER DATABASE current_database() SET statement_timeout = '30s';

-- Also set for current session (for immediate effect)
SET statement_timeout = '30s';

-- For production, you may want different timeouts for different operations
-- This can be overridden per-transaction if needed for long-running operations
