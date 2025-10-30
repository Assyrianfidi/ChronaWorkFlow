#!/bin/bash

# AccuBooks Security Audit Script
# Run this script to perform security checks on the production deployment

echo "🔒 Starting AccuBooks Security Audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SECURITY_ISSUES=0

# Function to print status
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo "📋 Checking environment configuration..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_status "Production environment file exists" 1
else
    print_status "Production environment file exists" 0

    # Check for required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "REDIS_PASSWORD"
        "STRIPE_SECRET_KEY"
        "PLAID_CLIENT_ID"
        "PLAID_SECRET"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.production; then
            print_status "Environment variable $var is set" 0
        else
            print_status "Environment variable $var is set" 1
        fi
    done
fi

echo "🔐 Checking security configurations..."

# Check if SSL certificates exist (if using Let's Encrypt)
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_COUNT=$(find /etc/letsencrypt/live -name "cert.pem" | wc -l)
    if [ "$CERT_COUNT" -gt 0 ]; then
        print_status "SSL certificates are installed" 0
    else
        print_status "SSL certificates are installed" 1
    fi
else
    print_warning "Let's Encrypt certificates not found - ensure SSL is configured"
fi

# Check package vulnerabilities
echo "📦 Checking for package vulnerabilities..."
if command -v npm &> /dev/null; then
    AUDIT_RESULT=$(npm audit --audit-level=moderate --json 2>/dev/null | jq -r '.vulnerabilities.moderate // 0' 2>/dev/null || echo "0")
    if [ "$AUDIT_RESULT" -eq 0 ]; then
        print_status "No moderate or high severity vulnerabilities found" 0
    else
        print_status "No moderate or high severity vulnerabilities found" 1
    fi
else
    print_warning "npm not found - cannot check package vulnerabilities"
fi

# Check if Docker containers are running with proper security
echo "🐳 Checking Docker container security..."
if command -v docker &> /dev/null; then
    CONTAINER_COUNT=$(docker ps --filter "name=accubooks" --filter "status=running" | wc -l)
    if [ "$CONTAINER_COUNT" -gt 1 ]; then
        print_status "AccuBooks containers are running" 0

        # Check if containers are running as non-root
        NON_ROOT_COUNT=$(docker ps --filter "name=accubooks" --filter "status=running" --format "{{.User}}" | grep -v "root" | wc -l)
        if [ "$NON_ROOT_COUNT" -eq "$CONTAINER_COUNT" ]; then
            print_status "All containers run as non-root user" 0
        else
            print_status "All containers run as non-root user" 1
        fi
    else
        print_warning "AccuBooks containers not running"
    fi
else
    print_warning "Docker not found - cannot check container security"
fi

# Check file permissions
echo "📁 Checking file permissions..."
if [ -f ".env.production" ]; then
    PERMS=$(stat -c "%a" .env.production 2>/dev/null || echo "600")
    if [ "$PERMS" = "600" ]; then
        print_status "Environment file has secure permissions (600)" 0
    else
        print_status "Environment file has secure permissions (600)" 1
    fi
fi

# Check for exposed secrets in logs
echo "🔍 Checking for exposed secrets..."
if [ -d "logs" ]; then
    SECRET_COUNT=$(find logs -type f -exec grep -l "sk_live_\|sk_test_\|pk_live_\|pk_test_" {} \; 2>/dev/null | wc -l)
    if [ "$SECRET_COUNT" -eq 0 ]; then
        print_status "No API keys found in log files" 0
    else
        print_status "No API keys found in log files" 1
    fi
fi

# Check firewall configuration
echo "🛡️ Checking firewall configuration..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | grep -c "Status: active")
    if [ "$UFW_STATUS" -eq 1 ]; then
        print_status "UFW firewall is active" 0

        # Check if only necessary ports are open
        OPEN_PORTS=$(ufw status | grep -E "80|443|22" | wc -l)
        if [ "$OPEN_PORTS" -ge 1 ]; then
            print_status "Only necessary ports are open" 0
        else
            print_status "Only necessary ports are open" 1
        fi
    else
        print_status "UFW firewall is active" 1
    fi
elif command -v iptables &> /dev/null; then
    print_warning "Using iptables instead of UFW - manual firewall verification required"
else
    print_warning "No firewall detected - ensure firewall is configured"
fi

# Check backup configuration
echo "💾 Checking backup configuration..."
if [ -f "scripts/backup.sh" ]; then
    print_status "Backup script exists" 0
else
    print_warning "No backup script found"
fi

if [ -d "backups" ]; then
    BACKUP_COUNT=$(find backups -name "*.sql" -mtime -7 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        print_status "Recent database backups found" 0
    else
        print_warning "No recent database backups found"
    fi
else
    print_warning "No backup directory found"
fi

# Check monitoring setup
echo "📊 Checking monitoring setup..."
if [ -f "prometheus.yml" ]; then
    print_status "Prometheus configuration exists" 0
else
    print_warning "No Prometheus configuration found"
fi

if [ -d "grafana" ]; then
    print_status "Grafana configuration exists" 0
else
    print_warning "No Grafana configuration found"
fi

echo ""
echo "📋 Security Audit Summary:"
echo "Total security issues found: $SECURITY_ISSUES"

if [ $SECURITY_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed!${NC}"
    echo ""
    echo "✅ Production deployment is secure and ready"
    exit 0
else
    echo -e "${RED}❌ Found $SECURITY_ISSUES security issues that need attention${NC}"
    echo ""
    echo "🔧 Please address the issues above before deploying to production"
    exit 1
fi
