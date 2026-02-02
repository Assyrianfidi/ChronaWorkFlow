# 🚀 PHASE 2 MONITORING DEPLOYMENT EXECUTION GUIDE

**Status**: AUTHORIZED FOR IMMEDIATE DEPLOYMENT  
**Authorization Date**: February 1, 2026, 6:33 PM PST  
**Estimated Time**: 4-6 hours + 24-hour baseline

---

## 📋 PREREQUISITES

**Before starting**:
- [ ] AccuBooks API running on localhost:5000
- [ ] `/api/monitoring/metrics` endpoint accessible
- [ ] `/api/monitoring/health` endpoint accessible
- [ ] Root/sudo access to deployment server
- [ ] Internet connectivity for downloads
- [ ] PagerDuty account created
- [ ] Slack webhook URL obtained
- [ ] Email SMTP credentials available

---

## 🚀 DEPLOYMENT SEQUENCE

### Step 1: Deploy Prometheus (1-2 hours)

```bash
cd launch/evidence/phase2_monitoring/deployment
chmod +x deploy_prometheus.sh
sudo ./deploy_prometheus.sh
```

**Verification**:
- [ ] Prometheus UI accessible: http://localhost:9090
- [ ] Targets showing "UP": http://localhost:9090/targets
- [ ] Alert rules loaded: http://localhost:9090/alerts
- [ ] Metrics visible: http://localhost:9090/graph

**If failed**: Check logs with `sudo journalctl -u prometheus -f`

---

### Step 2: Deploy Grafana (1-2 hours)

```bash
cd launch/evidence/phase2_monitoring/deployment
chmod +x deploy_grafana.sh
sudo ./deploy_grafana.sh
```

**Verification**:
- [ ] Grafana UI accessible: http://localhost:3000
- [ ] Login with admin/admin works
- [ ] Password changed
- [ ] Prometheus data source configured
- [ ] Executive dashboard visible

**If failed**: Check logs with `sudo journalctl -u grafana-server -f`

---

### Step 3: Deploy Alert Manager (1-2 hours)

```bash
cd launch/evidence/phase2_monitoring/deployment
chmod +x deploy_alertmanager.sh
sudo ./deploy_alertmanager.sh
```

**You will be prompted for**:
- Email SMTP server (e.g., smtp.gmail.com:587)
- Email from address
- Email to address
- Email password
- PagerDuty service key
- Slack webhook URL

**Verification**:
- [ ] Alert Manager UI accessible: http://localhost:9093
- [ ] No firing alerts initially
- [ ] Receivers configured

**If failed**: Check logs with `sudo journalctl -u alertmanager -f`

---

### Step 4: Test Alerts (30 minutes)

```bash
cd launch/evidence/phase2_monitoring/deployment
chmod +x test_alerts.sh
./test_alerts.sh
```

**This script will**:
1. Fire test P0 alert → verify PagerDuty receives it
2. Fire test P1 alert → verify Email receives it
3. Fire test P2 alert → verify Slack receives it

**Verification**:
- [ ] P0 alert received on PagerDuty (within 60 seconds)
- [ ] P1 alert received via Email (within 5 minutes)
- [ ] P2 alert received on Slack
- [ ] Test results saved to `baseline/alert_test_results.txt`

**If failed**: Check Alert Manager UI for routing issues

---

### Step 5: 24-Hour Baseline (24 hours)

**Let the system run for 24 hours**:
- [ ] Start time: _______________
- [ ] End time: _______________
- [ ] No gaps in metrics
- [ ] No silent failures
- [ ] All targets remain "UP"

**Monitor during baseline**:
- Check Prometheus targets every 4 hours
- Check Grafana dashboards every 4 hours
- Verify no alerts firing (unless expected)

---

### Step 6: Capture Evidence (1 hour)

**After 24-hour baseline complete**:

1. **Prometheus Screenshots**:
   - [ ] Targets page: http://localhost:9090/targets
   - [ ] Alerts page: http://localhost:9090/alerts
   - [ ] Graph showing 24-hour metric: http://localhost:9090/graph
   - Save to: `baseline/prometheus_targets.png`
   - Save to: `baseline/prometheus_alerts.png`
   - Save to: `baseline/prometheus_24h_metrics.png`

