# AccuBooks Production Readiness Guide

## Overview

AccuBooks has been hardened for production deployment with comprehensive resilience, observability, and graceful degradation capabilities. This document outlines the production-ready features and operational guidelines.

## ✅ Production-Ready Features

### 1. Graceful Degradation

The system can start and operate with degraded functionality when external dependencies are unavailable:

| Dependency | Impact When Unavailable | Server Behavior |
|------------|------------------------|-----------------|
| **PostgreSQL** | Database-dependent routes return 503 | ✅ Server starts, monitoring works |
| **Redis** | Background job queues disabled | ✅ Server starts, API works |
| **Stripe** | Payment processing unavailable | ✅ Server starts, other features work |
| **Plaid** | Bank integration unavailable | ✅ Server starts, other features work |

**Key Principle:** No single external dependency can crash the entire server.

### 2. Comprehensive Health Checks

#### Endpoints

- **`/api/monitoring/health`** - Detailed system status
  - Returns: `healthy`, `degraded`, or `unhealthy`
  - Includes: Database, Redis, job queues, memory, CPU, uptime
  - Status codes: 200 (healthy/degraded), 503 (unhealthy)

- **`/api/monitoring/live`** - Liveness probe
  - For Kubernetes/Docker health checks
  - Returns 200 if process is running

- **`/api/monitoring/ready`** - Readiness probe
  - For load balancer traffic routing
  - Returns 200 if server initialized, 503 if still starting

- **`/api/monitoring/metrics`** - Prometheus metrics
  - Metrics: uptime, memory, database/redis status
  - Format: Prometheus text format

#### Example Health Response

```json
{
  "status": "healthy",
  "service": "accubooks",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-02-02T20:00:00.000Z",
  "uptime": 3600,
  "dependencies": {
    "database": {
      "status": "connected",
      "initialized": true
    },
    "redis": {
      "status": "connected",
      "initialized": true
    },
    "jobQueues": {
      "status": "healthy",
      "queues": {
        "recurring-invoices": true,
        "payroll-processing": true,
        "report-generation": true
      }
    }
  },
  "resources": {
    "memory": {
      "used": 256,
      "total": 512,
      "unit": "MB"
    }
  }
}
```

### 3. Error Handling

#### Database Errors
- **Middleware:** `database-guard.ts`
- **Behavior:** Returns 503 with clear error message
- **Errors Caught:** ECONNREFUSED, ETIMEDOUT, connection terminated
- **No Crashes:** Database failures never crash the server

#### Unhandled Rejections
- **Production:** Logs error, continues running
- **Development:** Exits for debugging
- **Logging:** Full stack trace and context

#### Uncaught Exceptions
- **Production:** Attempts graceful shutdown
- **Development:** Exits immediately
- **Logging:** Error details and shutdown status

### 4. Database Connection Management

#### Lazy Initialization
```typescript
// Database initialized explicitly, not at module load
await initializeDatabase();
```

#### Connection Timeout
- **Timeout:** 5 seconds
- **Behavior:** Logs warning, continues without DB
- **Retry:** Manual retry via health check

#### Proxy Pattern
```typescript
// Throws clear error when DB unavailable
const result = await db.query(...);
// Error: "Database unavailable. Server running in degraded mode."
```

### 5. Monitoring & Alerting

#### Prometheus Integration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'accubooks'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/api/monitoring/metrics'
    scrape_interval: 15s
```

#### Key Metrics

- `accubooks_up` - Server running (1/0)
- `accubooks_database_available` - Database connected (1/0)
- `accubooks_redis_available` - Redis connected (1/0)
- `accubooks_uptime_seconds` - Server uptime
- `accubooks_memory_used_bytes` - Memory usage
- `accubooks_memory_total_bytes` - Memory allocated

#### Alert Rules

```yaml
# Example alert for database unavailability
- alert: DatabaseUnavailable
  expr: accubooks_database_available == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "AccuBooks database unavailable"
    description: "Database has been unavailable for 5 minutes"
```

## 🚀 Deployment

### Prerequisites

- **Node.js:** v20.20.0 or higher
- **npm:** 10.8.2 or higher
- **PostgreSQL:** 14+ (can be unavailable at startup)
- **Redis:** 6+ (optional, for background jobs)

### Environment Variables

#### Required
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<32+ character secret>
SESSION_SECRET=<32+ character secret>
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
PORT=5000
HOSTNAME=0.0.0.0
```

#### Optional (with safe defaults)
```bash
REDIS_HOST=localhost          # default: localhost
REDIS_PORT=6379               # default: 6379
REDIS_PASSWORD=               # default: empty
SLOW_REQUEST_MS=1500          # default: 1500
```

### Deployment Script

```bash
cd /path/to/AccuBooks/launch/evidence/phase2_monitoring/deployment
sudo ./deploy_all.sh
```

**Features:**
- ✅ Idempotent (safe to re-run)
- ✅ 60-second startup timeout
- ✅ Accepts degraded mode as success
- ✅ Shows dependency status
- ✅ Displays last 20 log lines on failure
- ✅ Progress updates every 10 seconds

### Manual Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build (if needed)
npm run build

