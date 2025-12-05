-- Drop tables if they exist
DROP TABLE IF EXISTS reconciliation_reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS reconciliation_reports_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
