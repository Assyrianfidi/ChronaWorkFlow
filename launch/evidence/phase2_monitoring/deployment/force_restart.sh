#!/bin/bash
# Force restart backend with clean cache

set -e

PROJECT_ROOT="/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks"

echo "========================================="
echo "FORCE RESTART WITH CLEAN CACHE"
echo "========================================="
echo ""

# Kill ALL node processes
echo "[1/5] Killing all node processes..."
sudo pkill -9 node 2>/dev/null || true
sudo pkill -9 tsx 2>/dev/null || true
sudo pkill -9 nodemon 2>/dev/null || true
sleep 3
echo "✓ All node processes killed"
echo ""

# Clear any TSX/Node cache
echo "[2/5] Clearing caches..."
cd "$PROJECT_ROOT"
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .tsx 2>/dev/null || true
rm -rf dist 2>/dev/null || true
echo "✓ Caches cleared"
echo ""

# Verify the authentication bypass code is in place
echo "[3/5] Verifying authentication bypass code..."
if grep -q "next('route')" server/app.ts; then
    echo "✓ Authentication bypass code found in server/app.ts"
else
    echo "❌ Authentication bypass code NOT found!"
    echo "Showing current middleware code:"
    grep -A 10 "Apply authentication" server/app.ts
    exit 1
fi
echo ""

# Start backend fresh
echo "[4/5] Starting backend with clean state..."
nohup npm run start:dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait and test
echo "[5/5] Waiting for backend and testing..."
MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
    
    # Test health endpoint
    RESPONSE=$(curl -s http://localhost:5000/api/monitoring/health 2>/dev/null || echo "")
    
    if [ -n "$RESPONSE" ]; then
        echo "Response received:"
        echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
        
        # Check if it's a valid health response (not auth error)
        if echo "$RESPONSE" | grep -q '"status"'; then
            STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null || echo "")
            if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; then
                echo ""
                echo "✅ SUCCESS! Backend responding with status: $STATUS"
                echo ""
                echo "Testing all monitoring endpoints:"
                echo "---"
                echo "Health:"
                curl -s http://localhost:5000/api/monitoring/health | jq . 2>/dev/null
                echo ""
                echo "Live:"
                curl -s http://localhost:5000/api/monitoring/live | jq . 2>/dev/null
                echo ""
                echo "Ready:"
                curl -s http://localhost:5000/api/monitoring/ready | jq . 2>/dev/null
                echo "---"
                exit 0
            fi
        elif echo "$RESPONSE" | grep -q "Authentication required"; then
            echo "❌ Still getting authentication error!"
            echo "The code changes are not being loaded."
            echo ""
            echo "Checking if server/app.ts has the correct code..."
            grep -A 15 "Apply authentication" "$PROJECT_ROOT/server/app.ts"
            exit 1
        fi
    fi
    
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "  Still waiting... (${WAITED}/${MAX_WAIT}s)"
    fi
done

echo ""
echo "❌ Timeout waiting for backend"
echo "Last 30 lines of backend.log:"
tail -30 "$PROJECT_ROOT/backend.log"
exit 1
