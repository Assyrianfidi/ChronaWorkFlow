#!/bin/bash
# ============================================================================
# CI ENFORCEMENT: No Versioned Files Allowed
# ============================================================================
# 
# This script enforces single-source-of-truth by blocking:
# - Versioned service files (*.service.v*.ts)
# - Versioned middleware files (*.middleware.v*.ts)
# - Multiple Prisma client instantiations
# - Direct Redis usage in services
# 
# USAGE: Run in CI/CD before tests
# EXIT: 0 = pass, 1 = fail (blocks deployment)
# ============================================================================

set -e

echo "🔍 Validating structural governance rules..."
echo ""

ERRORS=0

# ---------------------------------------------------------------------------
# Rule 1: No versioned service files
# ---------------------------------------------------------------------------

echo "📋 Rule 1: Checking for versioned service files..."

VERSIONED_SERVICES=$(find backend/src/services -name "*.service.v*.ts" 2>/dev/null || true)

if [ -n "$VERSIONED_SERVICES" ]; then
  echo "❌ FAIL: Versioned service files detected:"
  echo "$VERSIONED_SERVICES"
  echo ""
  echo "Version suffixes are forbidden. Use single service file per domain."
  echo "Example: dashboard.service.v4.ts → dashboard.service.ts (replace old version)"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No versioned service files"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 2: No versioned middleware files
# ---------------------------------------------------------------------------

echo "📋 Rule 2: Checking for versioned middleware files..."

VERSIONED_MIDDLEWARE=$(find backend/src/middleware -name "*.middleware.v*.ts" 2>/dev/null || true)

if [ -n "$VERSIONED_MIDDLEWARE" ]; then
  echo "❌ FAIL: Versioned middleware files detected:"
  echo "$VERSIONED_MIDDLEWARE"
  echo ""
  echo "Version suffixes are forbidden. Replace old version directly."
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No versioned middleware files"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 3: Single Prisma client instantiation
# ---------------------------------------------------------------------------

echo "📋 Rule 3: Checking for multiple Prisma client instantiations..."

# Count Prisma client instantiations (excluding tests and internal middleware)
PRISMA_CLIENTS=$(grep -r "new PrismaClient(" backend/src --include="*.ts" | \
  grep -v "test" | \
  grep -v "__tests__" | \
  grep -v "prisma-tenant-isolation-v3.middleware.ts" | \
  wc -l)

if [ "$PRISMA_CLIENTS" -gt 1 ]; then
  echo "❌ FAIL: Multiple Prisma client instantiations detected ($PRISMA_CLIENTS found)"
  echo ""
  echo "Only ONE Prisma client allowed in utils/prisma.ts"
  echo "Found instantiations:"
  grep -r "new PrismaClient(" backend/src --include="*.ts" | \
    grep -v "test" | \
    grep -v "__tests__" | \
    grep -v "prisma-tenant-isolation-v3.middleware.ts"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: Single Prisma client instantiation"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 4: No direct Redis usage in services
# ---------------------------------------------------------------------------

echo "📋 Rule 4: Checking for direct Redis instantiation in services..."

DIRECT_REDIS=$(grep -r "new Redis(" backend/src/services --include="*.ts" 2>/dev/null || true)

if [ -n "$DIRECT_REDIS" ]; then
  echo "❌ FAIL: Direct Redis instantiation in services detected"
  echo "$DIRECT_REDIS"
  echo ""
  echo "Use getRedisClient() from utils/redis.ts instead"
  echo "Example: import { getRedisClient } from '../utils/redis.js';"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No direct Redis usage in services"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 5: No duplicate Prisma client files
# ---------------------------------------------------------------------------

echo "📋 Rule 5: Checking for duplicate Prisma client files..."

DUPLICATE_PRISMA_FILES=$(find backend/src -name "prisma*.ts" -o -name "*prisma.ts" | \
  grep -v "prisma-tenant-isolation" | \
  grep -v "test" | \
  wc -l)

if [ "$DUPLICATE_PRISMA_FILES" -gt 1 ]; then
  echo "❌ FAIL: Multiple Prisma-related files detected"
  find backend/src -name "prisma*.ts" -o -name "*prisma.ts" | \
    grep -v "prisma-tenant-isolation" | \
    grep -v "test"
  echo ""
  echo "Only utils/prisma.ts should exist"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: Single Prisma client file"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 6: No template files in src/ directory
# ---------------------------------------------------------------------------

echo "📋 Rule 6: Checking for template files in src/..."

TEMPLATES_IN_SRC=$(find backend/src/templates -name "*.ts" 2>/dev/null || true)

if [ -n "$TEMPLATES_IN_SRC" ]; then
  echo "⚠️  WARNING: Template files found in src/"
  echo "$TEMPLATES_IN_SRC"
  echo ""
  echo "Template files should be in docs/templates/, not src/templates/"
else
  echo "✅ PASS: No template files in src/"
fi

echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

if [ "$ERRORS" -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ STRUCTURAL GOVERNANCE VALIDATION FAILED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Errors detected: $ERRORS"
  echo ""
  echo "Fix the above errors before deployment."
  echo "This build is BLOCKED."
  echo ""
  exit 1
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ STRUCTURAL GOVERNANCE VALIDATION PASSED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "All structural integrity checks passed."
  echo "Build may proceed."
  echo ""
  exit 0
fi
