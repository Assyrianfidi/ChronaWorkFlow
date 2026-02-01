# 📊 PRODUCTION MONITORING & ALERTING IMPLEMENTATION

**Implementation Date**: February 1, 2026  
**System Version**: 1.0.1 (post-pool scaling)  
**Authority**: Production Engineering Lead  
**Phase**: 2 - Observability (MANDATORY before users)

---

## 🎯 OBJECTIVE

Enable comprehensive production monitoring and alerting BEFORE controlled beta launch to ensure full observability and rapid incident detection.

**Requirement**: No users may access the system until monitoring is verified operational.

---

## 📋 REQUIRED METRICS

### Category 1: API Performance

**Metrics to Track**:
1. **Request Latency** (p50, p75, p95, p99)
   - Target: p95 <500ms, p99 <1s
   - Alert: p95 >1s sustained 5 min
   
2. **Request Rate** (requests per second)
   - Normal: 100-500 RPS
   - Alert: >1000 RPS (potential attack)
   
3. **Error Rate** (% of requests)
   - Target: <0.1%
   - Alert: >0.5% sustained 5 min
   
4. **HTTP Status Codes** (200, 400, 401, 403, 500, 503)
   - Alert: 500 errors >10/min

**Implementation**:
```typescript
// server/middleware/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpErrorRate = new Gauge({
  name: 'http_error_rate',
  help: 'HTTP error rate (percentage)',
  labelNames: ['status_code']
});
```

---

### Category 2: Database Performance

**Metrics to Track**:
1. **Active Connections** (current count)
   - Normal: 20-60
   - Alert: >140 (70% of 200 max)
   
2. **Pool Utilization** (% of max connections)
   - Target: <70%
   - Alert: >80% sustained 5 min
   
3. **Connection Wait Time** (p95 latency)
   - Target: <10ms
   - Alert: >50ms sustained 5 min
   
4. **Query Latency** (p95)
   - Target: <200ms
   - Alert: >500ms sustained 5 min
   
5. **Connection Errors** (count)
   - Target: 0
   - Alert: >5/min

**Implementation**:
```typescript
// server/monitoring/database-metrics.ts
const dbActiveConnections = new Gauge({
  name: 'db_active_connections',
  help: 'Number of active database connections'
});

const dbPoolUtilization = new Gauge({
  name: 'db_pool_utilization_percent',
  help: 'Database connection pool utilization percentage'
});

const dbConnectionWaitTime = new Histogram({
  name: 'db_connection_wait_time_ms',
  help: 'Time waiting for database connection in ms',
  buckets: [1, 5, 10, 25, 50, 100, 250, 500]
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in ms',
  labelNames: ['query_type'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000]
});
```

---

### Category 3: Redis Cache Performance

**Metrics to Track**:
1. **Memory Usage** (bytes and %)
   - Current: 2GB allocated
   - Alert: >1.8GB (90% utilization)
   
2. **Cache Hit Rate** (%)
   - Target: >80%
   - Alert: <70% sustained 10 min
   
3. **Eviction Rate** (keys/sec)
   - Normal: <100/min
   - Alert: >500/min (thrashing)
   
4. **Cache Latency** (p95)
   - Target: <5ms
   - Alert: >20ms sustained 5 min

**Implementation**:
```typescript
// server/monitoring/cache-metrics.ts
const cacheMemoryUsage = new Gauge({
  name: 'cache_memory_usage_bytes',
  help: 'Redis cache memory usage in bytes'
});

const cacheHitRate = new Gauge({
  name: 'cache_hit_rate_percent',
  help: 'Cache hit rate percentage'
});

const cacheEvictionRate = new Gauge({
  name: 'cache_eviction_rate_per_sec',
  help: 'Cache eviction rate per second'
});
```

---

### Category 4: Forecast Queue Performance

**Metrics to Track**:
1. **Queue Depth** (jobs waiting)
   - Normal: 0-50
   - Alert: >200 sustained 10 min
   
2. **Worker Utilization** (%)
   - Normal: 50-80%
   - Alert: >95% sustained 10 min
   
3. **Job Processing Time** (p95)
   - Target: <10s
   - Alert: >30s sustained 5 min
   
4. **Job Failure Rate** (%)
   - Target: <1%
   - Alert: >5% sustained 5 min

**Implementation**:
```typescript
// server/monitoring/queue-metrics.ts
const queueDepth = new Gauge({
  name: 'forecast_queue_depth',
  help: 'Number of jobs waiting in forecast queue'
});

const queueWorkerUtilization = new Gauge({
  name: 'forecast_worker_utilization_percent',
  help: 'Forecast worker utilization percentage'
});

const queueJobDuration = new Histogram({
  name: 'forecast_job_duration_seconds',
  help: 'Forecast job processing duration in seconds',
  buckets: [1, 2, 5, 8, 10, 15, 20, 30, 60]
});
```

