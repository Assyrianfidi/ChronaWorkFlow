$ErrorActionPreference = 'Stop'

$reportDir = Join-Path 'reports' 'ci'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$env:DETERMINISTIC_TEST_IDS = 'true'

try {
  npx vitest run --project server --run server/finance/__tests__/tax-and-exports.test.ts --reporter=json --outputFile (Join-Path $reportDir 'tax-and-exports-tests.json')
  '{"status":"ok","gate":"tax-and-exports"}' | Out-File -FilePath (Join-Path $reportDir 'tax-and-exports-gate.json') -Encoding utf8
} catch {
  '{"status":"failed","gate":"tax-and-exports"}' | Out-File -FilePath (Join-Path $reportDir 'tax-and-exports-gate.json') -Encoding utf8
  throw
}
