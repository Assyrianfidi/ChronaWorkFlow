#!/bin/bash
# Diagnose backend health endpoint issue and restart

set -e

PROJECT_ROOT="/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks"

echo "========================================="
echo "BACKEND DIAGNOSTICS AND RESTART"
echo "========================================="
echo ""

# Step 1: Check backend logs
echo "[1/5] Checking backend logs..."
echo "Last 50 lines of backend.log:"
echo "---"
tail -50 "$PROJECT_ROOT/backend.log"
echo "---"
echo ""

# Step 2: Test health endpoint directly
echo "[2/5] Testing health endpoint..."
echo "Attempting: curl -v http://localhost:5000/api/monitoring/health"
curl -v http://localhost:5000/api/monitoring/health 2>&1 || true
echo ""

# Step 3: Kill existing backend
echo "[3/5] Killing existing backend..."
sudo lsof -ti:5000 | xargs sudo kill -9 2>/dev/null || true
sleep 2
echo "✓ Backend processes killed"
echo ""

# Step 4: Restart backend
echo "[4/5] Restarting backend..."
cd "$PROJECT_ROOT"
nohup npm run start:dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Step 5: Wait and verify
echo "[5/5] Waiting for backend to start..."
MAX_WAIT=60
WAITED=0
BACKEND_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
    
    # Try to get health status
    HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/monitoring/health 2>/dev/null || echo "")
    
    if [ -n "$HEALTH_RESPONSE" ]; then
        echo "✓ Backend is responding!"
        echo "Health response:"
        echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
        BACKEND_READY=true
        break
    fi
    
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "  Still waiting... (${WAITED}/${MAX_WAIT}s)"
    fi
done

echo ""
if [ "$BACKEND_READY" = true ]; then
    echo "✅ Backend is healthy and responding"
    echo ""
    echo "Testing all monitoring endpoints:"
    echo "---"
    echo "Health:"
    curl -s http://localhost:5000/api/monitoring/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/monitoring/health
    echo ""
    echo "Live:"
    curl -s http://localhost:5000/api/monitoring/live | jq . 2>/dev/null || curl -s http://localhost:5000/api/monitoring/live
    echo ""
    echo "Ready:"
    curl -s http://localhost:5000/api/monitoring/ready | jq . 2>/dev/null || curl -s http://localhost:5000/api/monitoring/ready
    echo "---"
else
    echo "❌ Backend failed to start"
    echo "Last 30 lines of backend.log:"
    tail -30 "$PROJECT_ROOT/backend.log"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ DIAGNOSTICS COMPLETE"
echo "========================================="