---

### Category 5: Business Metrics

**Metrics to Track**:
1. **Active Users** (concurrent)
   - Normal: 10-500
   - Alert: >5000 (capacity check)
   
2. **Forecasts Generated** (count)
   - Normal: 10-100/hour
   - Alert: >1000/hour (abuse check)
   
3. **Tier Limit Hits** (count by tier)
   - Monitor: FREE, STARTER, PRO
   - Alert: >50% users hitting limits
   
4. **Upgrade Conversions** (count)
   - Monitor: FREE → STARTER, STARTER → PRO
   
5. **Trust Layer Usage** (%)
   - Monitor: Calculation Explainer, Assumptions Panel, Confidence Indicator
   - Target: >60% usage

**Implementation**:
```typescript
// server/monitoring/business-metrics.ts
const activeUsers = new Gauge({
  name: 'active_users_concurrent',
  help: 'Number of concurrent active users'
});

const forecastsGenerated = new Counter({
  name: 'forecasts_generated_total',
  help: 'Total number of forecasts generated',
  labelNames: ['tier']
});

const tierLimitHits = new Counter({
  name: 'tier_limit_hits_total',
  help: 'Total number of tier limit hits',
  labelNames: ['tier', 'limit_type']
});
```

---

## 🚨 ALERT CONFIGURATION

### Critical Alerts (P0 - Immediate Response)

**Alert 1: High Error Rate**
- Condition: Error rate >1% sustained 5 min
- Severity: P0
- Notification: Phone + Slack + Email
- Response Time: <5 minutes

**Alert 2: Database Pool Exhaustion**
- Condition: Pool utilization >90% sustained 5 min
- Severity: P0
- Notification: Phone + Slack + Email
- Response Time: <5 minutes

**Alert 3: System Downtime**
- Condition: Health check fails 3 consecutive times
- Severity: P0
- Notification: Phone + Slack + Email
- Response Time: <5 minutes

**Alert 4: Data Integrity Issue**
- Condition: Calculation error detected OR tenant isolation violation
- Severity: P0
- Notification: Phone + Slack + Email + Escalation
- Response Time: IMMEDIATE

---

### High Priority Alerts (P1 - Urgent Response)

**Alert 5: High Latency**
- Condition: p95 latency >1s sustained 5 min
- Severity: P1
- Notification: Slack + Email
- Response Time: <15 minutes

**Alert 6: Queue Depth High**
- Condition: Queue depth >200 sustained 10 min
- Severity: P1
- Notification: Slack + Email
- Response Time: <30 minutes

**Alert 7: Cache Hit Rate Low**
- Condition: Cache hit rate <70% sustained 10 min
- Severity: P1
- Notification: Slack + Email
- Response Time: <30 minutes

---

### Warning Alerts (P2 - Monitor)

**Alert 8: Database Pool Warning**
- Condition: Pool utilization >70% sustained 10 min
- Severity: P2
- Notification: Slack
- Response Time: <1 hour

**Alert 9: Redis Memory Warning**
- Condition: Redis memory >85% sustained 10 min
- Severity: P2
- Notification: Slack
- Response Time: <1 hour

---

## 📈 DASHBOARD CONFIGURATION

### Dashboard 1: Executive Overview

**Purpose**: Real-time system health for executives

**Panels**:
1. **System Status** (Green/Yellow/Red indicator)
2. **Active Users** (current count)
3. **Error Rate** (last 1h, 24h)
4. **p95 Latency** (last 1h, 24h)
5. **Forecasts Generated** (last 1h, 24h)
6. **Tier Distribution** (pie chart)
7. **Recent Alerts** (last 10)

**Refresh**: 30 seconds  
**Access**: Public (read-only)

---

### Dashboard 2: Operations Dashboard

**Purpose**: Detailed metrics for on-call engineers

**Panels**:
1. **API Performance**
   - Request rate (RPS)
   - Latency percentiles (p50, p95, p99)
   - Error rate by status code
   
2. **Database Performance**
   - Active connections
   - Pool utilization
   - Query latency
   - Connection wait time
   
3. **Cache Performance**
   - Memory usage
   - Hit rate
   - Eviction rate
   
4. **Queue Performance**
   - Queue depth
   - Worker utilization
   - Job processing time
   
5. **System Resources**
   - CPU usage
   - Memory usage
   - Network I/O

**Refresh**: 10 seconds  
**Access**: Engineering team

---

### Dashboard 3: Business Metrics

**Purpose**: User behavior and conversion tracking

**Panels**:
1. **User Activity**
   - Active users (hourly, daily)
   - Logins (hourly, daily)
   - Session duration
   
2. **Feature Usage**
   - Scenarios created
   - Forecasts generated
   - Trust layer interactions
   
