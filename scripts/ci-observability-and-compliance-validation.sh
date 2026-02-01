#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

REPORT_DIR=${REPORT_DIR:-./reports}
REPORT_FILE="$REPORT_DIR/observability-and-compliance-validation-report.json"
mkdir -p "$REPORT_DIR"

NODE_ENV=${NODE_ENV:-test}
export NODE_ENV

DETERMINISTIC_TEST_IDS=${DETERMINISTIC_TEST_IDS:-true}
export DETERMINISTIC_TEST_IDS

fail() {
  msg="$1"
  node -e "
const fs=require('fs');
const report={status:'FAILED', finishedAt:new Date().toISOString(), message:process.env.FAIL_MSG||'failed'};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
" >/dev/null 2>&1 || true
  echo "ERROR: $msg" >&2
  exit 1
}

export REPORT_DIR REPORT_FILE

echo "==== Gate: observability-and-compliance ===="

if npx vitest run --project server server/observability/__tests__/observability.test.ts \
  server/audit/__tests__/audit-evidence.test.ts \
  server/compliance/__tests__/compliance-snapshot.test.ts \
  server/ops/__tests__/disaster-recovery.test.ts; then
  node -e "
const fs=require('fs');
const report={status:'PASSED', finishedAt:new Date().toISOString(), deterministic:true};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
" >/dev/null 2>&1 || true
  echo "==== Observability & compliance validation PASSED ===="
  echo "Report: $REPORT_FILE"
else
  export FAIL_MSG="observability-and-compliance tests failed"
  fail "observability-and-compliance tests failed"
fi
