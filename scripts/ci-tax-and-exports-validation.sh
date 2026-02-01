#!/usr/bin/env sh
set -eu

REPORT_DIR="${REPORT_DIR:-./reports/ci}"
mkdir -p "$REPORT_DIR"

export DETERMINISTIC_TEST_IDS=true

if npx vitest run --project server --run server/finance/__tests__/tax-and-exports.test.ts --reporter=json --outputFile "$REPORT_DIR/tax-and-exports-tests.json"; then
  echo '{"status":"ok","gate":"tax-and-exports"}' > "$REPORT_DIR/tax-and-exports-gate.json"
else
  echo '{"status":"failed","gate":"tax-and-exports"}' > "$REPORT_DIR/tax-and-exports-gate.json"
  exit 1
fi
