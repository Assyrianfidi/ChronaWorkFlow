#!/bin/bash

# CRITICAL: Security Posture Validation CI Script
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

# CRITICAL: Check if environment is production
is_production() {
    [ "$NODE_ENV" = "production" ]
}

# CRITICAL: Check HTTPS enforcement
check_https_enforcement() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if is_production; then
        if [ "${ENFORCE_HTTPS:-}" != "true" ]; then
            log_error "HTTPS enforcement is required in production"
            return 1
        fi
    fi
    
    log_success "HTTPS enforcement is properly configured"
    return 0
}

# CRITICAL: Check secure cookies
check_secure_cookies() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if is_production; then
        if [ "${COOKIE_SECURE:-}" != "true" ]; then
            log_error "Secure cookies must be enabled in production"
            return 1
        fi
        
        if [ "${COOKIE_HTTP_ONLY:-}" != "true" ]; then
            log_error "HttpOnly cookies must be enabled in production"
            return 1
        fi
        
        if [ "${COOKIE_SAME_SITE:-}" != "strict" ]; then
            log_warn "Consider using SameSite=strict for cookies"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        if [ "${COOKIE_HTTP_ONLY:-}" != "true" ]; then
            log_warn "Consider enabling HttpOnly cookies"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    log_success "Secure cookies are properly configured"
    return 0
}

# CRITICAL: Check HSTS configuration
check_hsts_configuration() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if is_production; then
        if [ "${HSTS_ENABLED:-}" != "true" ]; then
            log_warn "HSTS should be enabled in production"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        if [ "${HSTS_MAX_AGE:-}" -lt 31536000 ]; then
            log_error "HSTS max-age should be at least 1 year (31536000 seconds)"
            return 1
        fi
        
        if [ "${HSTS_INCLUDE_SUBDOMAINS:-}" != "true" ]; then
            log_warn "Consider including subdomains in HSTS"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        if [ "${HSTS_ENABLED:-}" = "true" ]; then
            log_warn "HSTS should only be enabled in production"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    log_success "HSTS configuration is acceptable"
    return 0
}

# CRITICAL: Check Content Security Policy
check_csp_configuration() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "${CSP_ENABLED:-}" = "true" ]; then
        if [ -z "${CSP_POLICY:-}" ]; then
            log_error "CSP enabled but no policy specified"
            return 1
        fi
        
        # CRITICAL: Basic CSP validation
        if ! echo "$CSP_POLICY" | grep -q "default-src 'self'"; then
            log_error "CSP must include default-src 'self'"
            return 1
        fi
        
        if is_production && echo "$CSP_POLICY" | grep -q "'unsafe-inline'"; then
            log_warn "CSP contains unsafe-inline in production"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        if is_production; then
            log_warn "Consider enabling Content Security Policy in production"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    log_success "CSP configuration is acceptable"
    return 0
}

# CRITICAL: Check frame options
check_frame_options() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "${X_FRAME_OPTIONS:-}" != "DENY" ]; then
        if is_production; then
            log_error "X-Frame-Options should be set to DENY in production"
            return 1
        else
            log_warn "Consider using X-Frame-Options=DENY for better security"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    log_success "Frame options are properly configured"
    return 0
}

# CRITICAL: Check content type options
check_content_type_options() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "${X_CONTENT_TYPE_OPTIONS:-}" != "nosniff" ]; then
        log_warn "Consider using X-Content-Type-Options=nosniff"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    log_success "Content type options are properly configured"
    return 0
}

# CRITICAL: Check referrer policy
check_referrer_policy() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "${REFERRER_POLICY:-}" != "strict-origin-when-cross-origin" ]; then
        log_warn "Consider using strict-origin-when-cross-origin for better privacy"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    log_success "Referrer policy is acceptable"
    return 0
}

# CRITICAL: Check runtime flags
check_runtime_flags() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # CRITICAL: Check Node.js security flags
    if [ "${NODE_OPTIONS:-}" != "" ]; then
        if echo "$NODE_OPTIONS" | grep -q "\-\-"; then
            log_error "Unsafe Node.js flags detected: $NODE_OPTIONS"
            return 1
        fi
        
        if echo "$NODE_OPTIONS" | grep -q "allow-writable"; then
            log_error "Writable Node.js is not allowed in production"
            return 1
        fi
    fi
    
    # CRITICAL: Check for eval usage
    if [ "${NODE_OPTIONS:-}" != "" ]; then
        if echo "$NODE_OPTIONS" | grep -q "eval"; then
            log_error "Eval is not allowed"
            return 1
        fi
    fi
    
    log_success "Runtime flags are secure"
    return 0
}

# CRITICAL: Check for development dependencies in production
check_production_dependencies() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if ! is_production; then
        return 0
    fi
    
    # CRITICAL: Check package.json for development dependencies
    if [ -f "package.json" ]; then
        if grep -q "nodemon\|ts-node-dev\|concurrently\|eslint" package.json; then
            log_error "Development dependencies found in production package.json"
            return 1
        fi
        
        if grep -q "devDependencies" package.json; then
            log_error "devDependencies should be removed in production"
            return 1
        fi
    fi
    
    log_success "No development dependencies found in production"
    return 0
}

# CRITICAL: Check for default/placeholder values
check_default_values() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # CRITICAL: Check for common default values
    local default_patterns=(
        "password"
        "secret"
        "key"
        "token"
        "change_me"
        "replace_me"
        "default"
        "test"
        "demo"
        "example"
        "xxx"
        "yyy"
        "zzz"
        "abc"
        "123"
        "456"
        "789"
    )
    
    for pattern in "${default_patterns[@]}"; do
        if grep -r "$pattern" .env* 2>/dev/null; then
            if is_production; then
                log_error "Default/placeholder value detected: $pattern"
                return 1
            else
                log_warn "Default/placeholder value detected: $pattern"
                WARNINGS=$((WARNINGS + 1))
            fi
        fi
    done
    
    log_success "No default/placeholder values found"
    return 0
}

