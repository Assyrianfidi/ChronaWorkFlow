#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_DIR="${REPORT_DIR:-./reports}"
REPORT_FILE="$REPORT_DIR/performance-validation-report.json"
mkdir -p "$REPORT_DIR"

export REPORT_DIR REPORT_FILE

NODE_ENV="${NODE_ENV:-test}"
export NODE_ENV

# Deterministic outputs for CI stability
export DETERMINISTIC_TEST_IDS="${DETERMINISTIC_TEST_IDS:-true}"

GATES='{}'
export GATES

set_gate() {
  local key="$1"
  local value="$2"
  GATES=$(node -e "const g=JSON.parse(process.env.GATES||'{}'); g[process.argv[1]]=process.argv[2]; process.stdout.write(JSON.stringify(g));" "$key" "$value")
  export GATES
}

fail() {
  local msg="$1"
  node -e "
const fs=require('fs');
const report={status:'FAILED', finishedAt:new Date().toISOString(), message:process.env.FAIL_MSG, gates:JSON.parse(process.env.GATES||'{}')};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
" >/dev/null 2>&1 || true
  echo "ERROR: $msg" >&2
  exit 1
}

run_gate() {
  local name="$1"
  shift
  echo "==== Performance Gate: $name ===="
  if "$@"; then
    set_gate "$name" "PASS"
  else
    set_gate "$name" "FAIL"
    export FAIL_MSG="$name failed"
    fail "$name failed"
  fi
}

run_gate "performance:tests" npx vitest run --project server server/performance/__tests__/performance-safety.test.ts

node -e "
const fs=require('fs');
const report={status:'PASSED', finishedAt:new Date().toISOString(), gates:JSON.parse(process.env.GATES||'{}'), determinism: process.env.DETERMINISTIC_TEST_IDS === 'true'};
fs.mkdirSync(process.env.REPORT_DIR,{recursive:true});
fs.writeFileSync(process.env.REPORT_FILE, JSON.stringify(report,null,2));
"

echo "==== Performance validation PASSED ===="
echo "Report: $REPORT_FILE"
