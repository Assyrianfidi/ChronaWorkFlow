#!/bin/bash
# PHASE 2 MONITORING - ALERT MANAGER DEPLOYMENT SCRIPT
# AccuBooks v1.0.4 - Validation Execution Mode

set -e

echo "=========================================="
echo "PHASE 2: ALERT MANAGER DEPLOYMENT"
echo "=========================================="

# Configuration
ALERTMANAGER_VERSION="0.26.0"
INSTALL_DIR="/opt/accubooks/monitoring"
ALERTMANAGER_PORT="9093"

# Prompt for credentials
echo "Alert Manager requires integration credentials."
echo "Please provide the following:"
read -p "Email SMTP server (e.g., smtp.gmail.com:587): " SMTP_SERVER
read -p "Email from address: " EMAIL_FROM
read -p "Email to address (alerts): " EMAIL_TO
read -sp "Email password: " EMAIL_PASSWORD
echo ""
read -p "PagerDuty service key: " PAGERDUTY_KEY
read -p "Slack webhook URL: " SLACK_WEBHOOK

# Create installation directory
echo "Creating installation directory..."
sudo mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Download Alert Manager
echo "Downloading Alert Manager v${ALERTMANAGER_VERSION}..."
wget https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz

# Extract
echo "Extracting Alert Manager..."
tar xvfz alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz
cd alertmanager-${ALERTMANAGER_VERSION}.linux-amd64

# Create Alert Manager configuration
echo "Creating Alert Manager configuration..."
cat > alertmanager.yml <<EOF
global:
  resolve_timeout: 5m
  smtp_smarthost: '${SMTP_SERVER}'
  smtp_from: '${EMAIL_FROM}'
  smtp_auth_username: '${EMAIL_FROM}'
  smtp_auth_password: '${EMAIL_PASSWORD}'

route:
  group_by: ['alertname', 'severity', 'component']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: critical
      receiver: 'email-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'
    - match:
        severity: info
      receiver: 'slack-info'

receivers:
  - name: 'default'
    email_configs:
      - to: '${EMAIL_TO}'
        headers:
          Subject: '[AccuBooks Alert] {{ .GroupLabels.alertname }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_KEY}'
        description: '{{ .CommonAnnotations.summary }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'
          component: '{{ .GroupLabels.component }}'

  - name: 'email-critical'
    email_configs:
      - to: '${EMAIL_TO}'
        headers:
          Subject: '[CRITICAL] AccuBooks Alert: {{ .GroupLabels.alertname }}'
        html: |
          <h2>Critical Alert: {{ .GroupLabels.alertname }}</h2>
          <p><strong>Severity:</strong> {{ .GroupLabels.severity }}</p>
          <p><strong>Component:</strong> {{ .GroupLabels.component }}</p>
          <p><strong>Summary:</strong> {{ .CommonAnnotations.summary }}</p>
          <p><strong>Description:</strong> {{ .CommonAnnotations.description }}</p>
          <p><strong>Runbook:</strong> {{ .CommonAnnotations.runbook }}</p>

  - name: 'slack-warnings'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#accubooks-alerts'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
        color: 'warning'

  - name: 'slack-info'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#accubooks-alerts'
        title: 'Info: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
        color: 'good'
EOF

# Create systemd service
echo "Creating systemd service..."
sudo cat > /etc/systemd/system/alertmanager.service <<EOF
[Unit]
Description=Prometheus Alert Manager
Documentation=https://prometheus.io/docs/alerting/alertmanager/
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=${INSTALL_DIR}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager \\
  --config.file=${INSTALL_DIR}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager.yml \\
  --storage.path=${INSTALL_DIR}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/data \\
  --web.listen-address=0.0.0.0:${ALERTMANAGER_PORT}

Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
echo "Setting permissions..."
sudo chown -R prometheus:prometheus ${INSTALL_DIR}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64

# Reload systemd and start Alert Manager
echo "Starting Alert Manager..."
sudo systemctl daemon-reload
sudo systemctl enable alertmanager
sudo systemctl start alertmanager

# Wait for startup
echo "Waiting for Alert Manager to start..."
sleep 5

# Verify Alert Manager is running
if curl -s http://localhost:${ALERTMANAGER_PORT}/-/healthy | grep -q "OK"; then
    echo "✅ Alert Manager is running successfully!"
    echo "✅ UI available at: http://localhost:${ALERTMANAGER_PORT}"
else
    echo "❌ Alert Manager failed to start. Check logs: sudo journalctl -u alertmanager -f"
    exit 1
fi

echo ""
echo "=========================================="
echo "ALERT MANAGER DEPLOYMENT COMPLETE"
echo "=========================================="
echo "Next steps:"
echo "1. Verify Alert Manager UI: http://localhost:${ALERTMANAGER_PORT}"
echo "2. Test alerts: ./test_alerts.sh"
echo "=========================================="
