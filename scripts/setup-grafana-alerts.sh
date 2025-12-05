#!/bin/bash

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
until curl -s http://localhost:3000/api/health; do
  sleep 5
done

# Get authentication token
echo "🔑 Authenticating with Grafana..."
auth=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"name":"apikey", "role": "Admin"}' \
  http://admin:${GRAFANA_ADMIN_PASSWORD:-admin}@localhost:3000/api/auth/keys)

if [ $? -ne 0 ]; then
  echo "❌ Failed to authenticate with Grafana"
  exit 1
fi

key=$(echo $auth | jq -r '.key')
if [ -z "$key" ] || [ "$key" = "null" ]; then
  echo "❌ Failed to get API key from Grafana"
  exit 1
fi

# Create alert rules
echo "🚀 Creating alert rules..."

# CPU Alert
curl -s -X POST "http://localhost:3000/api/v1/provisioning/alert-rules" \
  -H "Authorization: Bearer $key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High CPU Usage",
    "condition": "C",
    "data": [
      {
        "refId": "A",
        "query": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100",
        "queryType": "timeSeriesQuery",
        "datasourceUid": "prometheus"
      },
      {
        "refId": "B",
        "query": "80",
        "queryType": "expression"
      },
      {
        "refId": "C",
        "query": "$A > $B",
        "queryType": "expression"
      }
    ],
    "noDataState": "OK",
    "execErrState": "Error",
    "for": "5m",
    "annotations": {
      "summary": "High CPU usage on {{ $labels.instance }}",
      "description": "CPU usage is {{ $value }}%"
    },
    "labels": {
      "severity": "warning"
    }
  }'

# Memory Alert
curl -s -X POST "http://localhost:3000/api/v1/provisioning/alert-rules" \
  -H "Authorization: Bearer $key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High Memory Usage",
    "condition": "C",
    "data": [
      {
        "refId": "A",
        "query": "100 * (1 - ((avg_over_time(node_memory_MemAvailable_bytes[5m]) * 100) / avg_over_time(node_memory_MemTotal_bytes[5m])))",
        "queryType": "timeSeriesQuery",
        "datasourceUid": "prometheus"
      },
      {
        "refId": "B",
        "query": "75",
        "queryType": "expression"
      },
      {
        "refId": "C",
        "query": "$A > $B",
        "queryType": "expression"
      }
    ],
    "noDataState": "OK",
    "execErrState": "Error",
    "for": "5m",
    "annotations": {
      "summary": "High memory usage on {{ $labels.instance }}",
      "description": "Memory usage is {{ $value }}%"
    },
    "labels": {
      "severity": "warning"
    }
  }'

# Disk Alert
curl -s -X POST "http://localhost:3000/api/v1/provisioning/alert-rules" \
  -H "Authorization: Bearer $key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High Disk Usage",
    "condition": "C",
    "data": [
      {
        "refId": "A",
        "query": "100 - (node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"} * 100) / node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}",
        "queryType": "timeSeriesQuery",
        "datasourceUid": "prometheus"
      },
      {
        "refId": "B",
        "query": "85",
        "queryType": "expression"
      },
      {
        "refId": "C",
        "query": "$A > $B",
        "queryType": "expression"
      }
    ],
    "noDataState": "OK",
    "execErrState": "Error",
    "for": "15m",
    "annotations": {
      "summary": "High disk usage on {{ $labels.instance }}",
      "description": "Disk usage is {{ $value }}%"
    },
    "labels": {
      "severity": "critical"
    }
  }'

echo "✅ Alert rules created successfully"
