# ⚡ PHASE 2 MONITORING - QUICK START GUIDE

**For rapid deployment execution**

---

## 🚀 DEPLOYMENT COMMANDS

```bash
# Navigate to deployment directory
cd C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks\launch\evidence\phase2_monitoring\deployment

# Make scripts executable
chmod +x *.sh

# Step 1: Deploy Prometheus (1-2 hours)
sudo ./deploy_prometheus.sh

# Step 2: Deploy Grafana (1-2 hours)
sudo ./deploy_grafana.sh

# Step 3: Deploy Alert Manager (1-2 hours)
sudo ./deploy_alertmanager.sh
# Have ready: Email SMTP, PagerDuty key, Slack webhook

# Step 4: Test Alerts (30 minutes)
./test_alerts.sh

# Step 5: Wait 24 hours for baseline

# Step 6: Capture screenshots (see below)
```

---

## 📸 SCREENSHOT CHECKLIST

**Create baseline folder**:
```bash
mkdir -p ../baseline
```

**Capture these screenshots** (save to `../baseline/`):

### After Prometheus Deployment
- [ ] `prometheus_targets.png` - http://localhost:9090/targets
- [ ] `prometheus_alerts.png` - http://localhost:9090/alerts

### After Grafana Deployment
- [ ] `grafana_datasource.png` - Data source configuration
- [ ] `grafana_executive_dashboard.png` - Executive dashboard

### After Alert Manager Deployment
- [ ] `alertmanager_ui.png` - http://localhost:9093

### After Alert Testing
- [ ] `pagerduty_notification.png` - PagerDuty alert screenshot
- [ ] `email_notification.png` - Email alert screenshot
- [ ] `slack_notification.png` - Slack alert screenshot

### After 24-Hour Baseline (24h time range)
- [ ] `prometheus_metrics_24h.png` - Any metric with 24h range
- [ ] `grafana_executive_24h.png` - Executive dashboard (24h)
- [ ] `grafana_operations_24h.png` - Operations dashboard (24h)
- [ ] `grafana_database_24h.png` - Database dashboard (24h)
- [ ] `grafana_business_24h.png` - Business dashboard (24h)

---

## ✅ VERIFICATION URLS

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Alert Manager**: http://localhost:9093

---

## 📋 RESULTS REPORTING

**Fill out**: `DEPLOYMENT_RESULTS_FORM.md`

**Share with AI assistant** for:
- Checklist updates
- Evidence verification
- Next steps authorization

---

## 🚨 TROUBLESHOOTING

**Prometheus not starting**:
```bash
sudo journalctl -u prometheus -f
```

**Grafana not accessible**:
```bash
sudo journalctl -u grafana-server -f
```

**Alert Manager issues**:
```bash
sudo journalctl -u alertmanager -f
```

---

## ⏱️ TIMELINE

- **Day 1**: Deploy all components + test alerts (4-6 hours)
- **Days 2-3**: 24-hour baseline monitoring
- **Day 3**: Capture evidence + fill out results form
- **Day 3**: Share results with AI for verification

**Total**: ~3 days

---

**BEGIN DEPLOYMENT NOW**
