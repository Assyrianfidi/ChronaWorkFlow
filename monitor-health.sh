#!/bin/bash

# Health monitoring script for AccuBooks
echo "=== AccuBooks System Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check Docker containers
echo "🐳 Docker Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep accubooks
echo ""

# Check backend health
echo "🔧 Backend Health Check:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend: HTTP $BACKEND_STATUS - Healthy"
    curl -s http://localhost:3001/api/health | jq '.'
else
    echo "❌ Backend: HTTP $BACKEND_STATUS - Unhealthy"
fi
echo ""

# Check frontend health
echo "🌐 Frontend Health Check:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: HTTP $FRONTEND_STATUS - Healthy"
else
    echo "❌ Frontend: HTTP $FRONTEND_STATUS - Unhealthy"
fi
echo ""

# Check database health
echo "🗄️ Database Health Check:"
DB_STATUS=$(docker exec accubooks-postgres pg_isready -U postgres 2>/dev/null)
if [[ $DB_STATUS == *"accepting connections"* ]]; then
    echo "✅ PostgreSQL: $DB_STATUS"
else
    echo "❌ PostgreSQL: Not ready"
fi
echo ""

# Check Redis health
echo "📦 Redis Health Check:"
REDIS_STATUS=$(docker exec accubooks-redis redis-cli ping 2>/dev/null)
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "✅ Redis: PONG - Healthy"
else
    echo "❌ Redis: No response"
fi
echo ""

# System resources
echo "💻 System Resources:"
echo "Memory Usage: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Disk Usage: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo ""

echo "=== Health Check Complete ==="
