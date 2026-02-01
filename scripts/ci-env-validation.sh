#!/bin/bash

# CRITICAL: Environment Validation CI Script
# MANDATORY: Fail CI on insecure configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# CRITICAL: Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# CRITICAL: Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

# CRITICAL: Check if environment variable exists and is not empty
check_env_var() {
    local var_name="$1"
    local required="${2:-true}"
    local description="$3"
    local is_secret="${4:-false}"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -z "${!var_name:-}" ]; then
        if [ "$required" = "true" ]; then
            log_error "Required environment variable $var_name is missing ($description)"
            return 1
        else
            log_warn "Optional environment variable $var_name is not set ($description)"
            return 0
        fi
    fi
    
    # CRITICAL: Check for default/placeholder values
    local value="${!var_name}"
    if [[ "$NODE_ENV" == "production" ]]; then
        case "$value" in
            "password"|"secret"|"key"|"token"|"change_me"|"replace_me"|"default"|"test"|"demo"|"example"|"xxx"|"yyy"|"zzz"|"abc"|"123"|"456"|"789")
                log_error "Production environment variable $var_name has default/placeholder value"
                return 1
                ;;
        esac
    fi
    
    # CRITICAL: Check secret strength for sensitive variables
    if [ "$is_secret" = "true" ]; then
        if [ ${#value} -lt 32 ]; then
            log_error "Secret $var_name is too short (minimum 32 characters)"
            return 1
        fi
        
        # CRITICAL: Check entropy (basic approximation)
        local unique_chars=$(echo "$value" | fold -w1 | sort -u | wc -l)
        if [ $unique_chars -lt 16 ]; then
            log_error "Secret $var_name has insufficient character diversity ($unique_chars unique chars, minimum 16)"
            return 1
        fi
        
        # CRITICAL: Check for character requirements
        if [[ ! "$value" =~ [A-Z] ]] || [[ ! "$value" =~ [a-z] ]] || [[ ! "$value" =~ [0-9] ]]; then
            log_error "Secret $var_name must contain uppercase, lowercase, and numbers"
            return 1
        fi
    fi
    
    log_success "Environment variable $var_name is valid"
    return 0
}

# CRITICAL: Check file exists and is readable
check_file_exists() {
    local file_path="$1"
    local required="${2:-true}"
    local description="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ ! -f "$file_path" ]; then
        if [ "$required" = "true" ]; then
            log_error "Required file $file_path is missing ($description)"
            return 1
        else
            log_warn "Optional file $file_path is not found ($description)"
            return 0
        fi
    fi
    
    if [ ! -r "$file_path" ]; then
        log_error "File $file_path is not readable ($description)"
        return 1
    fi
    
    log_success "File $file_path exists and is readable"
    return 0
}

# CRITICAL: Check numeric value
check_numeric() {
    local var_name="$1"
    local min_value="${2:-}"
    local max_value="${3:-}"
    local description="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    local value="${!var_name}"
    
    if ! [[ "$value" =~ ^[0-9]+$ ]]; then
        log_error "Variable $var_name must be numeric ($description)"
        return 1
    fi
    
    if [ -n "$min_value" ] && [ "$value" -lt "$min_value" ]; then
        log_error "Variable $var_name is below minimum value $min_value ($description)"
        return 1
    fi
    
    if [ -n "$max_value" ] && [ "$value" -gt "$max_value" ]; then
        log_error "Variable $var_name is above maximum value $max_value ($description)"
        return 1
    fi
    
    log_success "Variable $var_name has valid numeric value"
    return 0
}

# CRITICAL: Check allowed values
check_allowed_values() {
    local var_name="$1"
    shift
    local allowed_values=("$@")
    local description="$allowed_values"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    local value="${!var_name}"
    local found=false
    
    for allowed_value in "${allowed_values[@]}"; do
        if [ "$value" = "$allowed_value" ]; then
            found=true
            break
        fi
    done
    
    if [ "$found" = false ]; then
        log_error "Variable $var_name has invalid value '$value'. Allowed: ${allowed_values[*]}"
        return 1
    fi
    
    log_success "Variable $var_name has valid value"
    return 0
}

# CRITICAL: Check URL format
check_url() {
    local var_name="$1"
    local description="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    local value="${!var_name}"
    
    if [[ ! "$value" =~ ^https?:// ]]; then
        log_error "Variable $var_name must be a valid URL ($description)"
        return 1
    fi
    
    log_success "Variable $var_name has valid URL format"
    return 0
}

# CRITICAL: Check for forbidden patterns in files
check_file_forbidden_patterns() {
    local file_path="$1"
    local description="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # CRITICAL: Check for potential secrets in code
    local forbidden_patterns=(
        "password[=:]\s*[\"'][^\"']+[\"']"
        "secret[=:]\s*[\"'][^\"']+[\"']"
        "key[=:]\s*[\"'][^\"']+[\"']"
        "token[=:]\s*[\"'][^\"']+[\"']"
        "-----BEGIN.*PRIVATE KEY-----"
        "-----BEGIN.*CERTIFICATE-----"
    )
    
    for pattern in "${forbidden_patterns[@]}"; do
        if grep -q "$pattern" "$file_path" 2>/dev/null; then
            log_error "File $file_path contains forbidden pattern: $pattern ($description)"
            return 1
        fi
    done
    
    log_success "File $file_path passed forbidden pattern checks"
    return 0
}

# CRITICAL: Main validation
echo "🔒 Starting Environment Validation..."
echo "=================================="

# CRITICAL: Environment validation
echo ""
echo "📋 Environment Variables:"
echo "------------------------"

# CRITICAL: Security variables
check_env_var "JWT_SECRET" true "JWT signing secret" true
check_env_var "SESSION_SECRET" true "Session encryption secret" true
check_env_var "ENCRYPTION_KEY" true "Data encryption key" true

# CRITICAL: Database variables
check_env_var "DATABASE_URL" true "Database connection string" true

# CRITICAL: Application variables
check_env_var "NODE_ENV" true "Node.js environment" false
check_allowed_values "NODE_ENV" "development" "test" "staging" "production"

check_env_var "PORT" true "Application port" false
check_numeric "PORT" 1024 65535 "Application port"

check_env_var "ENFORCE_HTTPS" true "HTTPS enforcement" false
check_allowed_values "ENFORCE_HTTPS" "true" "false"

check_env_var "COOKIE_SECURE" true "Secure cookies" false
check_allowed_values "COOKIE_SECURE" "true" "false"

# CRITICAL: Optional variables
check_env_var "LOG_LEVEL" false "Log level" false
if [ -n "${LOG_LEVEL:-}" ]; then
    check_allowed_values "LOG_LEVEL" "error" "warn" "info" "debug"
fi

check_env_var "DEBUG" false "Debug mode" false
if [ -n "${DEBUG:-}" ]; then
    check_allowed_values "DEBUG" "true" "false"
fi

# CRITICAL: Authentication variables (optional)
check_env_var "GOOGLE_CLIENT_ID" false "Google OAuth client ID" false
check_env_var "GOOGLE_CLIENT_SECRET" false "Google OAuth client secret" true

# CRITICAL: External services (optional)
check_env_var "REDIS_URL" false "Redis connection string" false

# CRITICAL: File checks
echo ""
echo "📁 File Checks:"
echo "-------------"

check_file_exists ".env" false "Environment file"
check_file_exists "package.json" true "Package configuration"
check_file_exists "tsconfig.json" true "TypeScript configuration"

# CRITICAL: Security checks
echo ""
echo "🔒 Security Checks:"
echo "-----------------"

# CRITICAL: Check for secrets in source code
echo "Checking source code for potential secrets..."
source_files=$(find . -name "*.ts" -o -name "*.js" -o -name "*.json" | grep -v node_modules | grep -v dist | head -20)
security_issues=0

for file in $source_files; do
    if ! check_file_forbidden_patterns "$file" "Source file"; then
        security_issues=$((security_issues + 1))
    fi
done

if [ $security_issues -eq 0 ]; then
    log_success "No security issues found in source code"
fi

# CRITICAL: Production-specific checks
if [ "$NODE_ENV" = "production" ]; then
    echo ""
    echo "🚀 Production Checks:"
    echo "-------------------"
    
    # CRITICAL: Ensure debug mode is disabled
    if [ "${DEBUG:-}" = "true" ]; then
        log_error "Debug mode must be disabled in production"
    else
        log_success "Debug mode is disabled in production"
    fi
    
    # CRITICAL: Ensure log level is appropriate
    if [ -n "${LOG_LEVEL:-}" ] && [ "$LOG_LEVEL" = "debug" ]; then
        log_warn "Consider using more restrictive log level in production"
    else
        log_success "Log level is appropriate for production"
    fi
    
    # CRITICAL: Check for development dependencies
    if [ -f "package.json" ]; then
        if grep -q "nodemon\|ts-node-dev\|concurrently" package.json; then
            log_error "Development dependencies detected in production package.json"
        else
            log_success "No development dependencies found in package.json"
        fi
    fi
fi

# CRITICAL: Database connection test (if DATABASE_URL is provided)
if [ -n "${DATABASE_URL:-}" ]; then
    echo ""
    echo "🗄️ Database Checks:"
    echo "------------------"
    
    # CRITICAL: Check if database URL contains password (should be in connection string but not exposed)
    if [[ "$DATABASE_URL" =~ password=([^&;]+) ]]; then
        log_warn "Database URL contains password (ensure this is not exposed in logs)"
    else
        log_success "Database URL format appears safe"
    fi
    
    # CRITICAL: Check for SSL/TLS
    if [[ "$DATABASE_URL" =~ sslmode=disable ]]; then
        log_error "Database SSL is disabled - not allowed in production"
    elif [[ "$DATABASE_URL" =~ sslmode=require ]]; then
        log_success "Database SSL is properly configured"
    else
        log_warn "Database SSL mode not explicitly specified"
    fi
fi

# CRITICAL: Summary
echo ""
echo "📊 Validation Summary:"
echo "===================="
echo "Total checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo "Warnings: $WARNINGS"

if [ $FAILED_CHECKS -gt 0 ]; then
    echo ""
    log_error "❌ Environment validation FAILED with $FAILED_CHECKS errors"
    echo ""
    echo "Please fix the above errors before proceeding."
    exit 1
else
    echo ""
    log_success "✅ Environment validation PASSED"
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        log_warn "⚠️  $WARNINGS warnings detected - consider reviewing them"
    fi
    
    echo ""
    echo "🔒 Environment is secure and ready for deployment!"
    exit 0
fi