3. **Tier Metrics**
   - Users by tier
   - Limit hits by tier
   - Upgrade conversions
   
4. **Beta Metrics** (during beta phase)
   - Trust rate (% trusting forecasts)
   - Support tickets
   - NPS score

**Refresh**: 5 minutes  
**Access**: Product team + Business team

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Install Monitoring Stack

**Option A: Prometheus + Grafana** (Recommended)

```bash
# Install Prometheus
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Install Grafana
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana

# Configure Prometheus to scrape AccuBooks metrics
# Edit prometheus.yml:
scrape_configs:
  - job_name: 'accubooks'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

**Option B: DataDog / New Relic** (Commercial)

```bash
# Install DataDog agent
DD_API_KEY=<your_key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure AccuBooks to send metrics
# Add to server/config/monitoring.ts:
import { StatsD } from 'node-dogstatsd';
const dogstatsd = new StatsD();
```

---

### Step 2: Add Metrics Endpoints

**Create metrics endpoint**:

```typescript
// server/routes/metrics.ts
import express from 'express';
import { register } from 'prom-client';

const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await checkDatabaseHealth(),
    cache: await checkCacheHealth(),
    queue: await checkQueueHealth()
  };
  res.json(health);
});

export default router;
```

---

### Step 3: Configure Alerts

**Create alert rules** (Prometheus AlertManager):

```yaml
# alerts.yml
groups:
  - name: accubooks_critical
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"
      
      - alert: DatabasePoolExhaustion
        expr: db_pool_utilization_percent > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database pool near exhaustion"
          description: "Pool utilization is {{ $value }}%"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_ms) > 1000
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High API latency detected"
          description: "p95 latency is {{ $value }}ms"
```

---

### Step 4: Create Dashboards

**Import Grafana dashboards**:

```bash
# Import pre-built dashboard JSON
curl -X POST http://localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @launch/dashboards/executive_overview.json

curl -X POST http://localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @launch/dashboards/operations.json
```

**Dashboard JSON templates**: See `launch/dashboards/` directory

---

### Step 5: Test Alerting

**Trigger test alerts**:

```bash
# Test high error rate alert
curl -X POST http://localhost:3000/api/test/trigger-errors \
  -d '{"count": 100, "duration": "5m"}'

# Verify alert fires
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.alertname=="HighErrorRate")'

# Test alert notification delivery
# Check Slack, email, phone
```

**Expected**: Alert fires within 5 minutes, notifications delivered

---

## ✅ VERIFICATION CHECKLIST

**Before proceeding to Phase 3 (Controlled Beta), verify ALL**:

- [ ] Prometheus scraping metrics from AccuBooks (15s interval)
- [ ] All required metrics visible in Prometheus
- [ ] Grafana dashboards created and accessible
- [ ] Executive dashboard shows real-time data
- [ ] Operations dashboard shows detailed metrics
- [ ] All critical alerts configured (P0)
- [ ] All high priority alerts configured (P1)
- [ ] Test alert successfully triggered and delivered
- [ ] Alert notification channels working (Slack, email, phone)
- [ ] On-call engineer has dashboard access
- [ ] Metrics retention configured (30 days minimum)
- [ ] Backup monitoring configured (redundant alerting)

**DO NOT PROCEED** to Phase 3 if any item unchecked.

---

## 📊 POST-IMPLEMENTATION VERIFICATION

**Template** (Complete after implementation):

```markdown
# Monitoring Setup Verification Report

**Implementation Date**: [TIMESTAMP]
**Operator**: [NAME]

## Metrics Verification
- [ ] API performance metrics visible
- [ ] Database performance metrics visible
- [ ] Cache performance metrics visible
- [ ] Queue performance metrics visible
- [ ] Business metrics visible

## Dashboard Verification
- [ ] Executive dashboard accessible
- [ ] Operations dashboard accessible
- [ ] Business metrics dashboard accessible
- [ ] All panels showing data
- [ ] Refresh rates working

## Alert Verification
- [ ] Critical alerts configured (P0)
- [ ] High priority alerts configured (P1)
- [ ] Warning alerts configured (P2)
- [ ] Test alert triggered successfully
- [ ] Notifications delivered (Slack, email, phone)

## Decision
- [ ] SUCCESS - Proceed to Phase 3 (Controlled Beta)
- [ ] INCOMPLETE - Fix issues and retry

**Signature**: [NAME]
**Timestamp**: [TIMESTAMP]
```

**Evidence Location**: `launch/evidence/monitoring_setup_verification_[TIMESTAMP].md`

---

**End of Monitoring Setup Implementation Guide**

**Status**: READY FOR EXECUTION  
**Authority**: Production Engineering Lead  
**Next Phase**: Phase 3 - Controlled Beta Launch (after successful monitoring setup)
