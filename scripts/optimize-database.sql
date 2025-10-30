-- PostgreSQL Performance Optimization Script
-- Run this script to optimize database performance for production

-- Enable query timing
\timing on

-- Check current database statistics
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_active ON companies(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_company_type ON accounts(company_id, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_active ON customers(company_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_company_active ON vendors(company_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_company_date ON transactions(company_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_company_status ON employees(company_id, status);

-- Payroll module indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_employee_period ON time_entries(employee_id, payroll_period_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pay_runs_company_status ON pay_runs(company_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pay_run_details_pay_run ON pay_run_details(pay_run_id);

-- Inventory module indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_items_company_active ON inventory_items(company_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_company_status ON purchase_orders(company_id, status);

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_company_balance ON accounts(company_id, balance);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_company_amount ON transactions(company_id, total_amount);

-- Analyze tables to update statistics
ANALYZE companies;
ANALYZE users;
ANALYZE accounts;
ANALYZE customers;
ANALYZE vendors;
ANALYZE transactions;
ANALYZE transaction_lines;
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE payments;
ANALYZE bank_transactions;
ANALYZE employees;
ANALYZE time_entries;
ANALYZE pay_runs;
ANALYZE pay_run_details;
ANALYZE tax_forms;
ANALYZE inventory_items;
ANALYZE purchase_orders;
ANALYZE purchase_order_items;
ANALYZE inventory_adjustments;

-- Enable pg_stat_statements for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure connection pool settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'ddl';

-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Show current database size
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check for unused indexes (can be dropped for performance)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY tablename, indexname;

-- Show current configuration
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW log_min_duration_statement;

\timing off
