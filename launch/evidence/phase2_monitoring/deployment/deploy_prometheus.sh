#!/bin/bash
# =========================================================
# PHASE 2 MONITORING - PROMETHEUS DEPLOYMENT SCRIPT
# AccuBooks v1.0.4 - Validation Execution Mode
# Authoritative, self-contained, WSL-safe
# =========================================================

set -e

echo "=========================================="
echo "PHASE 2: PROMETHEUS DEPLOYMENT"
echo "=========================================="

# -----------------------------
# Configuration
# -----------------------------
PROMETHEUS_VERSION="2.45.0"
BASE_DIR="/opt/accubooks/monitoring"
PROMETHEUS_DIR="${BASE_DIR}/prometheus"
ALERTS_DIR="${BASE_DIR}/alerts"
PROMETHEUS_PORT="9090"
ACCUBOOKS_API_URL="localhost:5000"

TARBALL="prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
EXTRACTED_DIR="prometheus-${PROMETHEUS_VERSION}.linux-amd64"

# -----------------------------
# Create directories
# -----------------------------
echo "Creating directories..."
sudo mkdir -p "$PROMETHEUS_DIR"
sudo mkdir -p "$ALERTS_DIR"

cd /tmp

# -----------------------------
# Download Prometheus
# -----------------------------
if [ ! -f "$TARBALL" ]; then
  echo "Downloading Prometheus v${PROMETHEUS_VERSION}..."
  wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/${TARBALL}
else
  echo "Prometheus tarball already exists, skipping download."
fi

# -----------------------------
# Extract Prometheus
# -----------------------------
echo "Extracting Prometheus..."
tar xzf "$TARBALL"

# -----------------------------
# Install Prometheus binaries
# -----------------------------
echo "Installing Prometheus..."
sudo cp "${EXTRACTED_DIR}/prometheus" /usr/local/bin/
sudo cp "${EXTRACTED_DIR}/promtool" /usr/local/bin/

sudo cp -r "${EXTRACTED_DIR}/consoles" "$PROMETHEUS_DIR/"
sudo cp -r "${EXTRACTED_DIR}/console_libraries" "$PROMETHEUS_DIR/"

# -----------------------------
# Write Alert Rules (INLINE)
# -----------------------------
echo "Writing alert rules..."
sudo tee "${ALERTS_DIR}/alert_rules.yml" > /dev/null <<'EOF'
groups:
  - name: accubooks_critical_alerts
    interval: 30s
    rules:

      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
          priority: P0
        annotations:
          summary: "High error rate detected"
          description: "5xx error rate exceeds 1% for 5 minutes"
          action: "Investigate immediately"

      - alert: DatabasePoolExhaustion
        expr: db_pool_utilization_percent > 90
        for: 5m
        labels:
          severity: critical
          priority: P0
        annotations:
          summary: "Database connection pool exhausted"
          description: "Database pool utilization above 90%"
          action: "Immediate DBA review required"

      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          priority: P0
        annotations:
          summary: "Service is down"
          description: "Target has been unreachable for more than 2 minutes"
          action: "Immediate investigation required"
EOF

# -----------------------------
# Write Prometheus config
# -----------------------------
echo "Writing prometheus.yml..."
sudo tee "${PROMETHEUS_DIR}/prometheus.yml" > /dev/null <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "${ALERTS_DIR}/alert_rules.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:${PROMETHEUS_PORT}"]

  - job_name: "accubooks-api"
    metrics_path: /metrics
    static_configs:
      - targets: ["${ACCUBOOKS_API_URL}"]
EOF

# -----------------------------
# Validate configuration
# -----------------------------
echo "Validating Prometheus configuration..."
promtool check config "${PROMETHEUS_DIR}/prometheus.yml"

# -----------------------------
# Start Prometheus
# -----------------------------
echo "Starting Prometheus..."
nohup prometheus \
  --config.file="${PROMETHEUS_DIR}/prometheus.yml" \
  --storage.tsdb.path="${PROMETHEUS_DIR}/data" \
  --web.listen-address=":${PROMETHEUS_PORT}" \
  > "${PROMETHEUS_DIR}/prometheus.log" 2>&1 &

echo "=========================================="
echo "✅ PROMETHEUS DEPLOYED SUCCESSFULLY"
echo "🌐 UI: http://localhost:${PROMETHEUS_PORT}"
echo "📁 Config: ${PROMETHEUS_DIR}"
echo "📁 Alerts: ${ALERTS_DIR}"
echo "=========================================="
