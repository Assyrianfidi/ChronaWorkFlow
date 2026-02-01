#!/usr/bin/env bash
set -euo pipefail

# CI production validation
# - deterministic gates for build/test/lint/audit
# - multi-tenant verification (tenant isolation + RBAC + feature flags)
# - generates a machine-readable verification report

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_DIR="${REPORT_DIR:-./reports}"
REPORT_FILE="$REPORT_DIR/production-validation-report.json"

mkdir -p "$REPORT_DIR"

NODE_ENV="${NODE_ENV:-test}"
export NODE_ENV

START_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

fail() {
  local msg="$1"
  node -e "
const fs=require('fs');
const path=require('path');
const report={
  status:'FAILED',
  startedAt:process.env.START_TS,
  finishedAt:new Date().toISOString(),
  message:process.env.FAIL_MSG,
  gates:process.env.GATES?JSON.parse(process.env.GATES):{},
};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
" \
  >/dev/null 2>&1 || true

  echo "ERROR: $msg" >&2
  exit 1
}

export START_TS REPORT_DIR REPORT_FILE

GATES='{}'
export GATES

set_gate() {
  local key="$1"
  local value="$2"
  GATES=$(node -e "const g=JSON.parse(process.env.GATES||'{}'); g[process.argv[1]]=process.argv[2]; process.stdout.write(JSON.stringify(g));" "$key" "$value")
  export GATES
}

run_gate() {
  local name="$1"
  shift
  echo "==== Gate: $name ===="
  if "$@"; then
    set_gate "$name" "PASS"
  else
    set_gate "$name" "FAIL"
    export FAIL_MSG="$name failed"
    fail "$name failed"
  fi
}

run_gate "verify:env" npm run verify:env
run_gate "verify:type-lock" npm run verify:type-lock
run_gate "lint" npm run lint
run_gate "typecheck" npm run typecheck
run_gate "unit-tests" npm run test:backend

# STEP 10 compliance gate (controls mapping + compliance tests)
run_gate "compliance" ./scripts/ci-compliance-validation.sh

# STEP 11 reliability gate (ops control plane, kill switches, readiness, DR validation)
run_gate "reliability" ./scripts/ci-reliability-validation.sh

# STEP 12 performance/capacity gate (concurrency limits, load shedding, admission control)
run_gate "performance" ./scripts/ci-performance-validation.sh

# STEP 13 financial correctness gate (ledger invariants, replay, reconciliation)
run_gate "financial" ./scripts/ci-financial-validation.sh

# STEP 14 financial reporting gate (period locks, revenue recognition, trial balance, statements)
run_gate "financial-reporting" ./scripts/ci-financial-reporting-validation.sh

# STEP 15 tax + external exports gate (tax derivation, export formats, external access, attestation)
run_gate "tax-and-exports" ./scripts/ci-tax-and-exports-validation.sh

# STEP 16 observability + compliance evidence + audit retention + DR readiness gate
run_gate "observability-and-compliance" ./scripts/ci-observability-and-compliance-validation.sh

# STEP 9 integration test (tenant/RBAC/flags/audit/analytics)
run_gate "e2e-integration" npx vitest run --project server tests/integration/e2e-integration.test.ts

# Deterministic audit gate: ensure audit-hash placeholders are produced by STEP 8 tests.
run_gate "analytics-audit-hash" npx vitest run --project server server/analytics/analytics.test.ts

FINISH_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
node -e "
const fs=require('fs');
const report={
  status:'PASSED',
  startedAt:process.env.START_TS,
  finishedAt:process.env.FINISH_TS,
  gates:JSON.parse(process.env.GATES||'{}'),
  productionReadinessMetrics:{
    tenantIsolation:'ENFORCED_BY_TESTS',
    rbac:'ENFORCED_BY_TESTS',
    featureFlags:'ENFORCED_BY_TESTS',
    immutableAudit:'HASH_PLACEHOLDERS_VERIFIED',
    determinism:'DETERMINISTIC_MOCKS_AND_RULES',
    rollback:'SCRIPTED_PLACEHOLDER_READY',
  }
};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
" 

echo "==== Production validation PASSED ===="
echo "Report: $REPORT_FILE"
