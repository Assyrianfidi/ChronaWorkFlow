#!/bin/bash
# PHASE 2 MONITORING - GRAFANA DEPLOYMENT SCRIPT
# AccuBooks v1.0.4 - Validation Execution Mode

set -e

echo "=========================================="
echo "PHASE 2: GRAFANA DEPLOYMENT"
echo "=========================================="

# Configuration
GRAFANA_PORT="3000"
PROMETHEUS_URL="http://localhost:9090"

# Install Grafana (Ubuntu/Debian)
echo "Installing Grafana..."
sudo apt-get install -y software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update
sudo apt-get install -y grafana

# Start Grafana
echo "Starting Grafana..."
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Wait for startup
echo "Waiting for Grafana to start..."
sleep 10

# Verify Grafana is running
if curl -s http://localhost:${GRAFANA_PORT}/api/health | grep -q "ok"; then
    echo "✅ Grafana is running successfully!"
    echo "✅ UI available at: http://localhost:${GRAFANA_PORT}"
    echo "✅ Default credentials: admin/admin"
else
    echo "❌ Grafana failed to start. Check logs: sudo journalctl -u grafana-server -f"
    exit 1
fi

# Configure Prometheus data source via API
echo ""
echo "Configuring Prometheus data source..."
curl -X POST http://admin:admin@localhost:${GRAFANA_PORT}/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AccuBooks Prometheus",
    "type": "prometheus",
    "url": "'${PROMETHEUS_URL}'",
    "access": "proxy",
    "isDefault": true
  }'

echo ""
echo "Importing dashboards..."

# Import Executive Overview Dashboard
curl -X POST http://admin:admin@localhost:${GRAFANA_PORT}/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @../../../../launch/evidence/phase2_monitoring/dashboards/executive_overview.json

echo ""
echo "=========================================="
echo "GRAFANA DEPLOYMENT COMPLETE"
echo "=========================================="
echo "Next steps:"
echo "1. Login to Grafana: http://localhost:${GRAFANA_PORT}"
echo "2. Change default password (admin/admin)"
echo "3. Verify dashboards are visible"
echo "4. Deploy Alert Manager: ./deploy_alertmanager.sh"
echo "=========================================="
