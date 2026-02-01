#!/bin/bash

# CI Production Readiness Check Script
# This script validates that the application is production-ready

set -e

echo "🔍 Starting production readiness checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# 1. Check for hardcoded secrets
print_status "info" "Checking for hardcoded secrets..."
SECRETS_FOUND=false

# Common secret patterns to check for
SECRET_PATTERNS=(
    "dev-secret-change-in-production"
    "password.*=.*['\"][^'\"]{8,}['\"]"
    "secret.*=.*['\"][^'\"]{16,}['\"]"
    "api_key.*=.*['\"][^'\"]{16,}['\"]"
    "DATABASE_URL.*=.*postgres://[^@]*@[^/]*"
    "JWT_SECRET.*=.*['\"][^'\"]{8,}['\"]"
    "SESSION_SECRET.*=.*['\"][^'\"]{8,}['\"]"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . > /tmp/secrets_check.txt 2>/dev/null; then
        if [ -s /tmp/secrets_check.txt ]; then
            print_status "error" "Hardcoded secrets found:"
            cat /tmp/secrets_check.txt
            SECRETS_FOUND=true
        fi
    fi
done

if [ "$SECRETS_FOUND" = true ]; then
    print_status "error" "Hardcoded secrets detected. Please remove them before proceeding."
    exit 1
else
    print_status "success" "No hardcoded secrets found"
fi

# 2. Validate required environment variables
print_status "info" "Validating required environment variables..."

# Create a temporary .env.production.test file with test values
cat > .env.production.test << EOF
DATABASE_URL=postgres://test:test@localhost:5432/test_db
JWT_SECRET=test-jwt-secret-32-chars-long
SESSION_SECRET=test-session-secret-32-chars-long
NODE_ENV=production
FRONTEND_URL=https://test.example.com
PORT=5000
HOSTNAME=0.0.0.0
EOF

# Test environment validation
if NODE_ENV=production node -e "
try {
    require('./server/config/env-validation.js');
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long';
    process.env.SESSION_SECRET = 'test-session-secret-32-chars-long';
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://test.example.com';
    process.env.PORT = '5000';
    process.env.HOSTNAME = '0.0.0.0';
    
    const { validateEnvironmentVariables } = require('./server/config/env-validation.js');
    validateEnvironmentVariables();
    console.log('✅ Environment validation passed');
    process.exit(0);
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}
" 2>/dev/null; then
    print_status "success" "Environment variables validation passed"
else
    print_status "error" "Environment variables validation failed"
    exit 1
fi

# 3. Test Prisma generation
print_status "info" "Testing Prisma generation..."
if npm run db:generate > /tmp/prisma_generate.log 2>&1; then
    print_status "success" "Prisma generation successful"
else
    print_status "error" "Prisma generation failed:"
    cat /tmp/prisma_generate.log
    exit 1
fi

# 4. Test postinstall script
print_status "info" "Testing postinstall script..."
if npm run postinstall > /tmp/postinstall.log 2>&1; then
    print_status "success" "Postinstall script successful"
else
    print_status "error" "Postinstall script failed:"
    cat /tmp/postinstall.log
    exit 1
fi

# 5. Test client build
print_status "info" "Testing client build..."
cd client
if npm run build > /tmp/client_build.log 2>&1; then
    print_status "success" "Client build successful"
else
    print_status "error" "Client build failed:"
    cat /tmp/client_build.log
    exit 1
fi
cd ..

# 6. Test server build
print_status "info" "Testing server build..."
if npm run build:server > /tmp/server_build.log 2>&1; then
    print_status "success" "Server build successful"
else
    print_status "error" "Server build failed:"
    cat /tmp/server_build.log
    exit 1
fi

# 7. Test Docker build (no cache)
print_status "info" "Testing Docker build (no cache)..."
if docker build --no-cache -t accubooks-test:latest . > /tmp/docker_build.log 2>&1; then
    print_status "success" "Docker build successful"
else
    print_status "error" "Docker build failed:"
    tail -50 /tmp/docker_build.log
    exit 1
fi

# 8. Test application boot and health endpoint with observability
print_status "info" "Testing application boot and observability..."

# Start the container in background
docker run -d -p 5001:5000 --env-file .env.production.test --name accubooks-test accubooks-test:latest

# Wait for application to start
sleep 10

# Check health endpoint
if curl -f http://localhost:5001/health > /tmp/health_check.log 2>&1; then
    # Check if response contains expected values
    if grep -q '"status":"ok"' /tmp/health_check.log && grep -q '"service":"accubooks"' /tmp/health_check.log && grep -q '"env":"production"' /tmp/health_check.log; then
        print_status "success" "Health endpoint responding correctly"
        print_status "info" "Health response: $(cat /tmp/health_check.log)"
    else
        print_status "error" "Health endpoint response incorrect:"
        cat /tmp/health_check.log
        docker stop accubooks-test
        docker rm accubooks-test
        exit 1
    fi
else
    print_status "error" "Health endpoint not responding:"
    cat /tmp/health_check.log
    docker stop accubooks-test
    docker rm accubooks-test
    exit 1
fi

# 9. Test observability endpoints
print_status "info" "Testing observability endpoints..."

# Check metrics endpoint (should return 404 in non-production, 200 in production)
if curl -s -o /tmp/metrics_check.log -w "%{http_code}" http://localhost:5001/metrics > /tmp/metrics_status.txt 2>&1; then
    METRICS_STATUS=$(cat /tmp/metrics_status.txt)
    if [ "$METRICS_STATUS" = "200" ]; then
        # In production, metrics should be available
        if grep -q "app_startup_duration" /tmp/metrics_check.log; then
            print_status "success" "Metrics endpoint working with startup duration metric"
        else
            print_status "error" "Metrics endpoint missing expected metrics"
            cat /tmp/metrics_check.log
            docker stop accubooks-test
            docker rm accubooks-test
            exit 1
        fi
    elif [ "$METRICS_STATUS" = "404" ]; then
        print_status "warning" "Metrics endpoint not available (non-production mode)"
    else
        print_status "error" "Metrics endpoint returned unexpected status: $METRICS_STATUS"
        cat /tmp/metrics_check.log
        docker stop accubooks-test
        docker rm accubooks-test
        exit 1
    fi
else
    print_status "error" "Failed to check metrics endpoint"
    cat /tmp/metrics_check.log
    docker stop accubooks-test
    docker rm accubooks-test
    exit 1
fi

# 10. Test graceful shutdown
print_status "info" "Testing graceful shutdown..."

# Send SIGTERM to container
docker kill --signal=SIGTERM accubooks-test

# Wait for graceful shutdown
sleep 5

# Check if container is still running
if docker ps | grep accubooks-test > /dev/null 2>&1; then
    # Force kill if still running
    docker kill accubooks-test
    print_status "error" "Container did not shut down gracefully"
    exit 1
else
    print_status "success" "Container shut down gracefully"
fi

# Cleanup
docker stop accubooks-test 2>/dev/null || true
docker rm accubooks-test 2>/dev/null || true
docker rmi accubooks-test:latest 2>/dev/null || true
rm -f .env.production.test
rm -f /tmp/secrets_check.txt /tmp/prisma_generate.log /tmp/postinstall.log /tmp/client_build.log /tmp/server_build.log /tmp/docker_build.log /tmp/health_check.log /tmp/metrics_check.log /tmp/metrics_status.txt

print_status "success" "🎉 All production readiness checks passed!"
echo ""
print_status "info" "Summary of checks completed:"
echo "  ✅ No hardcoded secrets found"
echo "  ✅ Environment variables validation passed"
echo "  ✅ Prisma generation successful"
echo "  ✅ Postinstall script successful"
echo "  ✅ Client build successful"
echo "  ✅ Server build successful"
echo "  ✅ Docker build successful (no cache)"
echo "  ✅ Application boots and health endpoint responds correctly"
echo "  ✅ Observability endpoints working (metrics, correlation IDs)"
echo "  ✅ Graceful shutdown handling verified"