# 3. Start server
npm run start:dev  # development
npm run start      # production

# 4. Verify health
curl http://localhost:5000/api/monitoring/health
```

## 🔍 Monitoring in Production

### Health Check Monitoring

```bash
# Check overall health
curl http://localhost:5000/api/monitoring/health | jq .

# Check specific dependency
curl http://localhost:5000/api/monitoring/health | jq '.dependencies.database'

# Liveness probe (K8s)
curl http://localhost:5000/api/monitoring/live

# Readiness probe (load balancer)
curl http://localhost:5000/api/monitoring/ready
```

### Log Monitoring

```bash
# Backend logs
tail -f backend.log

# Filter for errors
grep -i error backend.log

# Filter for warnings
grep -i warning backend.log

# Check for degraded mode
grep -i degraded backend.log
```

### Prometheus Queries

```promql
# Server uptime
accubooks_uptime_seconds

# Database availability over time
avg_over_time(accubooks_database_available[5m])

# Memory usage percentage
(accubooks_memory_used_bytes / accubooks_memory_total_bytes) * 100

# Alert if database down for 5 minutes
accubooks_database_available == 0
```

## 🛠️ Troubleshooting

### Server Won't Start

1. **Check port availability**
   ```bash
   lsof -i :5000
   # If occupied, kill process or change PORT env var
   ```

2. **Check environment variables**
   ```bash
   # Missing required vars will prevent startup
   cat .env | grep -E "DATABASE_URL|JWT_SECRET|SESSION_SECRET"
   ```

3. **Check logs**
   ```bash
   tail -n 50 backend.log
   ```

### Database Connection Issues

**Symptom:** Health check shows `"database": "unavailable"`

**Solutions:**
1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Check network connectivity
4. Verify credentials

**Server Behavior:** Continues running, returns 503 for DB routes

### Redis Connection Issues

**Symptom:** Health check shows `"redis": "unavailable"`

**Solutions:**
1. Check REDIS_HOST and REDIS_PORT
2. Verify Redis is running
3. Check network connectivity

**Server Behavior:** Continues running, job queues disabled

### Memory Issues

**Symptom:** High memory usage in metrics

**Solutions:**
1. Check for memory leaks in logs
2. Restart server if memory continues growing
3. Increase available memory
4. Review database query efficiency

### Slow Requests

**Symptom:** Warnings in logs about slow requests

**Solutions:**
1. Check database query performance
2. Review N+1 query patterns
3. Add database indexes
4. Implement caching
5. Adjust SLOW_REQUEST_MS threshold

## 📊 Production Checklist

### Before Deployment

- [ ] Environment variables configured
- [ ] DATABASE_URL points to production database
- [ ] JWT_SECRET and SESSION_SECRET are strong (32+ chars)
- [ ] FRONTEND_URL uses HTTPS
- [ ] NODE_ENV=production
- [ ] Prometheus configured to scrape metrics
- [ ] Alerting rules configured
- [ ] Log aggregation configured

### After Deployment

- [ ] Health check returns 200
- [ ] All dependencies show "connected"
- [ ] Prometheus scraping successfully
- [ ] Alerts configured and firing (test)
- [ ] Logs flowing to aggregation system
- [ ] Database queries performing well
- [ ] Memory usage stable
- [ ] No errors in logs

### Ongoing Monitoring

- [ ] Daily health check review
- [ ] Weekly log analysis
- [ ] Monthly performance review
- [ ] Quarterly dependency updates
- [ ] Continuous alert monitoring

## 🔐 Security Considerations

1. **Secrets Management**
   - Never commit .env files
   - Use secret management systems (Vault, AWS Secrets Manager)
   - Rotate secrets regularly

2. **Database Security**
   - Use SSL/TLS for database connections
   - Implement connection pooling limits
   - Regular security patches

3. **API Security**
   - Rate limiting enabled
   - Authentication required for API routes
   - CORS configured properly

4. **Monitoring Security**
   - Metrics endpoint accessible only internally
   - Health checks don't expose sensitive data
   - Logs sanitized of secrets

## 📈 Performance Tuning

### Database Connection Pool

```typescript
// server/config/database-pool.ts
{
  min: 2,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

### Redis Configuration

```bash
# Recommended for production
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
```

### Node.js Optimization

```bash
# Increase memory limit if needed
NODE_OPTIONS="--max-old-space-size=4096"

# Enable production optimizations
NODE_ENV=production
```

## 🆘 Emergency Procedures

### Server Crash Recovery

1. Check last 100 lines of logs
2. Identify crash cause
3. Fix issue or apply workaround
4. Restart server
5. Verify health checks pass
6. Monitor for 15 minutes

### Database Failure

1. Server continues in degraded mode
2. Fix database issue
3. Health check will auto-recover
4. No server restart needed

### Redis Failure

1. Server continues without job queues
2. Fix Redis issue
3. Restart server to re-enable queues
4. Or wait for auto-reconnect (if implemented)

## 📞 Support

For production issues:
1. Check this guide
2. Review TROUBLESHOOTING.md
3. Check logs and metrics
4. Contact DevOps team

---

**Last Updated:** February 2, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready ✅
