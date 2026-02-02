# AccuBooks Troubleshooting Guide

## Quick Diagnosis

### Is the server running?

```bash
# Check if process is running
ps aux | grep "tsx server/index.ts" | grep -v grep

# Check if port is listening
lsof -i :5000

# Quick health check
curl http://localhost:5000/api/monitoring/health
```

### What's the server status?

```bash
# Comprehensive health check
curl http://localhost:5000/api/monitoring/health | jq .

# Check specific dependency
curl http://localhost:5000/api/monitoring/health | jq '.dependencies'

# Check if degraded
curl http://localhost:5000/api/monitoring/health | jq '.status'
# Returns: "healthy", "degraded", or "unhealthy"
```

---

## Common Issues

### 1. Server Won't Start

#### Symptom
```bash
$ npm run start:dev
# Process exits immediately or hangs
```

#### Diagnosis
```bash
# Check backend log
tail -n 50 backend.log

# Look for specific errors
grep -i "error\|fatal\|exception" backend.log
```

#### Common Causes & Solutions

**A. Port Already in Use**
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
export PORT=5001
npm run start:dev
```

**B. Missing Environment Variables**
```
❌ Missing required environment variables:
   - DATABASE_URL
   - JWT_SECRET
```
**Solution:**
```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env

# Verify required vars
grep -E "DATABASE_URL|JWT_SECRET|SESSION_SECRET" .env
```

**C. Database Connection Failed**
```
⚠️  Database connection failed: connect ECONNREFUSED
```
**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac

# Verify DATABASE_URL
echo $DATABASE_URL
```

**Note:** Server will start in degraded mode if DB unavailable. This is expected behavior.

---

### 2. Database Issues

#### Symptom
```json
{
  "status": "degraded",
  "dependencies": {
    "database": {
      "status": "unavailable"
    }
  }
}
```

#### Diagnosis
```bash
# Test database connection directly
psql $DATABASE_URL -c "SELECT 1"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Solutions

**A. Wrong DATABASE_URL**
```bash
# Correct format
DATABASE_URL=postgresql://username:password@host:port/database

# Example
DATABASE_URL=postgresql://postgres:password@localhost:5432/accubooks
```

**B. Database Not Running**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Enable auto-start
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

**C. Connection Limit Reached**
```bash
# Check current connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Increase max connections (postgresql.conf)
max_connections = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**D. Authentication Failed**
```bash
# Reset password
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'newpassword';

# Update .env
DATABASE_URL=postgresql://postgres:newpassword@localhost:5432/accubooks
```

---

### 3. Redis Issues

#### Symptom
```json
{
  "dependencies": {
    "redis": {
      "status": "unavailable"
    },
    "jobQueues": {
      "status": "degraded"
    }
  }
}
```

#### Diagnosis
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis status
sudo systemctl status redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### Solutions

**A. Redis Not Running**
```bash
# Start Redis
sudo systemctl start redis

# Enable auto-start
sudo systemctl enable redis

# Verify
redis-cli ping
```

**B. Wrong Redis Configuration**
```bash
# Check .env
echo $REDIS_HOST
echo $REDIS_PORT

# Should be:
REDIS_HOST=localhost
REDIS_PORT=6379
```

**C. Redis Connection Refused (WSL)**
```bash
# Redis running on Windows but not accessible from WSL
# Solution: Start Redis in WSL
sudo apt-get install redis-server
sudo systemctl start redis
```

**Note:** Server continues without Redis. Job queues will be disabled but API works.

---

### 4. Memory Issues

#### Symptom
```bash
# High memory usage in metrics
curl http://localhost:5000/api/monitoring/health | jq '.resources.memory'
```

#### Diagnosis
```bash
# Check Node.js memory
node --max-old-space-size=4096 server/index.ts

# Monitor memory over time
watch -n 5 'curl -s http://localhost:5000/api/monitoring/health | jq ".resources.memory"'
```

#### Solutions

