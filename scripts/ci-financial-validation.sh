#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="reports/ci"
mkdir -p "$REPORT_DIR"

export DETERMINISTIC_TEST_IDS="true"

if npx vitest run --project server --run server/finance/__tests__ --reporter=json --outputFile "$REPORT_DIR/financial-tests.json"; then
  echo "{\"status\":\"ok\",\"gate\":\"financial\"}" > "$REPORT_DIR/financial-gate.json"
else
  echo "{\"status\":\"failed\",\"gate\":\"financial\"}" > "$REPORT_DIR/financial-gate.json"
  exit 1
fi
