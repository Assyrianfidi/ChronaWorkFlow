# 📊 PHASE 2 MONITORING BASELINE CHECKLIST

**Status**: PENDING DEPLOYMENT  
**Purpose**: Single source of truth for validation evidence

---

## DEPLOYMENT CHECKLIST

### Prometheus
- [ ] Installed and running
- [ ] Scraping `/api/monitoring/metrics` every 15s
- [ ] Scraping `/api/monitoring/health` every 60s
- [ ] Alert rules loaded from `alert_rules.yml`
- [ ] UI accessible: http://localhost:9090
- [ ] All targets showing "UP"

### Grafana
- [ ] Installed and running
- [ ] Prometheus data source configured
- [ ] 4 dashboards imported (Executive, Operations, Database, Business)
- [ ] All panels showing data
- [ ] UI accessible: http://localhost:3000

### Alert Manager
- [ ] Installed and running
- [ ] Email configured
- [ ] PagerDuty configured
- [ ] Slack configured
- [ ] UI accessible: http://localhost:9093

### Alert Testing
- [ ] P0 test alert fired and received (PagerDuty)
- [ ] P1 test alert fired and received (Email)
- [ ] P2 test alert fired and received (Slack)
- [ ] Escalation chain tested

### 24-Hour Baseline
- [ ] All metrics collecting for 24 hours
- [ ] No gaps in data
- [ ] No silent failures
- [ ] Baseline screenshots captured

---

## VERIFICATION

**Metrics Collecting**: ___ / 40+  
**Alerts Configured**: ___ / 15  
**Dashboards Operational**: ___ / 4  
**Baseline Complete**: YES / NO

**Status**: PASS / FAIL

---

## EVIDENCE CAPTURED

- [ ] Prometheus targets screenshot
- [ ] Grafana dashboards screenshots (all 4)
- [ ] Alert test logs
- [ ] PagerDuty test confirmation
- [ ] 24-hour baseline graphs

**Evidence Location**: `launch/evidence/phase2_monitoring/baseline/`

---

## AUTHORIZATION TO PROCEED

**Monitoring Verified**: YES / NO  
**Baseline Established**: YES / NO  
**30-Day Stability Window**: CAN START / CANNOT START

**Verified By**: _______________  
**Date**: _______________

---

**Once complete, Phase 5 validation execution may begin.**
