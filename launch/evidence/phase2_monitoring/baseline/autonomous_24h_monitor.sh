#!/bin/bash
# Fully Autonomous 24-Hour Baseline Monitoring for AccuBooks
# No manual intervention required - handles all retries, logging, and reporting

set -e

PROJECT_ROOT="/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks"
BASELINE_DIR="$PROJECT_ROOT/launch/evidence/phase2_monitoring/baseline"
SCREENSHOTS_DIR="$BASELINE_DIR/screenshots"

# Create directories
mkdir -p "$BASELINE_DIR"
mkdir -p "$SCREENSHOTS_DIR"

# Log files
BACKEND_HEALTH_LOG="$BASELINE_DIR/backend_health.log"
BACKEND_METRICS_LOG="$BASELINE_DIR/backend_metrics.log"
PROMETHEUS_HEALTH_LOG="$BASELINE_DIR/prometheus_health.log"
ALERTMANAGER_HEALTH_LOG="$BASELINE_DIR/alertmanager_health.log"
PROMETHEUS_TARGETS_LOG="$BASELINE_DIR/prometheus_targets.log"
SYSTEM_METRICS_LOG="$BASELINE_DIR/system_metrics.log"
BASELINE_ALERTS_LOG="$BASELINE_DIR/baseline_alerts.log"
FRONTEND_LOG="$BASELINE_DIR/frontend.log"
MASTER_LOG="$BASELINE_DIR/master_monitoring.log"

# Initialize log files
echo "=== 24-Hour Baseline Monitoring Started: $(date) ===" | tee -a "$MASTER_LOG"
echo "" | tee -a "$MASTER_LOG"

# Failure counters
BACKEND_FAILURES=0
PROMETHEUS_FAILURES=0
ALERTMANAGER_FAILURES=0

# Function to log with timestamp
log_msg() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MASTER_LOG"
}

# Function to check service with retries
check_service_with_retry() {
    local service_name=$1
    local url=$2
    local log_file=$3
    local max_retries=3
    local retry_delay=5
    
    for attempt in $(seq 1 $max_retries); do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_msg "✓ $service_name is healthy (attempt $attempt/$max_retries)"
            return 0
        else
            log_msg "⚠ $service_name check failed (attempt $attempt/$max_retries)"
            if [ $attempt -lt $max_retries ]; then
                sleep $retry_delay
            fi
        fi
    done
    
    log_msg "✗ $service_name FAILED after $max_retries attempts"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $service_name FAILED after $max_retries attempts" >> "$BASELINE_ALERTS_LOG"
    return 1
}

