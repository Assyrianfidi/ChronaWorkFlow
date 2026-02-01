#!/bin/bash

# Migration Safety CI Script
# Comprehensive migration validation for CI/CD pipeline

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_PATH="${MIGRATIONS_PATH:-./prisma/migrations}"
SCHEMA_PATH="${SCHEMA_PATH:-./prisma/schema.prisma}"
ALLOW_DESTRUCTIVE="${ALLOW_DESTRUCTIVE:-false}"
ALLOW_CONTRACT="${ALLOW_CONTRACT:-false}"
STRICT_MODE="${STRICT_MODE:-true}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if Prisma CLI is available
    if ! npx prisma --version &> /dev/null; then
        log_error "Prisma CLI is not available"
        exit 1
    fi
    
    # Check if schema file exists
    if [[ ! -f "$SCHEMA_PATH" ]]; then
        log_error "Prisma schema not found at $SCHEMA_PATH"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Validate Prisma schema
validate_prisma_schema() {
    log_info "Validating Prisma schema..."
    
    if ! npx prisma validate; then
        log_error "Prisma schema validation failed"
        return 1
    fi
    
    log_success "Prisma schema validation passed"
    return 0
}

# Check for schema drift
check_schema_drift() {
    log_info "Checking for schema drift..."
    
    # Generate Prisma client to ensure it's up to date
    if ! npx prisma generate; then
        log_error "Prisma client generation failed"
        return 1
    fi
    
    # Check if migrations are in sync with schema
    if npx prisma migrate diff --from-migrations "$MIGRATIONS_PATH" --to-schema-datamodel "$SCHEMA_PATH" --script 2>/dev/null | grep -q .; then
        log_error "Schema drift detected between migrations and schema"
        npx prisma migrate diff --from-migrations "$MIGRATIONS_PATH" --to-schema-datamodel "$SCHEMA_PATH" --script
        return 1
    fi
    
    log_success "No schema drift detected"
    return 0
}

# Run migration safety validation
run_migration_validation() {
    log_info "Running migration safety validation..."
    
    # Build the migration validator
    if ! npm run build:server 2>/dev/null; then
        log_warning "Could not build server, using TypeScript directly"
    fi
    
    # Run migration validation
    if node -r ts-node/register server/migration/migration-validator.ts 2>/dev/null; then
        log_success "Migration safety validation passed"
        return 0
    else
        log_error "Migration safety validation failed"
        return 1
    fi
}

# Run rollback safety validation
run_rollback_validation() {
    log_info "Running rollback safety validation..."
    
    # Run rollback safety validation
    if node -r ts-node/register server/migration/rollback-safety.ts 2>/dev/null; then
        log_success "Rollback safety validation passed"
        return 0
    else
        log_error "Rollback safety validation failed"
        return 1
    fi
}

# Run schema drift detection
run_drift_detection() {
    log_info "Running schema drift detection..."
    
    # Run schema drift detection
    if node -r ts-node/register server/migration/schema-drift-detector.ts 2>/dev/null; then
        log_success "Schema drift detection passed"
        return 0
    else
        log_error "Schema drift detection failed"
        return 1
    fi
}

