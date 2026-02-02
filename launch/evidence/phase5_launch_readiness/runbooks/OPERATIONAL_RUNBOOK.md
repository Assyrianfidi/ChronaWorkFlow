# 🚨 ACCUBOOKS OPERATIONAL RUNBOOK

**Version**: 1.0  
**Last Updated**: February 1, 2026  
**MTTR Target**: P0 <30min, P1 <4hr

---

## P0-1: SYSTEM DOWN

**Detection**: SystemUnreachable alert (3 min)

**Actions**:
1. Check health: `curl https://api.accubooks.com/api/monitoring/health`
2. Check logs: `docker logs accubooks-api --tail 100`
3. Restart: `docker restart accubooks-api`
4. Verify: Health returns 200

**Escalate if**: Not resolved in 15 minutes

---

## P0-2: DATABASE POOL EXHAUSTION

**Detection**: Pool utilization >90% (5 min)

**Actions**:
1. Check pool: `curl https://api.accubooks.com/api/monitoring/pool-config`
2. Kill idle connections: `psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND now() - state_change > interval '5 minutes';"`
3. Restart: `docker restart accubooks-api`
4. Verify: Pool <70%

**Escalate if**: Pool remains >80%

---

## P0-3: BILLING ERROR

**Detection**: Incorrect charge reported

**Actions**:
1. **FREEZE BILLING**: Set `billingConfig.enabled = false`, restart app
2. Issue full refund via Stripe dashboard
3. Notify CEO + CTO immediately
4. Document in `launch/evidence/phase4_billing/refunds/`

**Resume billing**: CEO approval required

---

## P0-4: DATA INTEGRITY VIOLATION

**Detection**: Cross-tenant leakage OR calculation error

**Actions**:
1. **STOP SYSTEM**: `docker stop accubooks-api`
2. Preserve evidence: `pg_dump > backup_[TIMESTAMP].sql`
3. Notify CEO + CTO + Legal immediately
4. DO NOT restart without approval

**Resume**: CEO approval required

---

## P1-1: HIGH ERROR RATE

**Detection**: Error rate >1% (5 min)

**Actions**:
1. Check logs: `docker logs accubooks-api --tail 200`
2. Check database: `psql -c "SELECT 1"`
3. Check Redis: `redis-cli ping`
4. Restart if needed: `docker restart accubooks-api`

**Escalate if**: Error rate >5% or not resolved in 1 hour

---

## P1-2: HIGH LATENCY

**Detection**: p95 latency >1s (5 min)

**Actions**:
1. Check slow queries: `psql -c "SELECT pid, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 seconds';"`
2. Check pool utilization: Should be <70%
3. Check Redis hit rate: Should be >70%
4. Kill slow queries if needed

**Escalate if**: Latency >2s or not resolved in 2 hours

---

## P1-3: QUEUE OVERFLOW

**Detection**: Queue depth >200 (10 min)

**Actions**:
1. Check queue: Monitor `forecast_queue_depth` metric
2. Check worker utilization: Should be <80%
3. Scale workers if possible
4. Pause new jobs if queue >500

**Escalate if**: Queue >1000 or growing rapidly

---

## CONTACT LIST

- **CEO**: [EMAIL] [PHONE]
- **CTO**: [EMAIL] [PHONE]
- **On-Call Engineer**: PagerDuty rotation
- **Security Team**: security@accubooks.com
- **Legal Team**: legal@accubooks.com

---

## POST-INCIDENT

All P0/P1 incidents require:
1. Incident report within 24 hours
2. Post-mortem within 48 hours
3. Runbook update if needed
