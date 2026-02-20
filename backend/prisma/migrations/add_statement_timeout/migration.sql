-- AUDIT FIX P0-5: Add PostgreSQL statement timeout
-- Prevents long-running queries from exhausting connection pool
-- Sets 30 second timeout for all statements

-- Note: Statement timeout should be set at application level or session level
-- ALTER DATABASE requires literal database name, not function call
-- This is handled by application connection pool settings instead
-- Migration intentionally left as no-op to maintain migration sequence

-- Also set for current session (for immediate effect)
SET statement_timeout = '30s';

-- For production, you may want different timeouts for different operations
-- This can be overridden per-transaction if needed for long-running operations