# Validate migration files
validate_migration_files() {
    log_info "Validating migration files..."
    
    if [[ ! -d "$MIGRATIONS_PATH" ]]; then
        log_warning "No migrations directory found"
        return 0
    fi
    
    # Check migration file naming convention
    local invalid_files=()
    while IFS= read -r -d '' file; do
        local basename=$(basename "$file")
        if [[ ! "$basename" =~ ^[0-9]{13}_ ]]; then
            invalid_files+=("$basename")
        fi
    done < <(find "$MIGRATIONS_PATH" -name "*.sql" -type f -print0)
    
    if [[ ${#invalid_files[@]} -gt 0 ]]; then
        log_error "Invalid migration file names found:"
        for file in "${invalid_files[@]}"; do
            echo "  - $file"
        done
        log_error "Migration files must follow naming convention: {timestamp}_{description}.sql"
        return 1
    fi
    
    # Check for empty migration files
    local empty_files=()
    while IFS= read -r -d '' file; do
        if [[ ! -s "$file" ]]; then
            empty_files+=("$file")
        fi
    done < <(find "$MIGRATIONS_PATH" -name "*.sql" -type f -print0)
    
    if [[ ${#empty_files[@]} -gt 0 ]]; then
        log_error "Empty migration files found:"
        for file in "${empty_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    log_success "Migration file validation passed"
    return 0
}

# Check migration dependencies
check_migration_dependencies() {
    log_info "Checking migration dependencies..."
    
    # Check if package.json has required dependencies
    if ! npm list @prisma/client &> /dev/null; then
        log_error "@prisma/client dependency not found"
        return 1
    fi
    
    if ! npm list prisma &> /dev/null; then
        log_error "prisma dependency not found"
        return 1
    fi
    
    log_success "Migration dependencies check passed"
    return 0
}

# Generate validation report
generate_report() {
    local validation_results="$1"
    local report_file="migration-validation-report.md"
    
    log_info "Generating validation report..."
    
    cat > "$report_file" << EOF
# Migration Validation Report

**Generated**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Environment**: ${NODE_ENV:-development}
**Strict Mode**: $STRICT_MODE

## Validation Results

$validation_results

## Configuration

- **Migrations Path**: $MIGRATIONS_PATH
- **Schema Path**: $SCHEMA_PATH
- **Allow Destructive**: $ALLOW_DESTRUCTIVE
- **Allow Contract**: $ALLOW_CONTRACT

## Next Steps

1. Review any violations or warnings
2. Fix identified issues
3. Re-run validation
4. Proceed with deployment only after all checks pass

---

*This report was generated automatically by the migration safety CI script.*
EOF
    
    log_success "Validation report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting migration safety validation..."
    log_info "Configuration: Migrations=$MIGRATIONS_PATH, Schema=$SCHEMA_PATH"
    
    local validation_results=""
    local exit_code=0
    
    # Run all validation checks
    if ! check_prerequisites; then
        validation_results+="❌ Prerequisites check failed\n"
        exit_code=1
    else
        validation_results+="✅ Prerequisites check passed\n"
    fi
    
    if ! validate_prisma_schema; then
        validation_results+="❌ Prisma schema validation failed\n"
        exit_code=1
    else
        validation_results+="✅ Prisma schema validation passed\n"
    fi
    
    if ! validate_migration_files; then
        validation_results+="❌ Migration file validation failed\n"
        exit_code=1
    else
        validation_results+="✅ Migration file validation passed\n"
    fi
    
    if ! check_migration_dependencies; then
        validation_results+="❌ Migration dependencies check failed\n"
        exit_code=1
    else
        validation_results+="✅ Migration dependencies check passed\n"
    fi
    
    if ! check_schema_drift; then
        validation_results+="❌ Schema drift check failed\n"
        exit_code=1
    else
        validation_results+="✅ Schema drift check passed\n"
    fi
    
    if ! run_migration_validation; then
        validation_results+="❌ Migration safety validation failed\n"
        exit_code=1
    else
        validation_results+="✅ Migration safety validation passed\n"
    fi
    
    if ! run_rollback_validation; then
        validation_results+="❌ Rollback safety validation failed\n"
        exit_code=1
    else
        validation_results+="✅ Rollback safety validation passed\n"
    fi
    
    if ! run_drift_detection; then
        validation_results+="❌ Schema drift detection failed\n"
        exit_code=1
    else
        validation_results+="✅ Schema drift detection passed\n"
    fi
    
    # Generate report
    generate_report "$validation_results"
    
    # Final result
    if [[ $exit_code -eq 0 ]]; then
        log_success "🎉 All migration safety checks passed!"
        log_success "Safe to proceed with deployment."
    else
        log_error "❌ Migration safety checks failed!"
        log_error "Deployment blocked. Fix issues before proceeding."
        log_error "Check the validation report for details."
    fi
    
    exit $exit_code
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h              Show this help message"
        echo "  --allow-destructive    Allow destructive migrations (default: false)"
        echo "  --allow-contract       Allow contract migrations (default: false)"
        echo "  --strict-mode          Enable strict validation (default: true)"
        echo ""
        echo "Environment Variables:"
        echo "  MIGRATIONS_PATH        Path to migrations directory (default: ./prisma/migrations)"
        echo "  SCHEMA_PATH            Path to Prisma schema (default: ./prisma/schema.prisma)"
        echo "  ALLOW_DESTRUCTIVE      Allow destructive migrations (default: false)"
        echo "  ALLOW_CONTRACT         Allow contract migrations (default: false)"
        echo "  STRICT_MODE            Enable strict validation (default: true)"
        exit 0
        ;;
    --allow-destructive)
        export ALLOW_DESTRUCTIVE=true
        ;;
    --allow-contract)
        export ALLOW_CONTRACT=true
        ;;
    --strict-mode)
        export STRICT_MODE=true
        ;;
    "")
        # No arguments, use defaults
        ;;
    *)
        log_error "Unknown option: $1"
        log_error "Use --help for usage information"
        exit 1
        ;;
esac

# Run main function
main "$@"
