#!/bin/bash

# Migration Safety Enforcement Hook
# Pre-commit and pre-push hook to enforce migration safety

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hook type (pre-commit or pre-push)
HOOK_TYPE="${1:-pre-commit}"

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

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
}

# Get changed files
get_changed_files() {
    case "$HOOK_TYPE" in
        pre-commit)
            git diff --cached --name-only
            ;;
        pre-push)
            # Get files changed between current branch and origin/main
            git diff --name-only $(git merge-base origin/main HEAD)..HEAD
            ;;
        *)
            log_error "Unknown hook type: $HOOK_TYPE"
            exit 1
            ;;
    esac
}

# Check if migration files were changed
check_migration_changes() {
    local changed_files
    changed_files=$(get_changed_files)
    
    # Check for Prisma schema changes
    if echo "$changed_files" | grep -q "prisma/schema.prisma"; then
        log_info "Prisma schema changes detected"
        return 0
    fi
    
    # Check for migration file changes
    if echo "$changed_files" | grep -q "prisma/migrations/.*\.sql"; then
        log_info "Migration file changes detected"
        return 0
    fi
    
    log_info "No migration-related changes detected"
    return 1
}

# Run migration safety validation
run_migration_validation() {
    log_info "Running migration safety validation..."
    
    # Check if migration safety script exists
    if [[ ! -f "./scripts/migration-safety-ci.sh" ]]; then
        log_error "Migration safety script not found"
        return 1
    fi
    
    # Make script executable
    chmod +x ./scripts/migration-safety-ci.sh
    
    # Run validation
    if ./scripts/migration-safety-ci.sh; then
        log_success "Migration safety validation passed"
        return 0
    else
        log_error "Migration safety validation failed"
        return 1
    fi
}

# Check for destructive changes in diff
check_destructive_changes() {
    log_info "Checking for destructive changes in diff..."
    
    local destructive_patterns=(
        "DROP TABLE"
        "DROP COLUMN"
        "DROP INDEX"
        "DROP CONSTRAINT"
        "TRUNCATE TABLE"
        "ALTER TABLE.*DROP COLUMN"
        "ALTER TABLE.*DROP CONSTRAINT"
    )
    
    local has_destructive=false
    
    for pattern in "${destructive_patterns[@]}"; do
        if git diff --cached --name-only | grep -q "prisma/" && git diff --cached | grep -i "$pattern"; then
            log_error "Destructive change detected: $pattern"
            has_destructive=true
        fi
    done
    
    if [[ "$has_destructive" == "true" ]]; then
        log_error "Destructive changes detected without explicit override"
        log_error "Add '-- @override-destructive' comment to migration files to proceed"
        return 1
    fi
    
    log_success "No unauthorized destructive changes detected"
    return 0
}

# Check for override annotations
check_override_annotations() {
    log_info "Checking for override annotations..."
    
    local migration_files
    migration_files=$(git diff --cached --name-only | grep "prisma/migrations/.*\.sql" || true)
    
    for file in $migration_files; do
        if [[ -f "$file" ]]; then
            # Check if file contains destructive changes
            local has_destructive=false
            if grep -i -E "(DROP TABLE|DROP COLUMN|DROP INDEX|DROP CONSTRAINT|TRUNCATE)" "$file" > /dev/null; then
                has_destructive=true
            fi
            
            # If destructive changes exist, check for override annotation
            if [[ "$has_destructive" == "true" ]]; then
                if ! grep -q -E "(-- @override-destructive|-- @migration-override|-- @allow-destructive)" "$file"; then
                    log_error "Destructive changes in $file without override annotation"
                    log_error "Add '-- @override-destructive' comment to proceed"
                    return 1
                else
                    log_warning "Destructive changes in $file with override annotation"
                fi
            fi
        fi
    done
    
    log_success "Override annotation check passed"
    return 0
}

