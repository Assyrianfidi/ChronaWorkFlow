#!/bin/bash

# Test script to verify backend starts without Redis
# This confirms the permanent fix works

echo "========================================="
echo "BACKEND STANDALONE TEST"
echo "========================================="
echo ""

# Navigate to project root
cd /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks

# Kill any existing backend processes
echo "1. Cleaning up existing processes..."
pkill -9 -f "tsx server/index.ts" 2>/dev/null || true
pkill -9 -f "nodemon.*tsx.*server" 2>/dev/null || true
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi
rm -f backend.pid
echo "✓ Cleanup complete"
echo ""

# Clear backend log
echo "2. Clearing backend.log..."
> backend.log
echo "✓ Log cleared"
echo ""

# Start backend
echo "3. Starting backend..."
npm run start:dev > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait and monitor startup
echo "4. Monitoring startup (60 seconds)..."
for i in {1..60}; do
    echo -n "."
    
    # Check if process is still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo ""
        echo "✗ Backend process died!"
        echo ""
        echo "Last 50 lines of backend.log:"
        tail -n 50 backend.log
        exit 1
    fi
    
    # Check if server is responding
    if curl -s http://localhost:5000/api/monitoring/health > /dev/null 2>&1; then
        echo ""
        echo "✓ Backend responding!"
        break
    fi
    
    sleep 1
done
echo ""

# Verify endpoints
echo ""
echo "5. Verifying endpoints..."

# Health check
if curl -s http://localhost:5000/api/monitoring/health | grep -q "ok"; then
    echo "✓ /api/monitoring/health - OK"
else
    echo "✗ /api/monitoring/health - FAILED"
fi

# Metrics check
if curl -s http://localhost:5000/api/monitoring/metrics | grep -q "accubooks"; then
    echo "✓ /api/monitoring/metrics - OK"
else
    echo "✗ /api/monitoring/metrics - FAILED"
fi

echo ""
echo "6. Checking for Redis warnings in log..."
if grep -q "Redis not available" backend.log; then
    echo "✓ Found expected Redis warning (graceful degradation working)"
elif grep -q "Redis connection confirmed" backend.log; then
    echo "✓ Redis connected (job queues enabled)"
else
    echo "⚠ No Redis status found in log"
fi

echo ""
echo "7. Checking for crashes/errors..."
if grep -q "ERROR.*Worker error" backend.log; then
    echo "✗ Found worker errors (fix may not be working)"
    echo "Last 20 lines:"
    tail -n 20 backend.log
elif grep -q "unhandledRejection" backend.log; then
    echo "✗ Found unhandled rejection (fix may not be working)"
    echo "Last 20 lines:"
    tail -n 20 backend.log
else
    echo "✓ No crashes or unhandled rejections detected"
fi

echo ""
echo "========================================="
echo "TEST COMPLETE"
echo "========================================="
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Backend is running at: http://localhost:5000"
echo "Health check: http://localhost:5000/api/monitoring/health"
echo "Metrics: http://localhost:5000/api/monitoring/metrics"
echo ""
echo "To stop backend: kill $BACKEND_PID"
echo "To view logs: tail -f backend.log"
echo ""
