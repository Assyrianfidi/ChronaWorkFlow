#!/bin/bash

# Kill any existing backend processes

echo "Stopping existing backend processes..."

# Kill by PID file if it exists
if [ -f "/mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.pid" ]; then
    PID=$(cat /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Killing backend process (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
    rm -f /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.pid
fi

# Kill any node/tsx/nodemon processes running server/index.ts
pkill -9 -f "tsx server/index.ts" 2>/dev/null || true
pkill -9 -f "nodemon.*tsx.*server" 2>/dev/null || true
pkill -9 -f "node.*server/index" 2>/dev/null || true

# Kill any processes on port 5000
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port 5000"
    lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

# Clear backend log
echo "Clearing backend.log..."
> /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks/backend.log

echo "✓ Backend processes stopped and log cleared"
echo "You can now run: sudo ./deploy_all.sh"