# Validate migration file naming
validate_migration_naming() {
    log_info "Validating migration file naming..."
    
    local migration_files
    migration_files=$(git diff --cached --name-only | grep "prisma/migrations/.*\.sql" || true)
    
    for file in $migration_files; do
        if [[ -f "$file" ]]; then
            local basename
            basename=$(basename "$file")
            
            # Check naming convention: {timestamp}_{description}.sql
            if [[ ! "$basename" =~ ^[0-9]{13}_ ]]; then
                log_error "Invalid migration file name: $basename"
                log_error "Migration files must follow naming convention: {timestamp}_{description}.sql"
                return 1
            fi
        fi
    done
    
    log_success "Migration file naming validation passed"
    return 0
}

# Check Prisma client generation
check_prisma_client() {
    log_info "Checking Prisma client generation..."
    
    # Check if schema was modified
    if git diff --cached --name-only | grep -q "prisma/schema.prisma"; then
        log_info "Prisma schema was modified, checking client generation..."
        
        # Try to generate Prisma client
        if ! npx prisma generate; then
            log_error "Prisma client generation failed"
            return 1
        fi
        
        log_success "Prisma client generated successfully"
    else
        log_info "Prisma schema not modified, skipping client generation check"
    fi
    
    return 0
}

# Main validation function
run_validation() {
    log_info "Running migration safety validation for $HOOK_TYPE hook..."
    
    # Check if migration changes exist
    if ! check_migration_changes; then
        log_success "No migration changes to validate"
        return 0
    fi
    
    # Run validation checks
    if ! validate_migration_naming; then
        return 1
    fi
    
    if ! check_destructive_changes; then
        return 1
    fi
    
    if ! check_override_annotations; then
        return 1
    fi
    
    if ! check_prisma_client; then
        return 1
    fi
    
    if ! run_migration_validation; then
        return 1
    fi
    
    log_success "🎉 All migration safety checks passed!"
    return 0
}

# Installation function
install_hooks() {
    log_info "Installing migration safety hooks..."
    
    # Create hooks directory if it doesn't exist
    mkdir -p .git/hooks
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Migration safety pre-commit hook

# Get the directory where this script is located
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Run the migration safety hook
cd "$PROJECT_ROOT"
bash "$HOOK_DIR/migration-safety-hook.sh" pre-commit
EOF
    
    # Create pre-push hook
    cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# Migration safety pre-push hook

# Get the directory where this script is located
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Run the migration safety hook
cd "$PROJECT_ROOT"
bash "$HOOK_DIR/migration-safety-hook.sh" pre-push
EOF
    
    # Make hooks executable
    chmod +x .git/hooks/pre-commit
    chmod +x .git/hooks/pre-push
    
    log_success "Migration safety hooks installed"
}

# Uninstallation function
uninstall_hooks() {
    log_info "Uninstalling migration safety hooks..."
    
    # Remove hooks if they exist
    if [[ -f .git/hooks/pre-commit ]]; then
        if grep -q "migration-safety-hook.sh" .git/hooks/pre-commit; then
            rm .git/hooks/pre-commit
            log_info "Removed pre-commit hook"
        fi
    fi
    
    if [[ -f .git/hooks/pre-push ]]; then
        if grep -q "migration-safety-hook.sh" .git/hooks/pre-push; then
            rm .git/hooks/pre-push
            log_info "Removed pre-push hook"
        fi
    fi
    
    log_success "Migration safety hooks uninstalled"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h              Show this help message"
        echo "  --install               Install git hooks"
        echo "  --uninstall             Uninstall git hooks"
        echo "  pre-commit              Run as pre-commit hook"
        echo "  pre-push                Run as pre-push hook"
        echo ""
        echo "Environment Variables:"
        echo "  HOOK_TYPE               Hook type (pre-commit or pre-push)"
        exit 0
        ;;
    --install)
        check_git_repo
        install_hooks
        exit 0
        ;;
    --uninstall)
        check_git_repo
        uninstall_hooks
        exit 0
        ;;
    pre-commit|pre-push)
        check_git_repo
        run_validation
        exit $?
        ;;
    "")
        # Default to pre-commit
        check_git_repo
        run_validation
        exit $?
        ;;
    *)
        log_error "Unknown option: $1"
        log_error "Use --help for usage information"
        exit 1
        ;;
esac
