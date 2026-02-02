#!/bin/bash
# Verify complete deployment status

echo "========================================="
echo "ACCUBOOKS DEPLOYMENT VERIFICATION"
echo "========================================="
echo ""

# Check backend
echo "🔍 Backend Status:"
if curl -s http://localhost:5000/api/monitoring/health >/dev/null 2>&1; then
    STATUS=$(curl -s http://localhost:5000/api/monitoring/health | jq -r '.status' 2>/dev/null)
    echo "  ✅ Backend running on port 5000"
    echo "  Status: $STATUS"
else
    echo "  ❌ Backend not responding"
fi
echo ""

# Check Prometheus
echo "🔍 Prometheus Status:"
if curl -s http://localhost:9090/-/healthy >/dev/null 2>&1; then
    echo "  ✅ Prometheus running on port 9090"
    echo "  URL: http://localhost:9090"
else
    echo "  ❌ Prometheus not responding"
fi
echo ""

# Check metrics endpoint
echo "🔍 Metrics Endpoint:"
if curl -s http://localhost:5000/api/monitoring/metrics | grep -q "accubooks_"; then
    echo "  ✅ Metrics endpoint responding"
    METRIC_COUNT=$(curl -s http://localhost:5000/api/monitoring/metrics | grep -c "accubooks_")
    echo "  Metrics available: $METRIC_COUNT"
else
    echo "  ❌ Metrics endpoint not responding"
fi
echo ""

# Check Prometheus targets
echo "🔍 Prometheus Targets:"
if curl -s http://localhost:9090/api/v1/targets 2>/dev/null | grep -q "accubooks-api"; then
    echo "  ✅ AccuBooks target configured in Prometheus"
else
    echo "  ⚠️  AccuBooks target may not be configured"
fi
echo ""

echo "========================================="
echo "✅ DEPLOYMENT VERIFICATION COMPLETE"
echo "========================================="
echo ""
echo "📊 Quick Access URLs:"
echo "  Backend Health:  http://localhost:5000/api/monitoring/health"
echo "  Backend Metrics: http://localhost:5000/api/monitoring/metrics"
echo "  Prometheus:      http://localhost:9090"
echo "  Prom Targets:    http://localhost:9090/targets"
echo ""