**A. Increase Memory Limit**
```bash
# Set in .env or command line
NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json
"start": "node --max-old-space-size=4096 dist/server/index.js"
```

**B. Memory Leak**
```bash
# Take heap snapshot
node --inspect server/index.ts

# Use Chrome DevTools to analyze
# chrome://inspect
```

**C. Database Connection Pool**
```typescript
// Reduce pool size in config/database-pool.ts
{
  min: 1,
  max: 10,  // Reduced from 20
  idleTimeoutMillis: 30000
}
```

---

### 5. Slow Requests

#### Symptom
```
[WARN] slow_request: GET /api/invoices took 2500ms
```

#### Diagnosis
```bash
# Check slow request threshold
echo $SLOW_REQUEST_MS  # Default: 1500

# Monitor request times
grep "slow_request" backend.log | tail -n 20
```

#### Solutions

**A. Database Query Optimization**
```sql
-- Add indexes
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM invoices WHERE company_id = '...';
```

**B. N+1 Query Problem**
```typescript
// Bad: N+1 queries
for (const invoice of invoices) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, invoice.customerId)
  });
}

// Good: Single query with join
const invoices = await db.query.invoices.findMany({
  with: {
    customer: true
  }
});
```

**C. Add Caching**
```typescript
// Cache frequently accessed data
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({ max: 500 });

async function getCompany(id: string) {
  const cached = cache.get(id);
  if (cached) return cached;
  
  const company = await db.query.companies.findFirst(...);
  cache.set(id, company);
  return company;
}
```

---

### 6. Deployment Failures

#### Symptom
```bash
$ sudo ./deploy_all.sh
✗ Backend failed to start within 60 seconds
```

#### Diagnosis
```bash
# Check deployment log
cat launch/evidence/phase2_monitoring/deployment/deployment.log

# Check backend log
tail -n 50 backend.log

# Check if process is running
ps aux | grep node
```

#### Solutions

**A. Dependencies Not Installed**
```bash
# Install dependencies manually
cd /path/to/AccuBooks
npm install

# Verify node_modules exists
ls -la node_modules
```

**B. TypeScript Compilation Errors**
```bash
# Check for TypeScript errors
npm run type-check

# Build manually
npm run build
```

**C. Permission Issues**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod +x launch/evidence/phase2_monitoring/deployment/*.sh
```

**D. WSL Path Issues**
```bash
# Verify project root
echo $PROJECT_ROOT

# Should be: /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks
# Not: C:/FidiMyProjects2025/...
```

---

### 7. Health Check Returns 503

#### Symptom
```bash
$ curl http://localhost:5000/api/monitoring/health
HTTP/1.1 503 Service Unavailable
```

#### Diagnosis
```bash
# Check response body
curl -i http://localhost:5000/api/monitoring/health

# Check which dependency is down
curl http://localhost:5000/api/monitoring/health | jq '.dependencies'
```

#### Solutions

**A. All Dependencies Down**
```json
{
  "status": "unhealthy",
  "dependencies": {
    "database": { "status": "unavailable" },
    "redis": { "status": "unavailable" }
  }
}
```
**Solution:** Fix database and Redis (see sections above)

**B. Server Still Initializing**
```bash
# Wait for initialization
sleep 10
curl http://localhost:5000/api/monitoring/ready
```

**C. Server Crashed**
```bash
# Check if process is running
ps aux | grep node

# Restart server
npm run start:dev
```

---

### 8. API Routes Return 503

#### Symptom
```bash
$ curl http://localhost:5000/api/companies
HTTP/1.1 503 Service Unavailable
{
  "error": "Service Unavailable",
  "message": "Database is temporarily unavailable"
}
```

#### Diagnosis
```bash
# This is expected when database is down
# Check database status
curl http://localhost:5000/api/monitoring/health | jq '.dependencies.database'
```

#### Solution
Fix database connection (see Database Issues section)

**Note:** This is graceful degradation working correctly. Server returns proper error instead of crashing.

---

### 9. Unhandled Rejection Warnings

#### Symptom
```
❌ UNHANDLED REJECTION: Error: ...
⚠️  Server continuing despite unhandled rejection
```

#### Diagnosis
```bash
# Check logs for pattern
grep "UNHANDLED REJECTION" backend.log

# Identify source
grep -B 5 "UNHANDLED REJECTION" backend.log
```

#### Solutions

**A. In Development**
```bash
# Server exits to help debugging
# Fix the underlying promise rejection
```

**B. In Production**
```bash
# Server continues running (expected)
# But you should still fix the root cause
# Check logs and fix the promise rejection
```

**C. Common Causes**
```typescript
// Missing await
async function example() {
  doSomethingAsync();  // ❌ Missing await
  // Should be:
  await doSomethingAsync();  // ✅
}

// Missing catch
promise.then(result => {
  // handle result
});  // ❌ Missing .catch()

// Should be:
promise
  .then(result => { /* handle */ })
  .catch(error => { /* handle error */ });  // ✅
