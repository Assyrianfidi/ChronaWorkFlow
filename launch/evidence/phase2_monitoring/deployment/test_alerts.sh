#!/bin/bash
# PHASE 2 MONITORING - ALERT TESTING SCRIPT
# AccuBooks v1.0.4 - Validation Execution Mode

set -e

echo "=========================================="
echo "PHASE 2: ALERT TESTING"
echo "=========================================="

PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"

echo "This script will fire test alerts to verify:"
echo "- P0 alerts → PagerDuty"
echo "- P1 alerts → Email"
echo "- P2 alerts → Slack"
echo ""
read -p "Press Enter to continue..."

# Test P0 Alert (Critical)
echo ""
echo "=========================================="
echo "TEST 1: P0 CRITICAL ALERT"
echo "=========================================="
echo "Firing test P0 alert (SystemUnreachable)..."

curl -X POST ${ALERTMANAGER_URL}/api/v1/alerts -H "Content-Type: application/json" -d '[
  {
    "labels": {
      "alertname": "SystemUnreachable",
      "severity": "critical",
      "component": "api"
    },
    "annotations": {
      "summary": "TEST ALERT: System is unreachable",
      "description": "This is a test P0 alert for validation purposes.",
      "runbook": "OPERATIONAL_RUNBOOK.md#p0-1-system-down"
    },
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "endsAt": "'$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%SZ)'"
  }
]'

echo ""
echo "✅ P0 alert fired!"
echo "⏳ Check PagerDuty for notification (should arrive within 60 seconds)"
echo ""
read -p "Did you receive PagerDuty notification? (y/n): " PAGERDUTY_RECEIVED

if [ "$PAGERDUTY_RECEIVED" != "y" ]; then
    echo "❌ P0 alert test FAILED - PagerDuty not received"
    exit 1
fi

echo "✅ P0 alert test PASSED"

# Test P1 Alert (Warning)
echo ""
echo "=========================================="
echo "TEST 2: P1 WARNING ALERT"
echo "=========================================="
echo "Firing test P1 alert (HighErrorRate)..."

curl -X POST ${ALERTMANAGER_URL}/api/v1/alerts -H "Content-Type: application/json" -d '[
  {
    "labels": {
      "alertname": "HighErrorRate",
      "severity": "warning",
      "component": "api"
    },
    "annotations": {
      "summary": "TEST ALERT: High error rate detected",
      "description": "This is a test P1 alert for validation purposes.",
      "runbook": "OPERATIONAL_RUNBOOK.md#p1-1-high-error-rate"
    },
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "endsAt": "'$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%SZ)'"
  }
]'

echo ""
echo "✅ P1 alert fired!"
echo "⏳ Check Email for notification (should arrive within 5 minutes)"
echo ""
read -p "Did you receive Email notification? (y/n): " EMAIL_RECEIVED

if [ "$EMAIL_RECEIVED" != "y" ]; then
    echo "❌ P1 alert test FAILED - Email not received"
    exit 1
fi

echo "✅ P1 alert test PASSED"

# Test P2 Alert (Info)
echo ""
echo "=========================================="
echo "TEST 3: P2 INFO ALERT"
echo "=========================================="
echo "Firing test P2 alert (QueueDepthHigh)..."

curl -X POST ${ALERTMANAGER_URL}/api/v1/alerts -H "Content-Type: application/json" -d '[
  {
    "labels": {
      "alertname": "QueueDepthHigh",
      "severity": "info",
      "component": "queue"
    },
    "annotations": {
      "summary": "TEST ALERT: Queue depth is high",
      "description": "This is a test P2 alert for validation purposes.",
      "runbook": "OPERATIONAL_RUNBOOK.md#p1-3-queue-overflow"
    },
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "endsAt": "'$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%SZ)'"
  }
]'

echo ""
echo "✅ P2 alert fired!"
echo "⏳ Check Slack for notification"
echo ""
read -p "Did you receive Slack notification? (y/n): " SLACK_RECEIVED

if [ "$SLACK_RECEIVED" != "y" ]; then
    echo "❌ P2 alert test FAILED - Slack not received"
    exit 1
fi

echo "✅ P2 alert test PASSED"

# Save test results
echo ""
echo "Saving test results..."
EVIDENCE_DIR="../../../../launch/evidence/phase2_monitoring/baseline"
mkdir -p $EVIDENCE_DIR

cat > $EVIDENCE_DIR/alert_test_results.txt <<EOF
PHASE 2 MONITORING - ALERT TEST RESULTS
Date: $(date)

TEST 1: P0 CRITICAL ALERT
Alert: SystemUnreachable
Target: PagerDuty
Result: PASSED
Received: Yes

TEST 2: P1 WARNING ALERT
Alert: HighErrorRate
Target: Email
Result: PASSED
Received: Yes

TEST 3: P2 INFO ALERT
Alert: QueueDepthHigh
Target: Slack
Result: PASSED
Received: Yes

OVERALL RESULT: ALL TESTS PASSED
EOF

echo ""
echo "=========================================="
echo "ALERT TESTING COMPLETE"
echo "=========================================="
echo "✅ All alert tests PASSED"
echo "✅ Results saved to: $EVIDENCE_DIR/alert_test_results.txt"
echo ""
echo "Next steps:"
echo "1. Begin 24-hour baseline monitoring"
echo "2. Capture evidence screenshots"
echo "3. Complete verification checklist"
echo "=========================================="
