$ErrorActionPreference = 'Stop'

$reportDir = Join-Path 'reports' 'ci'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$env:DETERMINISTIC_TEST_IDS = 'true'

try {
  npx vitest run --project server --run server/finance/__tests__/period-and-reporting.test.ts --reporter=json --outputFile (Join-Path $reportDir 'financial-reporting-tests.json')
  '{"status":"ok","gate":"financial-reporting"}' | Out-File -FilePath (Join-Path $reportDir 'financial-reporting-gate.json') -Encoding utf8
} catch {
  '{"status":"failed","gate":"financial-reporting"}' | Out-File -FilePath (Join-Path $reportDir 'financial-reporting-gate.json') -Encoding utf8
  throw
}