# Function to capture backend health
capture_backend_health() {
    log_msg "Capturing backend health..."
    echo "=== $(date) ===" >> "$BACKEND_HEALTH_LOG"
    
    if check_service_with_retry "Backend" "http://localhost:5000/api/monitoring/health" "$BACKEND_HEALTH_LOG"; then
        curl -s http://localhost:5000/api/monitoring/health | jq . >> "$BACKEND_HEALTH_LOG" 2>&1
        BACKEND_FAILURES=0
    else
        echo "UNAVAILABLE" >> "$BACKEND_HEALTH_LOG"
        BACKEND_FAILURES=$((BACKEND_FAILURES + 1))
        if [ $BACKEND_FAILURES -ge 3 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: Backend has failed $BACKEND_FAILURES consecutive times" >> "$BASELINE_ALERTS_LOG"
        fi
    fi
    echo "" >> "$BACKEND_HEALTH_LOG"
}

# Function to capture backend metrics
capture_backend_metrics() {
    log_msg "Capturing backend metrics..."
    echo "=== $(date) ===" >> "$BACKEND_METRICS_LOG"
    
    if curl -s http://localhost:5000/api/monitoring/metrics > /dev/null 2>&1; then
        curl -s http://localhost:5000/api/monitoring/metrics | grep "accubooks_" >> "$BACKEND_METRICS_LOG" 2>&1
    else
        echo "UNAVAILABLE" >> "$BACKEND_METRICS_LOG"
    fi
    echo "" >> "$BACKEND_METRICS_LOG"
}

# Function to capture Prometheus health
capture_prometheus_health() {
    log_msg "Capturing Prometheus health..."
    echo "=== $(date) ===" >> "$PROMETHEUS_HEALTH_LOG"
    
    if check_service_with_retry "Prometheus" "http://localhost:9090/-/healthy" "$PROMETHEUS_HEALTH_LOG"; then
        echo "HEALTHY" >> "$PROMETHEUS_HEALTH_LOG"
        PROMETHEUS_FAILURES=0
    else
        echo "UNAVAILABLE" >> "$PROMETHEUS_HEALTH_LOG"
        PROMETHEUS_FAILURES=$((PROMETHEUS_FAILURES + 1))
        if [ $PROMETHEUS_FAILURES -ge 3 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: Prometheus has failed $PROMETHEUS_FAILURES consecutive times" >> "$BASELINE_ALERTS_LOG"
        fi
    fi
    echo "" >> "$PROMETHEUS_HEALTH_LOG"
}

# Function to capture Alertmanager health
capture_alertmanager_health() {
    log_msg "Capturing Alertmanager health..."
    echo "=== $(date) ===" >> "$ALERTMANAGER_HEALTH_LOG"
    
    if curl -s -f http://localhost:9093/-/healthy > /dev/null 2>&1; then
        echo "HEALTHY" >> "$ALERTMANAGER_HEALTH_LOG"
        ALERTMANAGER_FAILURES=0
    else
        echo "NOT CONFIGURED/UNAVAILABLE" >> "$ALERTMANAGER_HEALTH_LOG"
        # Don't count as critical failure since Alertmanager is optional
    fi
    echo "" >> "$ALERTMANAGER_HEALTH_LOG"
}

# Function to capture Prometheus targets
capture_prometheus_targets() {
    log_msg "Capturing Prometheus targets..."
    echo "=== $(date) ===" >> "$PROMETHEUS_TARGETS_LOG"
    
    if curl -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then
        TARGETS=$(curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}' 2>&1)
        echo "$TARGETS" >> "$PROMETHEUS_TARGETS_LOG"
        
        # Check for DOWN targets
        if echo "$TARGETS" | grep -q '"health": "down"'; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Some Prometheus targets are DOWN" >> "$BASELINE_ALERTS_LOG"
            echo "$TARGETS" | grep -A 1 '"health": "down"' >> "$BASELINE_ALERTS_LOG"
        fi
    else
        echo "UNAVAILABLE" >> "$PROMETHEUS_TARGETS_LOG"
    fi
    echo "" >> "$PROMETHEUS_TARGETS_LOG"
}

# Function to capture system metrics
capture_system_metrics() {
    log_msg "Capturing system metrics..."
    echo "=== $(date) ===" >> "$SYSTEM_METRICS_LOG"
    
    echo "--- CPU and Process Info ---" >> "$SYSTEM_METRICS_LOG"
    top -b -n 1 | head -20 >> "$SYSTEM_METRICS_LOG" 2>&1
    
    echo "" >> "$SYSTEM_METRICS_LOG"
    echo "--- Memory Usage ---" >> "$SYSTEM_METRICS_LOG"
    free -m >> "$SYSTEM_METRICS_LOG" 2>&1
    
    echo "" >> "$SYSTEM_METRICS_LOG"
    echo "--- Disk Usage ---" >> "$SYSTEM_METRICS_LOG"
    df -h >> "$SYSTEM_METRICS_LOG" 2>&1
    
    echo "" >> "$SYSTEM_METRICS_LOG"
    echo "========================================" >> "$SYSTEM_METRICS_LOG"
    echo "" >> "$SYSTEM_METRICS_LOG"
}

# Function to capture screenshots (using wslview or similar)
capture_screenshots() {
    local timestamp=$(date '+%Y%m%d_%H%M')
    log_msg "Screenshot capture scheduled for timestamp: $timestamp"
    
    # Note: Screenshot capture in WSL requires manual intervention or Windows tools
    # Logging the requirement for manual screenshot capture
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Screenshot capture point - Prometheus: http://localhost:9090" >> "$MASTER_LOG"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Screenshot capture point - Alertmanager: http://localhost:9093" >> "$MASTER_LOG"
    
    # Create placeholder files to track screenshot times
    touch "$SCREENSHOTS_DIR/screenshot_due_${timestamp}.txt"
    echo "Prometheus: http://localhost:9090" > "$SCREENSHOTS_DIR/screenshot_due_${timestamp}.txt"
    echo "Alertmanager: http://localhost:9093" >> "$SCREENSHOTS_DIR/screenshot_due_${timestamp}.txt"
}

# Step 1: Start Frontend
log_msg "========================================="
log_msg "STEP 1: Starting Frontend"
log_msg "========================================="

cd "$PROJECT_ROOT"

# Check if frontend is already running
if lsof -ti:3000 > /dev/null 2>&1; then
    log_msg "Frontend already running on port 3000"
else
    log_msg "Starting frontend in detached mode..."
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    log_msg "Frontend started (PID: $FRONTEND_PID)"
    sleep 10  # Give frontend time to start
fi

# Step 2: Initial Health Checks
log_msg ""
log_msg "========================================="
log_msg "STEP 2: Initial Health Checks"
log_msg "========================================="

capture_backend_health
capture_backend_metrics
capture_prometheus_health
capture_alertmanager_health
capture_prometheus_targets
capture_system_metrics

# Step 3: 24-Hour Monitoring Loop
log_msg ""
log_msg "========================================="
log_msg "STEP 3: Starting 24-Hour Monitoring Loop"
log_msg "========================================="
log_msg "Monitoring interval: 5 minutes"
log_msg "Screenshot interval: 30 minutes"
log_msg ""

# Calculate end time (24 hours from now)
START_TIME=$(date +%s)
END_TIME=$((START_TIME + 86400))  # 24 hours = 86400 seconds

ITERATION=0
SCREENSHOT_COUNTER=0

while [ $(date +%s) -lt $END_TIME ]; do
    ITERATION=$((ITERATION + 1))
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    REMAINING=$((END_TIME - CURRENT_TIME))
    
    HOURS_ELAPSED=$((ELAPSED / 3600))
    MINUTES_ELAPSED=$(((ELAPSED % 3600) / 60))
    HOURS_REMAINING=$((REMAINING / 3600))
    MINUTES_REMAINING=$(((REMAINING % 3600) / 60))
    
    log_msg ""
    log_msg "========================================="
    log_msg "ITERATION $ITERATION"
    log_msg "Elapsed: ${HOURS_ELAPSED}h ${MINUTES_ELAPSED}m"
    log_msg "Remaining: ${HOURS_REMAINING}h ${MINUTES_REMAINING}m"
    log_msg "========================================="
    
    # Capture all metrics
    capture_backend_health
    capture_backend_metrics
    capture_prometheus_health
    capture_alertmanager_health
    capture_prometheus_targets
    capture_system_metrics
    
    # Screenshot every 30 minutes (6 iterations)
    if [ $((ITERATION % 6)) -eq 0 ]; then
        SCREENSHOT_COUNTER=$((SCREENSHOT_COUNTER + 1))
        log_msg "Screenshot checkpoint #$SCREENSHOT_COUNTER"
        capture_screenshots
    fi
    
    log_msg "Iteration $ITERATION complete. Sleeping 5 minutes..."
    sleep 300  # 5 minutes
done

# Step 4: Generate Final Report
log_msg ""
log_msg "========================================="
log_msg "STEP 4: Generating Final Report"
log_msg "========================================="

REPORT_FILE="$BASELINE_DIR/PHASE2_BASELINE_REPORT_FINAL.md"

cat > "$REPORT_FILE" <<'REPORT_EOF'
# Phase 2 Baseline Monitoring - Final Report

**Monitoring Period:** 24 Hours  
**Start Time:** REPORT_EOF
echo "$(date -d @$START_TIME '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
cat >> "$REPORT_FILE" <<'REPORT_EOF'
**End Time:** REPORT_EOF
echo "$(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
cat >> "$REPORT_FILE" <<'REPORT_EOF'
**Total Iterations:** REPORT_EOF
echo "$ITERATION" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" <<'REPORT_EOF'

---

## Service Status Summary

| Service | Status | URL | Health Check Result |
|---------|--------|-----|---------------------|
REPORT_EOF

# Check final status of each service
BACKEND_STATUS="UNKNOWN"
if curl -s -f http://localhost:5000/api/monitoring/health > /dev/null 2>&1; then
    BACKEND_STATUS=$(curl -s http://localhost:5000/api/monitoring/health | jq -r '.status' 2>/dev/null || echo "RUNNING")
fi

PROMETHEUS_STATUS="UNKNOWN"
if curl -s -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    PROMETHEUS_STATUS="HEALTHY"
fi

ALERTMANAGER_STATUS="NOT CONFIGURED"
if curl -s -f http://localhost:9093/-/healthy > /dev/null 2>&1; then
    ALERTMANAGER_STATUS="HEALTHY"
fi

FRONTEND_STATUS="UNKNOWN"
if lsof -ti:3000 > /dev/null 2>&1; then
    FRONTEND_STATUS="RUNNING"
fi

echo "| Backend API | $BACKEND_STATUS | http://localhost:5000 | See backend_health.log |" >> "$REPORT_FILE"
echo "| Frontend | $FRONTEND_STATUS | http://localhost:3000 | See frontend.log |" >> "$REPORT_FILE"
echo "| Prometheus | $PROMETHEUS_STATUS | http://localhost:9090 | See prometheus_health.log |" >> "$REPORT_FILE"
echo "| Alertmanager | $ALERTMANAGER_STATUS | http://localhost:9093 | See alertmanager_health.log |" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" <<'REPORT_EOF'

---

## Prometheus Targets Summary

REPORT_EOF

# Get final targets status
if curl -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then
    echo '```json' >> "$REPORT_FILE"
    curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastScrape: .lastScrape}' >> "$REPORT_FILE" 2>&1
    echo '```' >> "$REPORT_FILE"
else
    echo "Prometheus targets unavailable" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<'REPORT_EOF'

---

## System Metrics Summary

### Final System State

**CPU Usage:**
```
REPORT_EOF
top -b -n 1 | head -5 >> "$REPORT_FILE" 2>&1
cat >> "$REPORT_FILE" <<'REPORT_EOF'
```

**Memory Usage:**
```
REPORT_EOF
free -h >> "$REPORT_FILE" 2>&1
cat >> "$REPORT_FILE" <<'REPORT_EOF'
```

**Disk Usage:**
```
REPORT_EOF
df -h >> "$REPORT_FILE" 2>&1
cat >> "$REPORT_FILE" <<'REPORT_EOF'
```

---

## Alerts and Failures

REPORT_EOF

if [ -f "$BASELINE_ALERTS_LOG" ] && [ -s "$BASELINE_ALERTS_LOG" ]; then
    echo "### Critical Alerts Detected" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    cat "$BASELINE_ALERTS_LOG" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "✅ No critical alerts detected during monitoring period" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<'REPORT_EOF'

---

## Evidence Files

All monitoring data has been saved to:
`/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/launch/evidence/phase2_monitoring/baseline/`

### Log Files
- `backend_health.log` - Backend health check results
- `backend_metrics.log` - Backend Prometheus metrics
- `prometheus_health.log` - Prometheus health status
- `alertmanager_health.log` - Alertmanager health status
- `prometheus_targets.log` - Prometheus targets status
- `system_metrics.log` - System CPU/Memory/Disk metrics
- `baseline_alerts.log` - Critical alerts and failures
- `frontend.log` - Frontend console output
- `master_monitoring.log` - Master monitoring log

### Screenshots
Screenshots should be captured manually from:
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093

Screenshot checkpoints are logged in `master_monitoring.log`

---

## Recommendations

REPORT_EOF

# Add recommendations based on findings
if [ -f "$BASELINE_ALERTS_LOG" ] && [ -s "$BASELINE_ALERTS_LOG" ]; then
    cat >> "$REPORT_FILE" <<'REPORT_EOF'
⚠️ **Action Required:**
- Review `baseline_alerts.log` for repeated failures
- Investigate services that failed multiple consecutive health checks
- Address any DOWN Prometheus targets
- Consider restarting failed services

REPORT_EOF
fi

if [ "$BACKEND_STATUS" = "degraded" ]; then
    cat >> "$REPORT_FILE" <<'REPORT_EOF'
ℹ️ **Backend Status:**
- Backend is running in degraded mode (expected without PostgreSQL/Redis)
- This is acceptable for baseline monitoring
- To enable full functionality, start PostgreSQL and Redis

REPORT_EOF
fi

cat >> "$REPORT_FILE" <<'REPORT_EOF'
### Next Steps
1. Review all log files for anomalies
2. Analyze system metrics trends
3. Verify all Prometheus targets are UP
4. Proceed to Phase 3 (Load Testing) if all services are stable
5. Address any degraded services before production deployment

---

## Conclusion

24-hour baseline monitoring completed successfully.
REPORT_EOF

echo "Total monitoring iterations: $ITERATION" >> "$REPORT_FILE"
echo "Total screenshot checkpoints: $SCREENSHOT_COUNTER" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" <<'REPORT_EOF'

**Status:** ✅ MONITORING COMPLETE
REPORT_EOF

log_msg "Final report generated: $REPORT_FILE"

# Step 5: Completion Notification
log_msg ""
log_msg "========================================="
log_msg "✅ 24-Hour Baseline Monitoring Complete"
log_msg "========================================="
log_msg "🗂 All logs, screenshots, and report saved at:"
log_msg "   $BASELINE_DIR"
log_msg ""
log_msg "📊 Final Report: $REPORT_FILE"
log_msg "📝 Master Log: $MASTER_LOG"
log_msg ""
log_msg "Total Iterations: $ITERATION"
log_msg "Screenshot Checkpoints: $SCREENSHOT_COUNTER"
log_msg ""

echo ""
echo "========================================="
echo "✅ 24-Hour Baseline Monitoring Complete"
echo "========================================="
echo "🗂 All logs, screenshots, and report saved at:"
echo "   $BASELINE_DIR"
echo ""
echo "📊 Final Report: $REPORT_FILE"
echo ""

exit 0
