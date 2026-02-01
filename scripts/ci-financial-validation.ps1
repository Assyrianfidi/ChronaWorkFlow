$ErrorActionPreference = 'Stop'

$reportDir = Join-Path 'reports' 'ci'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$env:DETERMINISTIC_TEST_IDS = 'true'

try {
  npx vitest run --project server --run server/finance/__tests__ --reporter=json --outputFile (Join-Path $reportDir 'financial-tests.json')
  '{"status":"ok","gate":"financial"}' | Out-File -FilePath (Join-Path $reportDir 'financial-gate.json') -Encoding utf8
} catch {
  '{"status":"failed","gate":"financial"}' | Out-File -FilePath (Join-Path $reportDir 'financial-gate.json') -Encoding utf8
  throw
}
