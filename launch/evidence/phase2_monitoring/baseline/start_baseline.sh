#!/bin/bash
# Phase 2 Baseline Monitoring Starter

PROJECT_ROOT="/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks"
BASELINE_DIR="$PROJECT_ROOT/launch/evidence/phase2_monitoring/baseline"

mkdir -p "$BASELINE_DIR"

echo "Starting Phase 2 Baseline Monitoring..."

# Start frontend
cd "$PROJECT_ROOT"
nohup npm run dev > "$BASELINE_DIR/frontend.log" 2>&1 &
echo "Frontend started (PID: $!)"

# Verify backend
for i in {1..3}; do
    if curl -s http://localhost:5000/api/monitoring/health >/dev/null; then
        echo "✓ Backend healthy"
        break
    fi
    sleep 5
done

# Verify Prometheus
curl -s http://localhost:9090/-/healthy && echo "✓ Prometheus healthy" || echo "✗ Prometheus down"

# Check targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}' > "$BASELINE_DIR/targets_status.json"

echo "Baseline monitoring initialized. Check $BASELINE_DIR for logs."
