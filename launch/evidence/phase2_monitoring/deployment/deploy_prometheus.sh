#!/bin/bash
# PHASE 2 MONITORING - PROMETHEUS DEPLOYMENT SCRIPT
# AccuBooks v1.0.4 - Validation Execution Mode

set -e

echo "=========================================="
echo "PHASE 2: PROMETHEUS DEPLOYMENT"
echo "=========================================="

# Configuration
PROMETHEUS_VERSION="2.45.0"
INSTALL_DIR="/opt/accubooks/monitoring"
PROMETHEUS_PORT="9090"
ACCUBOOKS_API_URL="localhost:5000"

# Create installation directory
echo "Creating installation directory..."
sudo mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Download Prometheus
echo "Downloading Prometheus v${PROMETHEUS_VERSION}..."
wget https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz

# Extract
echo "Extracting Prometheus..."
tar xvfz prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz
cd prometheus-${PROMETHEUS_VERSION}.linux-amd64

# Copy alert rules
echo "Copying alert rules..."
cp ../../../../launch/evidence/phase2_monitoring/alerts/alert_rules.yml .

# Create Prometheus configuration
echo "Creating Prometheus configuration..."
cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'accubooks-production'
    environment: 'validation'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'accubooks-api'
    static_configs:
      - targets: ['${ACCUBOOKS_API_URL}']
    metrics_path: '/api/monitoring/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  - job_name: 'accubooks-health'
    static_configs:
      - targets: ['${ACCUBOOKS_API_URL}']
    metrics_path: '/api/monitoring/health'
    scrape_interval: 60s
    scrape_timeout: 10s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:${PROMETHEUS_PORT}']
EOF

# Create systemd service
echo "Creating systemd service..."
sudo cat > /etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus \\
  --config.file=${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus.yml \\
  --storage.tsdb.path=${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64/data \\
  --storage.tsdb.retention.time=90d \\
  --web.console.templates=${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64/consoles \\
  --web.console.libraries=${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64/console_libraries \\
  --web.listen-address=0.0.0.0:${PROMETHEUS_PORT}

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

# Create prometheus user
echo "Creating prometheus user..."
sudo useradd --no-create-home --shell /bin/false prometheus || true

# Set permissions
echo "Setting permissions..."
sudo chown -R prometheus:prometheus ${INSTALL_DIR}/prometheus-${PROMETHEUS_VERSION}.linux-amd64

# Reload systemd and start Prometheus
echo "Starting Prometheus..."
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Wait for startup
echo "Waiting for Prometheus to start..."
sleep 5

# Verify Prometheus is running
if curl -s http://localhost:${PROMETHEUS_PORT}/-/healthy | grep -q "Prometheus is Healthy"; then
    echo "✅ Prometheus is running successfully!"
    echo "✅ UI available at: http://localhost:${PROMETHEUS_PORT}"
else
    echo "❌ Prometheus failed to start. Check logs: sudo journalctl -u prometheus -f"
    exit 1
fi

# Check targets
echo ""
echo "Checking targets..."
curl -s http://localhost:${PROMETHEUS_PORT}/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo ""
echo "=========================================="
echo "PROMETHEUS DEPLOYMENT COMPLETE"
echo "=========================================="
echo "Next steps:"
echo "1. Verify targets are UP: http://localhost:${PROMETHEUS_PORT}/targets"
echo "2. Verify alerts loaded: http://localhost:${PROMETHEUS_PORT}/alerts"
echo "3. Deploy Grafana: ./deploy_grafana.sh"
echo "=========================================="
