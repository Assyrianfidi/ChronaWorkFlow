# ACCUBOOKS ADMINISTRATOR MANUAL

**Version**: 1.0.0  
**Date**: November 25, 2025  
**Target Audience**: System Administrators, IT Managers, DevOps Engineers  

---

## 📋 **TABLE OF CONTENTS**

1. [System Overview](#system-overview)
2. [Installation & Setup](#installation--setup)
3. [User Management](#user-management)
4. [Company Management](#company-management)
5. [Account Management](#account-management)
6. [Transaction Management](#transaction-management)
7. [Database Administration](#database-administration)
8. [Cache Management](#cache-management)
9. [Backup & Recovery](#backup--recovery)
10. [Health Monitoring](#health-monitoring)
11. [Security Management](#security-management)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance Procedures](#maintenance-procedures)
14. [API Administration](#api-administration)

---

## 🏛️ **SYSTEM OVERVIEW**

### **Architecture Components**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Production)

### **Service Ports**
- **Frontend**: `http://localhost:3000` (Development)
- **Backend API**: `http://localhost:3001` (Development)
- **Database**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Nginx**: `http://localhost:80` (Production)

### **Directory Structure**
```
AccuBooks/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── modules/        # Business modules
│   │   ├── utils/          # Utilities
│   │   ├── middleware/     # Express middleware
│   │   └── routes/         # API routes
│   ├── prisma/             # Database schema
│   └── Dockerfile
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   └── Dockerfile
├── docker-compose.yml     # Container orchestration
└── nginx.conf             # Web server config
```

---

## 🚀 **INSTALLATION & SETUP**

### **Prerequisites**
- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **PostgreSQL**: 15.x (if not using Docker)
- **Redis**: 7.x (if not using Docker)

### **Quick Start (Docker)**
```bash
# Clone the repository
git clone <repository-url>
cd AccuBooks

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp client/.env.example client/.env

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### **Manual Installation**
```bash
# Install backend dependencies
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start backend
npm start

# Install frontend dependencies
cd ../client
npm install

# Start frontend
npm run dev
```

### **Environment Configuration**

#### **Backend Environment (.env)**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/AccuBooks"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Server
PORT=3001
NODE_ENV="production"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Stripe (Optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### **Frontend Environment (.env)**
```bash
VITE_API_URL="http://localhost:3001"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 👥 **USER MANAGEMENT**

### **User Roles & Permissions**

| Role | Description | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | System administrator | Full system access |
| **ADMIN** | Company administrator | Company management |
| **MANAGER** | Department manager | Limited company access |
| **ACCOUNTANT** | Accounting staff | Financial operations |
| **VIEWER** | Read-only access | View-only permissions |

### **Creating Users**

#### **Via API**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN"
  }'
```

#### **Via Database**
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES (
  'admin@example.com',
  '$2b$10$hashedpassword...',
  'John',
  'Doe',
  'ADMIN',
  true,
  NOW()
);
```

### **Managing User Sessions**

#### **View Active Sessions**
```sql
SELECT * FROM refresh_tokens 
WHERE user_id = <user_id> 
AND expires_at > NOW();
```

#### **Revoke User Sessions**
```sql
DELETE FROM refresh_tokens WHERE user_id = <user_id>;
```

### **Password Reset**

#### **Force Password Reset**
```sql
UPDATE users 
SET password_hash = '$2b$10$temporaryhash...',
  password_reset_required = true
WHERE email = 'user@example.com';
```

---

## 🏢 **COMPANY MANAGEMENT**

### **Multi-Company Architecture**

AccuBooks supports multiple companies with complete data isolation.

### **Creating Companies**

#### **Via API**
```bash
curl -X POST http://localhost:3001/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "ABC Corporation",
    "taxId": "12-3456789",
    "address": "123 Business St, City, State 12345",
    "phone": "(555) 123-4567",
    "email": "contact@abccorp.com",
    "website": "https://abccorp.com"
  }'
```

#### **Via Database**
```sql
INSERT INTO companies (name, tax_id, address, phone, email, website, created_at)
VALUES (
  'ABC Corporation',
  '12-3456789',
  '123 Business St, City, State 12345',
  '(555) 123-4567',
  'contact@abccorp.com',
  'https://abccorp.com',
  NOW()
);
```

### **Company Members**

#### **Add User to Company**
```sql
INSERT INTO company_members (company_id, user_id, role, joined_at)
VALUES (<company_id>, <user_id>, 'ADMIN', NOW());
```

#### **Company Permissions**
- **OWNER**: Full company control
- **ADMIN**: Company management
- **MEMBER**: Basic access
- **VIEWER**: Read-only access

### **Company Switching**

Users can switch between companies they have access to:

```bash
curl -X POST http://localhost:3001/api/v1/companies/switch \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId": "<company_id>"}'
```

---

## 📊 **ACCOUNT MANAGEMENT**

### **Chart of Accounts**

#### **Account Types**
- **ASSET**: Cash, accounts receivable, inventory
- **LIABILITY**: Accounts payable, loans, taxes
- **EQUITY**: Owner's equity, retained earnings
- **REVENUE**: Sales, service income
- **EXPENSE**: Operating expenses, cost of goods sold

#### **Creating Accounts**

```bash
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "companyId": "<company_id>",
    "code": "1000",
    "name": "Cash",
    "type": "ASSET",
    "description": "Primary cash account",
    "isActive": true
  }'
```

#### **Account Hierarchy**

Accounts support parent-child relationships:

```sql
-- Create parent account
INSERT INTO accounts (id, company_id, code, name, type, parent_id)
VALUES ('parent-id', '<company_id>', '1000', 'Current Assets', 'ASSET', NULL);

-- Create child account
INSERT INTO accounts (id, company_id, code, name, type, parent_id)
VALUES ('child-id', '<company_id>', '1010', 'Cash', 'ASSET', 'parent-id');
```

### **Opening Balances**

#### **Set Opening Balances**
```bash
curl -X POST http://localhost:3001/api/v1/accounts/<account_id>/balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 10000.00,
    "date": "2023-01-01",
    "description": "Opening balance"
  }'
```

---

## 💳 **TRANSACTION MANAGEMENT**

### **Transaction Types**
- **JOURNAL_ENTRY**: Manual journal entries
- **INVOICE**: Sales invoices
- **PAYMENT**: Customer payments
- **BILL**: Vendor bills
- **EXPENSE**: Expense transactions
- **ADJUSTMENT**: Adjusting entries

### **Creating Transactions**

#### **Journal Entry**
```bash
curl -X POST http://localhost:3001/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "companyId": "<company_id>",
    "transactionNumber": "JE-001",
    "date": "2023-01-15",
    "type": "JOURNAL_ENTRY",
    "description": "Monthly rent payment",
    "totalAmount": "2000.00",
    "lines": [
      {
        "accountId": "<expense_account_id>",
        "debit": "2000.00",
        "credit": "0.00",
        "description": "Rent expense"
      },
      {
        "accountId": "<cash_account_id>",
        "debit": "0.00",
        "credit": "2000.00",
        "description": "Cash payment"
      }
    ]
  }'
```

### **Transaction Validation**

All transactions must be balanced (total debits = total credits):

```sql
-- Check transaction balance
SELECT 
  t.id,
  t.transaction_number,
  SUM(tl.debit) as total_debits,
  SUM(tl.credit) as total_credits,
  SUM(tl.debit) - SUM(tl.credit) as balance
FROM transactions t
JOIN transaction_lines tl ON t.id = tl.transaction_id
WHERE t.company_id = '<company_id>'
GROUP BY t.id, t.transaction_number
HAVING SUM(tl.debit) != SUM(tl.credit);
```

---

## 🗄️ **DATABASE ADMINISTRATION**

### **Database Schema**

#### **Core Tables**
- **users**: User accounts and authentication
- **companies**: Multi-company data
- **company_members**: User-company relationships
- **accounts**: Chart of accounts
- **transactions**: Financial transactions
- **transaction_lines**: Transaction line items
- **invoices**: Sales invoices
- **clients**: Customer management

### **Database Operations**

#### **Backup Database**
```bash
# Full backup
docker exec accubooks-postgres pg_dump -U postgres AccuBooks > backup_$(date +%Y%m%d).sql

# Compressed backup
docker exec accubooks-postgres pg_dump -U postgres AccuBooks | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### **Restore Database**
```bash
# Restore from backup
docker exec -i accubooks-postgres psql -U postgres AccuBooks < backup_20231125.sql

# Restore from compressed backup
gunzip -c backup_20231125.sql.gz | docker exec -i accubooks-postgres psql -U postgres AccuBooks
```

#### **Database Maintenance**
```sql
-- Update statistics
ANALYZE;

-- Reindex tables
REINDEX DATABASE AccuBooks;

-- Vacuum analyze
VACUUM ANALYZE;

-- Check database size
SELECT pg_size_pretty(pg_database_size('AccuBooks'));
```

### **Performance Monitoring**

#### **Slow Queries**
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- View slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

#### **Connection Monitoring**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Connection details
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state = 'active';
```

---

## 🚀 **CACHE MANAGEMENT**

### **Redis Configuration**

#### **Cache Keys Structure**
```
accubooks:company:<company_id>:accounts
accubooks:company:<company_id>:transactions
accubooks:user:<user_id>:session
accubooks:api:<endpoint>:<params_hash>
```

#### **Cache Operations**
```bash
# Connect to Redis
docker exec -it accubooks-redis redis-cli

# View all keys
KEYS accubooks:*

# View specific cache
GET accubooks:company:<company_id>:accounts

# Clear cache for company
DEL accubooks:company:<company_id>:*

# Clear all cache (use with caution)
FLUSHDB
```

### **Cache Monitoring**

#### **Redis Statistics**
```bash
# Memory usage
docker exec accubooks-redis redis-cli INFO memory

# Hit rates
docker exec accubooks-redis redis-cli INFO stats

# Key space
docker exec accubooks-redis redis-cli INFO keyspace
```

#### **Cache Warming**
```bash
# Warm cache for company
curl -X POST http://localhost:3001/api/v1/cache/warm \
  -H "Authorization: Bearer <token>" \
  -d '{"companyId": "<company_id>"}'
```

---

## 💾 **BACKUP & RECOVERY**

### **Automated Backups**

#### **Docker Compose Backup Script**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker exec accubooks-postgres pg_dump -U postgres AccuBooks | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Redis backup
docker exec accubooks-redis redis-cli BGSAVE
docker cp accubooks-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# File backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz uploads/ logs/

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

#### **Cron Job Setup**
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup.sh
```

### **Disaster Recovery**

#### **Complete System Restore**
```bash
# 1. Stop services
docker-compose down

# 2. Restore database
gunzip -c backup_20231125.sql.gz | docker exec -i accubooks-postgres psql -U postgres AccuBooks

# 3. Restore Redis
docker cp backup_20231125.rdb accubooks-redis:/data/dump.rdb
docker restart accubooks-redis

# 4. Restore files
tar -xzf files_20231125.tar.gz

# 5. Start services
docker-compose up -d
```

#### **Point-in-Time Recovery**
```bash
# Restore to specific timestamp
docker exec accubooks-postgres pg_dump -U postgres AccuBooks --clean --if-exists | \
docker exec -i accubooks-postgres psql -U postgres AccuBooks
```

---

## 🏥 **HEALTH MONITORING**

### **System Health Checks**

#### **API Health**
```bash
# Basic health check
curl http://localhost:3001/api/health

# Detailed health check
curl http://localhost:3001/api/health/detailed

# Readiness check
curl http://localhost:3001/api/ready

# Liveness check
curl http://localhost:3001/api/live
```

#### **Database Health**
```bash
# Connection test
docker exec accubooks-postgres pg_isready -U postgres

# Database size
docker exec accubooks-postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('AccuBooks'));"

# Active connections
docker exec accubooks-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

#### **Redis Health**
```bash
# Ping test
docker exec accubooks-redis redis-cli ping

# Memory usage
docker exec accubooks-redis redis-cli INFO memory | grep used_memory_human
```

### **Monitoring Setup**

#### **Prometheus Metrics**
```bash
# Application metrics
curl http://localhost:3001/api/metrics

# System metrics (if node-exporter is running)
curl http://localhost:9100/metrics
```

#### **Log Monitoring**
```bash
# Application logs
docker logs accubooks-backend --tail 100 -f

# Database logs
docker logs accubooks-postgres --tail 100 -f

# Redis logs
docker logs accubooks-redis --tail 100 -f
```

### **Alert Configuration**

#### **Critical Alerts**
- Database connection failures
- Redis connection failures
- High memory usage (>80%)
- High CPU usage (>90%)
- Disk space low (<10%)

#### **Warning Alerts**
- Slow query times (>1s)
- High response times (>500ms)
- Cache hit rate low (<80%)

---

## 🔒 **SECURITY MANAGEMENT**

### **Authentication & Authorization**

#### **JWT Configuration**
```bash
# Generate new JWT secret
openssl rand -base64 64

# Update JWT settings in .env
JWT_SECRET="your-new-secret"
JWT_EXPIRES_IN="7d"
```

#### **Session Management**
```sql
-- View active sessions
SELECT rt.token, u.email, rt.expires_at
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.expires_at > NOW();

-- Revoke all sessions
DELETE FROM refresh_tokens;

-- Revoke user sessions
DELETE FROM refresh_tokens WHERE user_id = <user_id>;
```

### **Security Headers**

#### **Nginx Security Configuration**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### **SSL/TLS Configuration**

#### **Let's Encrypt Setup**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Access Control**

#### **IP Whitelisting**
```nginx
# Allow only specific IPs
location /admin {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
}
```

#### **Rate Limiting**
```nginx
# Rate limit API endpoints
location /api/ {
    limit_req zone=api burst=10 nodelay;
}
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **Database Connection Errors**
```bash
# Check database status
docker logs accubooks-postgres

# Test connection
docker exec accubooks-postgres pg_isready -U postgres

# Check network
docker network ls
docker network inspect accubooks_default
```

#### **Redis Connection Errors**
```bash
# Check Redis status
docker logs accubooks-redis

# Test connection
docker exec accubooks-redis redis-cli ping

# Check memory
docker exec accubooks-redis redis-cli INFO memory
```

#### **Application Startup Issues**
```bash
# Check application logs
docker logs accubooks-backend

# Check environment variables
docker exec accubooks-backend env | grep -E "(DATABASE|REDIS|JWT)"

# Restart services
docker-compose restart accubooks-backend
```

### **Performance Issues**

#### **Slow Database Queries**
```sql
-- Identify slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'transactions';
```

#### **High Memory Usage**
```bash
# Check memory usage
docker stats

# Optimize Redis memory
docker exec accubooks-redis redis-cli CONFIG SET maxmemory 256mb
docker exec accubooks-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### **Log Analysis**

#### **Error Pattern Detection**
```bash
# Find error patterns in logs
docker logs accubooks-backend 2>&1 | grep -i error | tail -20

# Find database errors
docker logs accubooks-postgres 2>&1 | grep -i error | tail -20

# Find Redis errors
docker logs accubooks-redis 2>&1 | grep -i error | tail -20
```

---

## 🔄 **MAINTENANCE PROCEDURES**

### **Daily Maintenance**

#### **Automated Tasks**
```bash
#!/bin/bash
# daily_maintenance.sh

# 1. Backup database
docker exec accubooks-postgres pg_dump -U postgres AccuBooks | gzip > /backups/daily_$(date +%Y%m%d).sql.gz

# 2. Clean old logs
find /var/log/accubooks -name "*.log" -mtime +7 -delete

# 3. Optimize database
docker exec accubooks-postgres psql -U postgres -c "VACUUM ANALYZE;"

# 4. Clear old sessions
docker exec accubooks-postgres psql -U postgres -c "DELETE FROM refresh_tokens WHERE expires_at < NOW();"

# 5. Check disk space
df -h | grep -E "(9[0-9]%|100%)" && echo "WARNING: Low disk space"
```

### **Weekly Maintenance**

#### **System Updates**
```bash
#!/bin/bash
# weekly_maintenance.sh

# 1. Update Docker images
docker-compose pull

# 2. Restart services
docker-compose up -d

# 3. Check for security updates
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image accubooks-backend:latest

# 4. Performance review
docker exec accubooks-postgres psql -U postgres -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"
```

### **Monthly Maintenance**

#### **Deep Maintenance**
```bash
#!/bin/bash
# monthly_maintenance.sh

# 1. Full database reindex
docker exec accubooks-postgres psql -U postgres -c "REINDEX DATABASE AccuBooks;"

# 2. Archive old data
docker exec accubooks-postgres psql -U postgres -c "
-- Archive transactions older than 3 years
CREATE TABLE transactions_archive AS 
SELECT * FROM transactions 
WHERE created_at < NOW() - INTERVAL '3 years';

DELETE FROM transactions 
WHERE created_at < NOW() - INTERVAL '3 years';
"

# 3. Update statistics
docker exec accubooks-postgres psql -U postgres -c "ANALYZE;"

# 4. Security audit
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL accubooks-backend:latest
```

---

## 🔌 **API ADMINISTRATION**

### **API Endpoints Overview**

#### **Authentication**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Current user info

#### **User Management**
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

#### **Company Management**
- `GET /api/v1/companies` - List companies
- `POST /api/v1/companies` - Create company
- `PUT /api/v1/companies/:id` - Update company
- `DELETE /api/v1/companies/:id` - Delete company

#### **Account Management**
- `GET /api/v1/accounts` - List accounts
- `POST /api/v1/accounts` - Create account
- `PUT /api/v1/accounts/:id` - Update account
- `POST /api/v1/accounts/:id/balance` - Adjust balance

#### **Transaction Management**
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get transaction
- `PUT /api/v1/transactions/:id` - Update transaction

### **API Authentication**

#### **Bearer Token**
```bash
# Get token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use token in requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/accounts
```

#### **API Key Authentication** (Future)
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3001/api/v1/accounts
```

### **API Rate Limiting**

#### **Default Limits**
- **Per IP**: 100 requests/minute
- **Per User**: 1000 requests/hour
- **Burst**: 10 requests

#### **Custom Rate Limits**
```javascript
// In backend configuration
const rateLimits = {
  'api/v1/auth/login': { requests: 5, window: '15m' },
  'api/v1/transactions': { requests: 200, window: '1h' },
  'api/v1/reports': { requests: 50, window: '1h' }
};
```

### **API Monitoring**

#### **Request Logging**
```sql
-- Create API logs table
CREATE TABLE api_logs (
  id SERIAL PRIMARY KEY,
  method VARCHAR(10),
  endpoint VARCHAR(255),
  status_code INTEGER,
  response_time INTEGER,
  user_id INTEGER,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- View API statistics
SELECT 
  endpoint,
  method,
  COUNT(*) as requests,
  AVG(response_time) as avg_response_time,
  MAX(response_time) as max_response_time
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, method
ORDER BY requests DESC;
```

---

## 📞 **SUPPORT & CONTACT**

### **Technical Support**
- **Email**: support@accubooks.com
- **Documentation**: https://docs.accubooks.com
- **Community**: https://community.accubooks.com

### **Emergency Contacts**
- **System Outage**: emergency@accubooks.com
- **Security Issues**: security@accubooks.com

### **System Requirements**
- **Minimum**: 2 CPU, 4GB RAM, 50GB Storage
- **Recommended**: 4 CPU, 8GB RAM, 100GB Storage
- **Enterprise**: 8+ CPU, 16GB+ RAM, 500GB+ Storage

---

## 📝 **CHANGE LOG**

### **Version 1.0.0** (2025-11-25)
- Initial release
- Multi-company support
- Complete accounting features
- User management system
- API documentation
- Docker deployment

---

**This manual covers all essential aspects of AccuBooks administration. For specific technical questions or advanced configurations, please contact the technical support team.**