2. **Grafana Screenshots**:
   - [ ] Executive dashboard (24-hour view)
   - [ ] Operations dashboard (24-hour view)
   - [ ] Database dashboard (24-hour view)
   - [ ] Business dashboard (24-hour view)
   - Save to: `baseline/grafana_executive.png`
   - Save to: `baseline/grafana_operations.png`
   - Save to: `baseline/grafana_database.png`
   - Save to: `baseline/grafana_business.png`

3. **Alert Manager Screenshots**:
   - [ ] Alert Manager UI: http://localhost:9093
   - Save to: `baseline/alertmanager_ui.png`

4. **Test Results**:
   - [ ] Alert test results already saved: `baseline/alert_test_results.txt`

---

### Step 7: Complete Verification Checklist (30 minutes)

Fill out: `launch/evidence/phase2_monitoring/MONITORING_BASELINE_CHECKLIST.md`

**Mark all items complete**:
- [ ] Prometheus deployed and verified
- [ ] Grafana deployed and verified
- [ ] Alert Manager deployed and verified
- [ ] All alerts tested (P0, P1, P2)
- [ ] 24-hour baseline established
- [ ] All evidence captured

**Sign off**:
- Verified by: _______________
- Date: _______________

---

## ✅ SUCCESS CRITERIA

**Monitoring is VERIFIED when**:
- ✅ All 3 components deployed (Prometheus, Grafana, Alert Manager)
- ✅ All targets showing "UP"
- ✅ All 40+ metrics collecting
- ✅ All 15 alert rules loaded
- ✅ All 4 dashboards operational
- ✅ All 3 alert tests passed (P0, P1, P2)
- ✅ 24-hour baseline complete (no gaps)
- ✅ All evidence captured and saved

---

## 🚨 FAILURE CONDITIONS

**Monitoring is FAILED if**:
- ❌ Any component fails to deploy
- ❌ Any target shows "DOWN"
- ❌ Any metrics missing
- ❌ Any alert test fails
- ❌ Gaps in 24-hour baseline
- ❌ Evidence incomplete

**If failed**: Fix issues and restart deployment

---

## 📊 AFTER VERIFICATION COMPLETE

**Once monitoring is verified**:
1. Update `MONITORING_BASELINE_CHECKLIST.md` with "PASS"
2. Update `PHASE5_EVIDENCE_INDEX.md` - mark monitoring evidence as "COMPLETE"
3. **30-DAY STABILITY WINDOW CAN NOW START** (Day 1 begins)
4. Failure simulations can be executed
5. Phase 5 validation execution proceeds

---

## 🎯 TROUBLESHOOTING

### Prometheus not starting
```bash
sudo journalctl -u prometheus -f
# Check for configuration errors
./prometheus --config.file=prometheus.yml --config.check
```

### Grafana not accessible
```bash
sudo journalctl -u grafana-server -f
# Check if port 3000 is available
sudo netstat -tulpn | grep 3000
```

### Alert Manager not routing
```bash
sudo journalctl -u alertmanager -f
# Check configuration
./amtool check-config alertmanager.yml
```

### Alerts not firing
- Verify Alert Manager URL in Prometheus config
- Check alert rules syntax: http://localhost:9090/alerts
- Verify receiver configurations in Alert Manager

---

## 📁 EVIDENCE STORAGE

**All evidence must be saved to**:
`launch/evidence/phase2_monitoring/baseline/`

**Required files**:
- `prometheus_targets.png`
- `prometheus_alerts.png`
- `prometheus_24h_metrics.png`
- `grafana_executive.png`
- `grafana_operations.png`
- `grafana_database.png`
- `grafana_business.png`
- `alertmanager_ui.png`
- `alert_test_results.txt`

---

## ✅ FINAL AUTHORIZATION

**Once all steps complete**:

**Monitoring Status**: VERIFIED / FAILED  
**Baseline Status**: COMPLETE / INCOMPLETE  
**Evidence Status**: CAPTURED / MISSING

**30-Day Stability Window**: CAN START / CANNOT START

**Authorized By**: _______________  
**Date**: _______________

---

**BEGIN DEPLOYMENT IMMEDIATELY**
