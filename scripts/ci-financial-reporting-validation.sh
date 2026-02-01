#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-./reports/ci}"
mkdir -p "$REPORT_DIR"

export DETERMINISTIC_TEST_IDS=true

if npx vitest run --project server --run server/finance/__tests__/period-and-reporting.test.ts --reporter=json --outputFile "$REPORT_DIR/financial-reporting-tests.json"; then
  echo '{"status":"ok","gate":"financial-reporting"}' > "$REPORT_DIR/financial-reporting-gate.json"
else
  echo '{"status":"failed","gate":"financial-reporting"}' > "$REPORT_DIR/financial-reporting-gate.json"
  exit 1
fi
