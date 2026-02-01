#!/bin/bash

# CRITICAL: Enterprise Controls CI Validation Script
# MANDATORY: CI-blocking tests for enterprise guardrails and controls

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

# CRITICAL: Check if TypeScript files compile
check_typescript_compilation() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking TypeScript compilation..."
    if npx tsc --noEmit --project tsconfig.json; then
        log_success "TypeScript compilation passed"
    else
        log_error "TypeScript compilation failed"
        return 1
    fi
}

# CRITICAL: Check for unregistered dangerous operations
check_unregistered_operations() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for unregistered dangerous operations..."
    
    # CRITICAL: Look for direct dangerous operation calls
    if grep -r "executeDangerousOperation\|performOperation\|runDangerousOp" server/ --include="*.ts" --include="*.js" | grep -v "test\|spec\|mock"; then
        log_error "Found unregistered dangerous operation calls"
        return 1
    fi
    
    # CRITICAL: Check if all dangerous operations are registered
    if [ ! -f "server/enterprise/dangerous-operations.ts" ]; then
        log_error "Dangerous operations registry not found"
        return 1
    fi
    
    log_success "No unregistered dangerous operations found"
}

# CRITICAL: Check for bypass paths
check_bypass_paths() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for guardrail bypass paths..."
    
    # CRITICAL: Look for direct execution without guardrails
    if grep -r "tenant\.delete\|DELETE FROM.*tenants\|DROP.*tenant" server/ --include="*.ts" --include="*.js" | grep -v "test\|spec\|mock\|guardrail"; then
        log_error "Found potential tenant deletion bypass paths"
        return 1
    fi
    
    # CRITICAL: Look for direct data purge without guardrails
    if grep -r "DELETE.*WHERE.*deleted_at\|TRUNCATE\|DROP.*TABLE" server/ --include="*.ts" --include="*.js" | grep -v "test\|spec\|mock\|guardrail"; then
        log_error "Found potential data purge bypass paths"
        return 1
    fi
    
    # CRITICAL: Look for direct audit log manipulation
    if grep -r "UPDATE.*audit_logs\|DELETE.*audit_logs\|INSERT.*audit_logs" server/ --include="*.ts" --include="*.js" | grep -v "test\|spec\|mock\|guardrail"; then
        log_error "Found potential audit log manipulation bypass paths"
        return 1
    fi
    
    log_success "No guardrail bypass paths found"
}

# CRITICAL: Check for self-approval vulnerabilities
check_self_approval() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for self-approval vulnerabilities..."
    
    # CRITICAL: Look for self-approval logic
    if grep -r "approver.*requester\|requestedBy.*approver\|self.*approval" server/enterprise/ --include="*.ts" | grep -v "test\|spec\|mock"; then
        log_error "Found potential self-approval vulnerabilities"
        return 1
    fi
    
    # CRITICAL: Check approval workflow implementation
    if [ ! -f "server/enterprise/approval-workflows.ts" ]; then
        log_error "Approval workflow implementation not found"
        return 1
    fi
    
    # CRITICAL: Verify self-approval prevention
    if ! grep -q "self-approval is not allowed" server/enterprise/approval-workflows.ts; then
        log_error "Self-approval prevention not implemented"
        return 1
    fi
    
    log_success "Self-approval protection verified"
}

# CRITICAL: Check feature flag isolation
check_feature_flag_isolation() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking feature flag tenant isolation..."
    
    # CRITICAL: Check RLS policies for feature flags
    if ! grep -q "tenant_isolation.*feature_flags" server/enterprise/feature-flags-schema.sql; then
        log_error "Feature flag tenant isolation not implemented"
        return 1
    fi
    
    # CRITICAL: Check for cross-tenant flag access
    if grep -r "getFeatureFlag.*[^.]tenantId\|isFeatureEnabled.*[^.]tenantId" server/ --include="*.ts" | grep -v "test\|spec\|mock"; then
        log_error "Found potential cross-tenant feature flag access"
        return 1
    fi
    
    log_success "Feature flag tenant isolation verified"
}

