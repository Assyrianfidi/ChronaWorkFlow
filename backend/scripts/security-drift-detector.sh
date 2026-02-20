#!/bin/bash
# ============================================================================
# SECURITY DRIFT DETECTOR
# ============================================================================
# 
# Scans codebase for security anti-patterns that indicate tenant isolation
# drift or regression.
# 
# BLOCKS BUILD IF:
# - Unscoped Prisma queries (count(), findMany({}))
# - Global Redis cache keys (missing tenant_ prefix)
# - Direct Redis imports in services
# - Raw SQL on tenant tables (excessive usage)
# 
# USAGE: Run in CI/CD before deployment
# EXIT: 0 = pass, 1 = fail (blocks deployment)
# ============================================================================

set -e

echo "🔒 Running security drift detection..."
echo ""

ERRORS=0
WARNINGS=0

# ---------------------------------------------------------------------------
# Rule 1: No unscoped count() queries
# ---------------------------------------------------------------------------

echo "📋 Rule 1: Checking for unscoped count() queries..."

UNSCOPED_COUNT=$(grep -rn "prisma\.\w\+\.count()" backend/src/services --include="*.ts" | \
  grep -v "where:" | \
  grep -v "test" | \
  grep -v "//" || true)

if [ -n "$UNSCOPED_COUNT" ]; then
  echo "❌ FAIL: Unscoped count() queries detected"
  echo "$UNSCOPED_COUNT"
  echo ""
  echo "All count() queries must include where: { companyId } or rely on auto-injection"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No unscoped count() queries"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 2: No findMany({}) with empty filter
# ---------------------------------------------------------------------------

echo "📋 Rule 2: Checking for findMany with empty filters..."

EMPTY_FIND=$(grep -rn "\.findMany(\s*{\s*}\s*)" backend/src/services --include="*.ts" || true)

if [ -n "$EMPTY_FIND" ]; then
  echo "❌ FAIL: findMany({}) with empty filter detected"
  echo "$EMPTY_FIND"
  echo ""
  echo "Empty filters return ALL records across ALL tenants"
  echo "Add where clause or rely on auto-injection"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No empty findMany() filters"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 3: No global Redis cache keys (must have tenant_ prefix)
# ---------------------------------------------------------------------------

echo "📋 Rule 3: Checking for global Redis cache keys..."

# Look for string literals used as cache keys without tenant_ prefix
GLOBAL_KEYS=$(grep -rn "cacheKey\s*=\s*['\"]" backend/src/services --include="*.ts" | \
  grep -v "tenant_" | \
  grep -v "test" || true)

if [ -n "$GLOBAL_KEYS" ]; then
  echo "❌ FAIL: Global Redis cache keys detected (missing tenant_ prefix)"
  echo "$GLOBAL_KEYS"
  echo ""
  echo "All cache keys must include tenant ID"
  echo "Format: namespace:tenant_<id>:resource"
  echo "Use TenantRedisClient.setTenantCache() instead"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No global cache keys detected"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 4: No excessive raw SQL on tenant tables
# ---------------------------------------------------------------------------

echo "📋 Rule 4: Checking for raw SQL queries..."

RAW_SQL_COUNT=$(grep -rn "\$queryRaw\|\$executeRaw" backend/src/services --include="*.ts" | \
  grep -v "SELECT 1" | \
  grep -v "test" | \
  wc -l)

if [ "$RAW_SQL_COUNT" -gt 5 ]; then
  echo "⚠️  WARNING: Raw SQL queries detected ($RAW_SQL_COUNT found)"
  grep -rn "\$queryRaw\|\$executeRaw" backend/src/services --include="*.ts" | \
    grep -v "SELECT 1" | \
    grep -v "test" || true
  echo ""
  echo "Review raw SQL for tenant scoping. Prefer Prisma client methods."
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ PASS: Minimal raw SQL usage ($RAW_SQL_COUNT queries)"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 5: No direct ioredis imports in services
# ---------------------------------------------------------------------------

echo "📋 Rule 5: Checking for direct ioredis imports..."

DIRECT_REDIS_IMPORTS=$(grep -rn "from ['\"]ioredis['\"]" backend/src/services --include="*.ts" || true)

if [ -n "$DIRECT_REDIS_IMPORTS" ]; then
  echo "❌ FAIL: Direct ioredis import in services"
  echo "$DIRECT_REDIS_IMPORTS"
  echo ""
  echo "Services must use: import { getRedisClient } from '../utils/redis.js';"
  echo "Direct ioredis imports bypass tenant enforcement"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No direct ioredis imports in services"
fi

echo ""

# ---------------------------------------------------------------------------
# Rule 6: No getCurrentTenantContext() without validation
# ---------------------------------------------------------------------------

echo "📋 Rule 6: Checking for tenant context usage..."

# Services using getCurrentTenantContext should validate it's not undefined
UNVALIDATED_CONTEXT=$(grep -rn "getCurrentTenantContext()" backend/src/services --include="*.ts" -A 3 | \
  grep -v "if (!ctx" | \
  grep -v "if (ctx)" | \
  grep -v "validateTenantContext" | \
  grep -v "test" || true)

if [ -n "$UNVALIDATED_CONTEXT" ]; then
  echo "⚠️  WARNING: getCurrentTenantContext() usage without validation"
  echo ""
  echo "Always validate: const ctx = getCurrentTenantContext(); if (!ctx) throw ..."
  WARNINGS=$((WARNINGS + 1))
else
  echo "✅ PASS: Tenant context properly validated"
fi

echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ SECURITY DRIFT DETECTION FAILED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Errors: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Fix the above errors before deployment."
  echo "This build is BLOCKED."
  echo ""
  exit 1
else
  echo "✅ SECURITY DRIFT DETECTION PASSED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  if [ "$WARNINGS" -gt 0 ]; then
    echo "Warnings: $WARNINGS (review recommended)"
  else
    echo "No issues detected."
  fi
  echo ""
  echo "Build may proceed."
  echo ""
  exit 0
fi