```

---

## Debugging Tools

### Log Analysis

```bash
# Real-time log monitoring
tail -f backend.log

# Filter errors
grep -i error backend.log

# Filter warnings
grep -i warn backend.log

# Count errors by type
grep -i error backend.log | cut -d':' -f1 | sort | uniq -c

# Show errors from last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" backend.log | grep -i error
```

### Health Monitoring

```bash
# Continuous health check
watch -n 5 'curl -s http://localhost:5000/api/monitoring/health | jq .'

# Check specific dependency
watch -n 5 'curl -s http://localhost:5000/api/monitoring/health | jq .dependencies.database'

# Monitor memory
watch -n 5 'curl -s http://localhost:5000/api/monitoring/health | jq .resources.memory'
```

### Process Monitoring

```bash
# Find Node.js processes
ps aux | grep node

# Monitor CPU and memory
top -p $(pgrep -f "tsx server/index.ts")

# Check open files
lsof -p $(pgrep -f "tsx server/index.ts")

# Check network connections
netstat -anp | grep $(pgrep -f "tsx server/index.ts")
```

---

## Emergency Procedures

### Server Completely Unresponsive

```bash
# 1. Kill all Node processes
pkill -9 node

# 2. Clear any stale PID files
rm -f backend.pid

# 3. Check for port conflicts
lsof -i :5000

# 4. Restart server
npm run start:dev

# 5. Monitor startup
tail -f backend.log
```

### Database Corruption

```bash
# 1. Stop server
pkill node

# 2. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Check database integrity
psql $DATABASE_URL -c "VACUUM ANALYZE"

# 4. Restart server
npm run start:dev
```

### Out of Memory

```bash
# 1. Identify memory hog
ps aux --sort=-%mem | head -n 10

# 2. Restart server with more memory
NODE_OPTIONS="--max-old-space-size=8192" npm run start:dev

# 3. Monitor memory
watch -n 5 'curl -s http://localhost:5000/api/monitoring/health | jq .resources.memory'
```

---

## Getting Help

### Information to Collect

Before asking for help, collect:

1. **System Info**
   ```bash
   node --version
   npm --version
   uname -a
   ```

2. **Environment**
   ```bash
   echo $NODE_ENV
   echo $DATABASE_URL | sed 's/:[^@]*@/:***@/'  # Hide password
   ```

3. **Logs**
   ```bash
   tail -n 100 backend.log > issue_logs.txt
   ```

4. **Health Status**
   ```bash
   curl http://localhost:5000/api/monitoring/health > health_status.json
   ```

5. **Error Messages**
   ```bash
   grep -i error backend.log | tail -n 20 > errors.txt
   ```

### Support Channels

1. Check this troubleshooting guide
2. Review PRODUCTION_READINESS.md
3. Search logs for similar errors
4. Contact DevOps team with collected information

---

**Last Updated:** February 2, 2026  
**Version:** 1.0.0