# CRITICAL: Check for exposed secrets in source code
check_source_code_secrets() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking source code for potential secrets..."
    
    # CRITICAL: Check for common secret patterns
    local secret_patterns=(
        "password[=:]"
        "secret[=:]"
        "key[=:]"
        "token[=:]"
        "BEGIN.*PRIVATE.*KEY"
        "BEGIN.*CERTIFICATE"
        "DATABASE_URL.*password"
        "REDIS_URL.*password"
        "API_KEY[=:]"
        "GOOGLE_CLIENT_SECRET[=:]"
        "JWT_SECRET[=:]"
        "SESSION_SECRET[=:]"
        "ENCRYPTION_KEY[=:]"
    )
    
    local security_issues=0
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -r "$pattern" . -name "*.ts" -o -name "*.js" -o -name "*.json" 2>/dev/null; then
            security_issues=$((security_issues + 1))
            log_error "Secret pattern found in source code: $pattern"
        fi
    done
    
    if [ $security_issues -eq 0 ]; then
        log_success "No secrets found in source code"
    else
        log_error "Security issues found in source code: $security_issues"
        return 1
    fi
    
    return 0
}

# CRITICAL: Check security headers in application
check_security_headers() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for security headers in application..."
    
    # CRITICAL: Check for security middleware
    if [ ! -f "server/security/security-posture.ts" ]; then
        log_error "Security posture module not found"
        return 1
    fi
    
    # CRITICAL: Check if security middleware is used
    if ! grep -r "securityMiddleware" server/index.ts server/app.ts 2>/dev/null; then
        log_error "Security middleware not applied to application"
        return 1
    fi
    
    # CRITICAL: Check for HTTPS enforcement in code
    if ! grep -r "enforceHttps\|ENFORCE_HTTPS" server/index.ts server/app.ts 2>/dev/null; then
        log_warn "HTTPS enforcement not found in application code"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    log_success "Security headers are properly integrated"
    return 0
}

# CRITICAL: Check Node.js security configuration
check_nodejs_security() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # CRITICAL: Check if security headers are applied at startup
    if ! grep -r "securityMiddleware" server/index.ts server/app.ts 2>/dev/null; then
        log_warn "Security headers not applied at application startup"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # CRITICAL: Check for proper error handling
    if ! grep -r "res.status" server/index.ts server/app.ts 2>/dev/null; then
        log_warn "Error handling may not be secure"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    log_success "Node.js security configuration is acceptable"
    return 0
}

# CRITICAL: Check environment variable validation
check_env_validation() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # CRITICAL: Check if environment validation is called at startup
    if ! grep -r "EnvironmentValidator.validateOrFail" server/index.ts server/app.ts 2>/dev/null; then
        log_warn "Environment validation not called at startup"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    log_success "Environment validation is properly integrated"
    return 0
}

# CRITICAL: Check for security configuration drift
check_security_drift() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for security configuration drift..."
    
    # CRITICAL: Check if security configuration is hardcoded
    if grep -r "enforceHttps.*=.*false" server/index.ts server/app.ts 2>/dev/null; then
        log_error "HTTPS enforcement disabled in code - security drift detected"
        return 1
    fi
    
    # CRITICAL: Check if secure cookies are disabled in code
    if grep -r "secure.*=.*false" server/index.ts server/app.ts 2>/dev/null; then
        log_error "Secure cookies disabled in code - security drift detected"
        return 1
    fi
    
    log_success "No security configuration drift detected"
    return 0
}

# CRITICAL: Main validation function
main() {
    echo "🔒 Starting Security Posture Validation..."
    echo "=================================="
    
    # CRITICAL: Get environment
    echo ""
    echo "📋 Environment:"
    echo "-------------"
    echo "NODE_ENV: ${NODE_ENV:-development}"
    echo "HTTPS_ENFORCED: ${ENFORCE_HTTPS:-not set}"
    echo "COOKIE_SECURE: ${COOKIE_SECURE:-not set}"
    echo "HSTS_ENABLED: ${HSTS_ENABLED:-not set}"
    echo "CSP_ENABLED: ${CSP_ENABLED:-not set}"
    echo "NODE_OPTIONS: ${NODE_OPTIONS:-not set}"
    
    # CRITICAL: Run all checks
    echo ""
    echo "🔒 Security Checks:"
    echo "----------------"
    
    check_https_enforcement || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_secure_cookies || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_hsts_configuration || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_csp_configuration || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_frame_options || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_content_type_options || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_referrer_policy || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_runtime_flags || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_production_dependencies || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_default_values || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_source_code_secrets || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_security_headers || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_nodejs_security || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_env_validation || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    
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
        log_error "❌ Security posture validation FAILED with $FAILED_CHECKS errors"
        echo ""
        echo "Please fix the above security issues before proceeding."
        exit 1
    else
        echo ""
        log_success "✅ Security posture validation PASSED"
        
        if [ $WARNINGS -gt 0 ]; then
            echo ""
            log_warn "⚠️  $WARNINGS warnings detected - consider reviewing them"
        fi
        
        echo "🔒 Security posture is secure and ready for deployment!"
        exit 0
    fi
}

# CRITICAL: Run validation
main
