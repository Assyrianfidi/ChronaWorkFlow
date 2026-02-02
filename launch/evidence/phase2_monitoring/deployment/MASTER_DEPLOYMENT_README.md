# 🚀 MASTER DEPLOYMENT SCRIPT - README

**Single-command deployment for AccuBooks Phase 2 Monitoring**

---

## 📋 WHAT THIS SCRIPT DOES

The `deploy_all.sh` script automates the **complete Phase 2 monitoring deployment** in one execution:

1. ✅ Checks all prerequisites (Node.js, npm, curl, wget, sudo, ports)
2. ✅ Starts AccuBooks backend on port 5000
3. ✅ Verifies backend endpoints (`/api/monitoring/metrics`, `/api/monitoring/health`)
4. ✅ Deploys Prometheus v2.45.0 with systemd service
5. ✅ Deploys Alertmanager v0.26.0 with systemd service
6. ✅ Verifies Prometheus targets and alerts
7. ✅ Starts AccuBooks frontend on port 3000 (optional)
8. ✅ Outputs comprehensive status summary

**Total Time**: 10-15 minutes (automated)

---

## ⚡ QUICK START

```bash
# Navigate to deployment directory
cd C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/launch/evidence/phase2_monitoring/deployment

# Make script executable
chmod +x deploy_all.sh

# Run deployment (requires sudo for Prometheus/Alertmanager)
sudo ./deploy_all.sh
```

**That's it!** The script will handle everything automatically.

---

## 📊 WHAT GETS DEPLOYED

### Backend (AccuBooks API)
- **Port**: 5000
- **Endpoints**: 
  - `/api/monitoring/metrics` (Prometheus metrics)
  - `/api/monitoring/health` (Health check)
- **Process**: Background (PID saved to `backend.pid`)
- **Logs**: `C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.log`

### Prometheus
- **Version**: 2.45.0
- **Port**: 9090
- **Location**: `/opt/accubooks/monitoring/prometheus`
- **Service**: systemd (`prometheus.service`)
- **Configuration**: 
  - Scrape interval: 15s
  - Retention: 90 days
  - Jobs: accubooks-api, accubooks-health, prometheus
- **UI**: http://localhost:9090

### Alertmanager
- **Version**: 0.26.0
- **Port**: 9093
- **Location**: `/opt/accubooks/monitoring/alertmanager`
- **Service**: systemd (`alertmanager.service`)
- **Configuration**: Basic webhook routing for P0/P1 alerts
- **UI**: http://localhost:9093

### Frontend (Optional)
- **Port**: 3000
- **Process**: Background (PID saved to `frontend.pid`)
- **Logs**: `C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/frontend.log`
- **UI**: http://localhost:3000

---

## 🔍 VERIFICATION

After deployment completes, verify everything is running:

### Check Service Status
```bash
# Backend
curl http://localhost:5000/api/monitoring/health

# Prometheus
curl http://localhost:9090/-/healthy

# Alertmanager
curl http://localhost:9093/-/healthy

# Frontend (if deployed)
curl http://localhost:3000
```

### Check Prometheus Targets
```bash
# Open in browser
http://localhost:9090/targets

# Or via CLI
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

### Check Systemd Services
```bash
sudo systemctl status prometheus
sudo systemctl status alertmanager
```

---

## 📝 LOGS

**Deployment Log**: 
```bash
cat C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/launch/evidence/phase2_monitoring/deployment/deployment.log
```

**Backend Log**:
```bash
tail -f C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.log
```

**Frontend Log**:
```bash
tail -f C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/frontend.log
```

**Prometheus Log**:
```bash
sudo journalctl -u prometheus -f
```

**Alertmanager Log**:
```bash
sudo journalctl -u alertmanager -f
```

---

## 🔧 TROUBLESHOOTING

### Backend Not Starting

**Check logs**:
```bash
cat C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.log
```

**Common issues**:
- Port 5000 already in use: `lsof -i :5000` (kill existing process)
- Missing dependencies: `npm install` in project root
- Database not running: Check PostgreSQL/database connection

### Prometheus Not Starting

**Check logs**:
```bash
sudo journalctl -u prometheus -n 50
```

**Common issues**:
- Configuration invalid: `promtool check config prometheus.yml`
- Port 9090 in use: `lsof -i :9090`
- Permissions: `sudo chown -R prometheus:prometheus /opt/accubooks/monitoring/prometheus`

### Alertmanager Not Starting

**Check logs**:
```bash
sudo journalctl -u alertmanager -n 50
```

**Common issues**:
- Configuration invalid: Check `alertmanager.yml` syntax
- Port 9093 in use: `lsof -i :9093`
- Permissions: `sudo chown -R prometheus:prometheus /opt/accubooks/monitoring/alertmanager`

### Targets Showing "DOWN"

**Possible causes**:
- Backend not running: Check `curl http://localhost:5000/api/monitoring/health`
- Firewall blocking: Check firewall rules
- Endpoints not implemented: Verify `/api/monitoring/metrics` exists

