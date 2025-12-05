#!/bin/bash
set -e

# Create logrotate configuration for AccuBooks
LOG_DIR="$(pwd)/logs"
LOGROTATE_CONF="/etc/logrotate.d/accubooks"

# Create logs directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Create logrotate configuration
cat << EOF | sudo tee ${LOGROTATE_CONF} > /dev/null
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker-compose -f $(pwd)/docker-compose.prod.yml restart app nginx > /dev/null 2>&1 || true
    endscript
}
EOF

echo "✅ Logrotate configuration created at ${LOGROTATE_CONF}"
echo "📝 Logs directory: ${LOG_DIR}"
echo "🔍 To test log rotation, run: sudo logrotate -vf ${LOGROTATE_CONF}"
