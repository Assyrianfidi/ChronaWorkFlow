# 🚨 OPERATIONAL RUNBOOK

**Date**: January 31, 2026  
**Version**: 1.0.0  
**Purpose**: Incident response, rollback procedures, disaster recovery

---

## 📋 Table of Contents

1. [Incident Response](#incident-response)
2. [Rollback Procedures](#rollback-procedures)
3. [Disaster Recovery](#disaster-recovery)
4. [Support Escalation](#support-escalation)
5. [Common Issues](#common-issues)

---

## 🚨 1. Incident Response

### Incident Classification

**P0 - Critical** (Response: Immediate)
- System completely down
- Data loss or corruption
- Security breach
- Payment processing failure

**P1 - High** (Response: <1 hour)
- Major feature unavailable
- Performance severely degraded
- Authentication failures
- Database connection issues

**P2 - Medium** (Response: <4 hours)
- Minor feature unavailable
- Intermittent errors
- Slow performance
- Non-critical bugs

**P3 - Low** (Response: <24 hours)
- Cosmetic issues
- Documentation errors
- Feature requests

### Incident Response Process

#### Step 1: Detection
- Monitor health endpoints: `/api/health`, `/api/health/db`, `/api/health/redis`
- Check error logs for spikes
- Review performance metrics (API latency, error rate)
- User reports via support channels

#### Step 2: Assessment
```bash
# Check system health
curl https://accubooks.com/api/health/all

# Check recent errors
tail -n 100 /var/log/accubooks/error.log | grep CRITICAL

# Check database connections
psql -h db-host -U accubooks -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis
redis-cli ping
redis-cli info stats
```

#### Step 3: Communication
- Update status page immediately
- Notify affected customers (if P0/P1)
- Post in internal Slack channel
- Assign incident commander

#### Step 4: Mitigation
- Apply immediate fixes (see [Common Issues](#common-issues))
- Enable graceful degradation if applicable
- Scale resources if needed
- Implement workarounds

#### Step 5: Resolution
- Deploy fix
- Verify resolution
- Monitor for 30 minutes
- Update status page

#### Step 6: Post-Mortem
- Document root cause
- List contributing factors
- Action items to prevent recurrence
- Share learnings with team

---

## 🔄 2. Rollback Procedures

### Git-Based Rollback

**When to Rollback**:
- New deployment causes critical errors
- Performance severely degraded
- Data integrity issues
- Security vulnerability introduced

**Rollback Steps**:

```bash
# 1. Identify last known good commit
git log --oneline -10

# 2. Create rollback branch
git checkout -b rollback-$(date +%Y%m%d-%H%M%S) <last-good-commit>

# 3. Deploy rollback
git push origin rollback-$(date +%Y%m%d-%H%M%S)

# 4. Trigger deployment
# (via CI/CD pipeline or manual deployment)

# 5. Verify rollback
curl https://accubooks.com/api/health/all
```

### Database Rollback

**When to Rollback**:
- Migration causes data corruption
- Schema change breaks application
- Performance regression from index changes

**Rollback Steps**:

```bash
# 1. Check migration history
npx prisma migrate status

# 2. Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# 3. Apply previous schema
npx prisma migrate deploy

# 4. Verify database state
psql -h db-host -U accubooks -c "\dt"
```

**CRITICAL**: Always test rollback in staging first

### Feature Flag Rollback

**When to Rollback**:
- New feature causes errors
- Performance impact too high
- User complaints spike

**Rollback Steps**:

```typescript
// 1. Disable feature flag
import { getFeatureFlags } from '@/shared/featureFlags/FeatureFlagService';

const flags = getFeatureFlags();
flags.override('feature.new_dashboard', false);

// 2. Verify flag disabled
console.log(flags.isEnabled('feature.new_dashboard')); // false

// 3. Monitor for 15 minutes
// 4. Permanent disable if needed (update DEFAULT_FEATURE_FLAGS)
```

**Advantage**: Instant rollback without deployment

---

## 💾 3. Disaster Recovery

### Recovery Time Objective (RTO)

**Target**: 4 hours (time to restore service)

### Recovery Point Objective (RPO)

**Target**: 1 hour (acceptable data loss)

### Backup Strategy

**Database Backups**:
- Frequency: Daily at 2 AM UTC
- Retention: 30 days
- Type: Full backup + point-in-time recovery
- Location: AWS S3 (or equivalent)
- Encryption: AES-256

**Redis Backups**:
- Frequency: Hourly snapshots
- Retention: 7 days
- Type: RDB snapshots
- Location: AWS S3 (or equivalent)

**Application Backups**:
- Frequency: On every deployment
- Retention: Last 10 deployments
- Type: Docker images + Git tags
- Location: Container registry

### Disaster Scenarios

#### Scenario 1: Database Failure

**Symptoms**:
- All API requests failing with 500 errors
- Health check `/api/health/db` returns unhealthy
- Database connection timeouts

**Recovery Steps**:

```bash
# 1. Verify database is down
psql -h db-host -U accubooks -c "SELECT 1;"

# 2. Check RDS/database service status
aws rds describe-db-instances --db-instance-identifier accubooks-prod

# 3. If database corrupted, restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier accubooks-prod-restored \
  --db-snapshot-identifier accubooks-prod-snapshot-latest

# 4. Update connection string
export DATABASE_URL="postgresql://user:pass@new-host:5432/accubooks"

# 5. Restart application
docker-compose restart backend

# 6. Verify recovery
curl https://accubooks.com/api/health/db
```

**Estimated Recovery Time**: 2-3 hours

#### Scenario 2: Redis Failure

**Symptoms**:
- Rate limiting failing open (or closed)
- Caching not working
- Session management issues

**Recovery Steps**:

```bash
# 1. Verify Redis is down
redis-cli -h redis-host ping

# 2. Check ElastiCache/Redis service status
aws elasticache describe-cache-clusters --cache-cluster-id accubooks-prod

# 3. If Redis corrupted, restore from snapshot
aws elasticache create-cache-cluster \
  --cache-cluster-id accubooks-prod-restored \
  --snapshot-name accubooks-prod-snapshot-latest

# 4. Update connection string
export REDIS_URL="redis://new-host:6379"

# 5. Restart application
docker-compose restart backend

# 6. Verify recovery
redis-cli -h new-host ping
```

**Estimated Recovery Time**: 1-2 hours

**Note**: Application degrades gracefully without Redis (rate limiting fails open, caching disabled)

#### Scenario 3: Complete Infrastructure Failure

**Symptoms**:
- Entire region down
- All services unavailable
- DNS not resolving

**Recovery Steps**:

```bash
# 1. Activate DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://failover.json

# 2. Restore database in DR region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier accubooks-dr \
  --db-snapshot-identifier accubooks-prod-snapshot-latest \
  --availability-zone us-west-2a

# 3. Deploy application in DR region
docker-compose -f docker-compose.dr.yml up -d

# 4. Update DNS to point to DR region
# (via Route53 or equivalent)

# 5. Verify recovery
curl https://accubooks.com/api/health/all
```

**Estimated Recovery Time**: 4-6 hours

**Prerequisites**:
- DR region pre-configured
- Database snapshots replicated to DR region
- Docker images available in DR region
- DNS failover configured

---

## 📞 4. Support Escalation

### Escalation Path

**Level 1: Support Team**
- Handle common issues
- Provide workarounds
- Escalate if unresolved in 1 hour

**Level 2: Engineering Team**
- Debug complex issues
- Deploy hotfixes
- Escalate if critical or unresolved in 4 hours

**Level 3: Senior Engineering / CTO**
- Critical incidents only
- Architecture decisions
- Customer communication

### Contact Information

**Support Team**:
- Email: support@accubooks.com
- Slack: #support
- On-call: PagerDuty rotation

**Engineering Team**:
- Email: engineering@accubooks.com
- Slack: #engineering
- On-call: PagerDuty rotation

**Senior Engineering**:
- Email: cto@accubooks.com
- Phone: [REDACTED]
- Slack: @cto

### Escalation Triggers

**Immediate Escalation to Level 2**:
- P0 incidents
- Data loss or corruption
- Security incidents
- Multiple customer reports

**Immediate Escalation to Level 3**:
- Data breach
- Complete system outage >1 hour
- Legal/compliance issues
- Major customer impact (>100 users)

---

## 🔧 5. Common Issues

### Issue 1: High API Latency

**Symptoms**:
- API responses >2s
- User complaints about slowness
- Performance monitoring alerts

**Diagnosis**:
```bash
# Check API latency
curl -w "@curl-format.txt" -o /dev/null -s https://accubooks.com/api/scenarios

# Check database slow queries
psql -h db-host -U accubooks -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check Redis latency
redis-cli --latency
```

**Resolution**:
1. Check for N+1 queries (should be eliminated in STEP 5)
2. Verify caching is working
3. Check database connection pool
4. Scale database if needed
5. Enable query caching

### Issue 2: Rate Limit Errors (429)

**Symptoms**:
- Users receiving 429 errors
- Legitimate traffic being blocked

**Diagnosis**:
```bash
# Check rate limit counters
redis-cli keys "ratelimit:*"
redis-cli get "ratelimit:api:ip:192.168.1.1"
```

**Resolution**:
1. Verify user is not abusing API
2. Increase rate limits if legitimate traffic
3. Whitelist IP if needed
4. Check for DDoS attack

### Issue 3: Authentication Failures

**Symptoms**:
- Users cannot log in
- JWT validation errors
- 401 Unauthorized errors

**Diagnosis**:
```bash
# Check JWT secret
echo $JWT_SECRET | wc -c  # Should be >32 characters

# Check token expiration
# Decode JWT at jwt.io

# Check database users table
psql -h db-host -U accubooks -c "SELECT id, email, created_at FROM users WHERE email = 'user@example.com';"
```

**Resolution**:
1. Verify JWT secret is correct
2. Check token expiration settings
3. Verify user exists in database
4. Check password hash
5. Clear rate limit if blocked

### Issue 4: Forecast Generation Timeout

**Symptoms**:
- Forecast generation fails with timeout
- 503 Service Unavailable
- Operation timeout errors

**Diagnosis**:
```bash
# Check forecast execution time
grep "forecast_generation" /var/log/accubooks/performance.log | tail -20

# Check queue size
redis-cli llen "queue:forecasts"
```

**Resolution**:
1. Verify timeout is 30s (configured in STEP 5)
2. Check for complex forecasts (large data points)
3. Optimize forecast algorithm if needed
4. Scale compute resources
5. Implement async processing

### Issue 5: Database Connection Pool Exhausted

**Symptoms**:
- "Connection pool timeout" errors
- API requests hanging
- Database connection errors

**Diagnosis**:
```bash
# Check active connections
psql -h db-host -U accubooks -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check pool configuration
echo $DATABASE_URL  # Should include connection_limit=20
```

**Resolution**:
1. Verify connection pool size (20 configured in STEP 5)
2. Check for connection leaks
3. Increase pool size if needed
4. Scale database if needed
5. Implement connection timeout

### Issue 6: Redis Connection Failure

**Symptoms**:
- Rate limiting failing closed (503)
- Caching not working
- Redis connection errors

**Diagnosis**:
```bash
# Check Redis connection
redis-cli -h redis-host ping

# Check Redis memory
redis-cli info memory
```

**Resolution**:
1. Verify Redis is running
2. Check network connectivity
3. Check Redis memory usage
4. Restart Redis if needed
5. Failover to replica if available

**Graceful Degradation**:
- Rate limiting: Configured to fail closed (reject requests)
- Caching: Application continues without cache
- Sessions: Fall back to database sessions

---

## 📊 6. Monitoring & Alerting

### Key Metrics to Monitor

**System Health**:
- API availability (target: 99.9%)
- API latency p95 (target: <1s)
- Error rate (target: <1%)
- Database connections (alert: >80% pool)
- Redis memory (alert: >80% capacity)

**Business Metrics**:
- User signups
- Scenario creations
- Forecast generations
- Subscription upgrades
- Payment failures

### Alert Thresholds

**Critical Alerts** (PagerDuty):
- API availability <95%
- Error rate >5%
- Database down
- Redis down
- Payment processing failure

**Warning Alerts** (Slack):
- API latency p95 >2s
- Error rate >2%
- Database connections >80%
- Redis memory >80%
- Queue size >100

### Health Check Endpoints

```bash
# Overall health
curl https://accubooks.com/api/health

# Database health
curl https://accubooks.com/api/health/db

# Redis health
curl https://accubooks.com/api/health/redis

# All services
curl https://accubooks.com/api/health/all
```

---

## 🔐 7. Security Incident Response

### Security Incident Types

**P0 - Critical**:
- Data breach
- Unauthorized access to production
- SQL injection exploit
- XSS exploit

**P1 - High**:
- Privilege escalation
- Rate limit bypass
- Authentication bypass
- Secrets exposed

### Security Incident Process

#### Step 1: Containment
1. Isolate affected systems
2. Revoke compromised credentials
3. Block malicious IPs
4. Disable affected features

#### Step 2: Investigation
1. Review access logs
2. Identify attack vector
3. Assess data exposure
4. Document timeline

#### Step 3: Eradication
1. Patch vulnerability
2. Deploy fix
3. Verify fix
4. Update security measures

#### Step 4: Recovery
1. Restore services
2. Monitor for reoccurrence
3. Reset affected credentials
4. Notify affected users (if required)

#### Step 5: Post-Incident
1. Document incident
2. Update security policies
3. Conduct security training
4. Implement preventive measures

### Security Contacts

**Security Team**: security@accubooks.com  
**Bug Bounty**: bugbounty@accubooks.com  
**Legal**: legal@accubooks.com

---

## ✅ 8. Runbook Checklist

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Security scan complete
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Feature flags configured
- [ ] Monitoring alerts configured
- [ ] On-call engineer notified

### Post-Deployment Checklist
- [ ] Health checks passing
- [ ] Error rate normal (<1%)
- [ ] API latency normal (<1s p95)
- [ ] No critical errors in logs
- [ ] User reports normal
- [ ] Monitor for 30 minutes

### Incident Response Checklist
- [ ] Incident classified (P0-P3)
- [ ] Status page updated
- [ ] Customers notified (if P0/P1)
- [ ] Incident commander assigned
- [ ] Mitigation applied
- [ ] Resolution verified
- [ ] Post-mortem scheduled

---

**Last Updated**: January 31, 2026  
**Next Review**: Quarterly or after major incidents

---

**End of Operational Runbook**