**Fix**:
```bash
# Restart Prometheus to re-scrape
sudo systemctl restart prometheus

# Wait 15 seconds and check targets
curl http://localhost:9090/api/v1/targets
```

---

## 🛑 STOPPING SERVICES

### Stop Backend/Frontend
```bash
# Backend
kill $(cat C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.pid)

# Frontend
kill $(cat C:/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/frontend.pid)
```

### Stop Prometheus/Alertmanager
```bash
sudo systemctl stop prometheus
sudo systemctl stop alertmanager
```

### Disable Auto-Start
```bash
sudo systemctl disable prometheus
sudo systemctl disable alertmanager
```

---

## 🔄 RE-RUNNING DEPLOYMENT

If deployment fails or you need to re-run:

```bash
# Stop all services first
kill $(cat backend.pid) 2>/dev/null || true
kill $(cat frontend.pid) 2>/dev/null || true
sudo systemctl stop prometheus
sudo systemctl stop alertmanager

# Re-run deployment
sudo ./deploy_all.sh
```

The script is **idempotent** - safe to run multiple times.

---

## 📊 AFTER DEPLOYMENT

### Next Steps

1. **Verify Targets**: http://localhost:9090/targets (all should be "UP")
2. **Check Alerts**: http://localhost:9090/alerts (rules should be loaded)
3. **Run Alert Tests**: `./test_alerts.sh`
4. **Begin 24-Hour Baseline**: Let system run for 24 hours
5. **Capture Evidence**: Take screenshots per `DEPLOYMENT_RESULTS_FORM.md`
6. **Fill Out Form**: Complete `DEPLOYMENT_RESULTS_FORM.md`
7. **Share Results**: Provide completed form to AI assistant

### Evidence Capture

After 24 hours, capture these screenshots:

```bash
# Create baseline folder
mkdir -p ../baseline

# Take screenshots (use browser or screenshot tool):
# - http://localhost:9090/targets → baseline/prometheus_targets_24h.png
# - http://localhost:9090/alerts → baseline/prometheus_alerts_24h.png
# - http://localhost:9090/graph → baseline/prometheus_metrics_24h.png
```

---

## 🎯 SUCCESS CRITERIA

**Deployment is SUCCESSFUL when**:

- ✅ Backend responds: `curl http://localhost:5000/api/monitoring/health`
- ✅ Prometheus healthy: `curl http://localhost:9090/-/healthy`
- ✅ Alertmanager healthy: `curl http://localhost:9093/-/healthy`
- ✅ All targets "UP": http://localhost:9090/targets
- ✅ Alert rules loaded: http://localhost:9090/alerts
- ✅ No errors in logs

**Then**: Proceed to 24-hour baseline monitoring

---

## 📞 GETTING HELP

**If deployment fails**:

1. Check the deployment log: `deployment.log`
2. Check service-specific logs (see Logs section above)
3. Review troubleshooting section
4. Share error messages with AI assistant for help

**Common Questions**:

**Q: Do I need sudo?**  
A: Yes, for Prometheus/Alertmanager systemd services. Backend/frontend run as your user.

**Q: Can I run this on Windows?**  
A: Use WSL2 (Windows Subsystem for Linux) or Git Bash with Linux-compatible environment.

**Q: What if port 5000 is in use?**  
A: Kill the existing process or modify `BACKEND_PORT` in the script.

**Q: How long does deployment take?**  
A: 10-15 minutes for full automated deployment.

---

## 🔐 SECURITY NOTES

- Prometheus/Alertmanager run as dedicated `prometheus` user
- Services listen on localhost only (not exposed externally)
- No authentication configured (suitable for local development only)
- For production: Add authentication, TLS, and firewall rules

---

## ✅ DEPLOYMENT CHECKLIST

After running `deploy_all.sh`:

- [ ] Script completed without errors
- [ ] Backend responding on port 5000
- [ ] Prometheus UI accessible on port 9090
- [ ] Alertmanager UI accessible on port 9093
- [ ] All Prometheus targets showing "UP"
- [ ] Alert rules loaded (check /alerts page)
- [ ] Deployment log reviewed
- [ ] No errors in service logs
- [ ] Ready for 24-hour baseline

**If all checked**: Deployment successful! Proceed to baseline monitoring.

---

**Script Version**: 1.0.0  
**Last Updated**: February 1, 2026  
**Support**: Share deployment.log with AI assistant for troubleshooting