# CRITICAL: Check audit logging completeness
check_audit_logging() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking audit logging completeness..."
    
    # CRITICAL: Check if all guardrail actions are logged
    if ! grep -q "logAuthorizationDecision\|logDataMutation\|logSecurityEvent" server/enterprise/guardrails.ts; then
        log_error "Guardrail audit logging not implemented"
        return 1
    fi
    
    # CRITICAL: Check approval workflow audit logging
    if ! grep -q "logAuthorizationDecision.*APPROVAL\|logDataMutation.*APPROVAL" server/enterprise/approval-workflows.ts; then
        log_error "Approval workflow audit logging not complete"
        return 1
    fi
    
    # CRITICAL: Check feature flag audit logging
    if ! grep -q "logDataMutation.*FEATURE_FLAG\|logAuthorizationDecision.*FEATURE_FLAG" server/enterprise/feature-flags.ts; then
        log_error "Feature flag audit logging not complete"
        return 1
    fi
    
    log_success "Audit logging completeness verified"
}

# CRITICAL: Check correlation ID propagation
check_correlation_ids() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking correlation ID propagation..."
    
    # CRITICAL: Check if correlation IDs are used in all enterprise operations
    if ! grep -q "correlationId" server/enterprise/*.ts; then
        log_error "Correlation ID propagation not implemented"
        return 1
    fi
    
    # CRITICAL: Check for correlation ID in audit logs
    if ! grep -q "correlationId" server/compliance/immutable-audit-log.ts; then
        log_error "Correlation ID not included in audit logs"
        return 1
    fi
    
    log_success "Correlation ID propagation verified"
}

# CRITICAL: Check multi-admin approval
check_multi_admin_approval() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking multi-admin approval implementation..."
    
    # CRITICAL: Check multi-admin configuration
    if ! grep -q "multiAdminConfig\|requiredApprovers\|totalApprovers" server/enterprise/dangerous-operations.ts; then
        log_error "Multi-admin approval configuration not found"
        return 1
    fi
    
    # CRITICAL: Check multi-admin approval logic
    if ! grep -q "currentApprovals.*requiredApprovers\|array_length.*current_approvals" server/enterprise/approval-workflows.ts; then
        log_error "Multi-admin approval logic not implemented"
        return 1
    fi
    
    log_success "Multi-admin approval implementation verified"
}

# CRITICAL: Check for secret leakage in enterprise controls
check_secret_leakage() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for secret leakage in enterprise controls..."
    
    # CRITICAL: Look for hardcoded secrets in enterprise control files
    if grep -r "password\|secret\|key\|token" server/enterprise/ --include="*.ts" | grep -v "metadata\|parameters\|reason\|test\|spec\|mock"; then
        log_error "Found potential secret leakage in enterprise controls"
        return 1
    fi
    
    # CRITICAL: Check if secret redaction is used
    if ! grep -q "secretRedactor\|redact" server/enterprise/guardrails.ts; then
        log_warn "Secret redaction not used in guardrails"
    fi
    
    log_success "No secret leakage found in enterprise controls"
}

# CRITICAL: Check for environment-based feature flags
check_env_feature_flags() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for environment-based feature flags..."
    
    # CRITICAL: Look for environment variable usage in feature flags
    if grep -r "process\.env\|env\." server/enterprise/feature-flags.ts; then
        log_error "Found environment-based feature flags (should be database-backed)"
        return 1
    fi
    
    # CRITICAL: Verify database-backed implementation
    if ! grep -q "prisma\|database\|SELECT.*feature_flags" server/enterprise/feature-flags.ts; then
        log_error "Feature flags not database-backed"
        return 1
    fi
    
    log_success "Feature flags are database-backed"
}

# CRITICAL: Check for proper error handling
check_error_handling() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for proper error handling..."
    
    # CRITICAL: Check if errors are properly logged
    if ! grep -q "logger\.error\|auditLogger\.log" server/enterprise/*.ts; then
        log_error "Error logging not implemented in enterprise controls"
        return 1
    fi
    
    # CRITICAL: Check for try-catch blocks in critical functions
    if ! grep -q "try.*catch" server/enterprise/guardrails.ts server/enterprise/approval-workflows.ts; then
        log_error "Proper error handling not implemented"
        return 1
    fi
    
    log_success "Error handling verified"
}

# CRITICAL: Check database schema security
check_database_security() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking database schema security..."
    
    # CRITICAL: Check RLS policies
    if ! grep -q "ENABLE ROW LEVEL SECURITY\|RLS" server/enterprise/*-schema.sql; then
        log_error "Row Level Security not enabled in enterprise schemas"
        return 1
    fi
    
    # CRITICAL: Check for tenant isolation policies
    if ! grep -q "tenant_isolation" server/enterprise/*-schema.sql; then
        log_error "Tenant isolation policies not found"
        return 1
    fi
    
    # CRITICAL: Check for admin policies
    if ! grep -q "system_administrators" server/enterprise/*-schema.sql; then
        log_error "Admin policies not properly configured"
        return 1
    fi
    
    log_success "Database schema security verified"
}

# CRITICAL: Check for test coverage
check_test_coverage() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking for test coverage..."
    
    # CRITICAL: Check if test files exist
    if [ ! -d "server/enterprise/__tests__" ]; then
        log_error "Enterprise controls test directory not found"
        return 1
    fi
    
    # CRITICAL: Check for test files
    if [ $(find server/enterprise/__tests__ -name "*.test.ts" -o -name "*.spec.ts" | wc -l) -eq 0 ]; then
        log_error "No test files found for enterprise controls"
        return 1
    fi
    
    # CRITICAL: Check for critical test scenarios
    local test_files=$(find server/enterprise/__tests__ -name "*.test.ts" -o -name "*.spec.ts")
    local critical_tests=("guardrail" "approval" "feature-flag" "dangerous-operation")
    
    for test in "${critical_tests[@]}"; do
        if ! echo "$test_files" | grep -q "$test"; then
            log_warn "Missing test for $test"
        fi
    done
    
    log_success "Test coverage verified"
}

# CRITICAL: Check for CI configuration
check_ci_configuration() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo "Checking CI configuration..."
    
    # CRITICAL: Check if CI scripts exist
    if [ ! -f "scripts/ci-env-validation.sh" ] || [ ! -f "scripts/ci-security-posture.sh" ]; then
        log_error "CI validation scripts not found"
        return 1
    fi
    
    # CRITICAL: Check if CI scripts are executable
    if [ ! -x "scripts/ci-env-validation.sh" ] || [ ! -x "scripts/ci-security-posture.sh" ]; then
        log_error "CI scripts are not executable"
        return 1
    fi
    
    log_success "CI configuration verified"
}

# CRITICAL: Main validation function
main() {
    echo "🔒 Starting Enterprise Controls CI Validation..."
    echo "=========================================="
    
    # CRITICAL: Run all checks
    echo ""
    echo "🔍 Code Quality Checks:"
    echo "---------------------"
    check_typescript_compilation || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    
    echo ""
    echo "🛡️ Security Checks:"
    echo "-----------------"
    check_unregistered_operations || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_bypass_paths || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_self_approval || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_feature_flag_isolation || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_audit_logging || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_secret_leakage || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_database_security || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    
    echo ""
    echo "⚙️ Implementation Checks:"
    echo "----------------------"
    check_env_feature_flags || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_multi_admin_approval || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_correlation_ids || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_error_handling || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    
    echo ""
    echo "🧪 Quality Assurance:"
    echo "-------------------"
    check_test_coverage || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    check_ci_configuration || FAILED_CHECKS=$((FAILED_CHECKS + 1))
    
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
        log_error "❌ Enterprise controls validation FAILED with $FAILED_CHECKS errors"
        echo ""
        echo "Please fix the above issues before proceeding."
        exit 1
    else
        echo ""
        log_success "✅ Enterprise controls validation PASSED"
        
        if [ $WARNINGS -gt 0 ]; then
            echo ""
            log_warn "⚠️  $WARNINGS warnings detected - consider reviewing them"
        fi
        
        echo ""
        echo "🔒 Enterprise controls are secure and ready for production!"
        exit 0
    fi
}

# CRITICAL: Run validation
main
