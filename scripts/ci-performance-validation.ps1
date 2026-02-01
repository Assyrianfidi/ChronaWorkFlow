$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RootDir

$ReportDir = $env:REPORT_DIR
if ([string]::IsNullOrWhiteSpace($ReportDir)) { $ReportDir = Join-Path $RootDir 'reports' }
$ReportFile = Join-Path $ReportDir 'performance-validation-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ([string]::IsNullOrWhiteSpace($env:NODE_ENV)) { $env:NODE_ENV = 'test' }
if ([string]::IsNullOrWhiteSpace($env:DETERMINISTIC_TEST_IDS)) { $env:DETERMINISTIC_TEST_IDS = 'true' }

$Gates = @{}
function Set-Gate([string]$Name, [string]$Value) { $script:Gates[$Name] = $Value }
function Write-Report([string]$Status, [string]$Message) {
  $report = @{ status = $Status; finishedAt = (Get-Date).ToUniversalTime().ToString('o'); message = $Message; gates = $script:Gates; determinism = ($env:DETERMINISTIC_TEST_IDS -eq 'true') }
  $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8
}

try {
  Write-Host '==== Gate: performance ===='
  Write-Host '==== Performance Gate: perf:unit ===='
  & npx vitest run --project server server/performance/__tests__/performance-safety.test.ts
  Set-Gate 'perf:unit' 'PASS'

  Write-Report 'PASSED' 'ok'
  Write-Host "Report: $ReportFile"
  exit 0
} catch {
  $msg = $_.Exception.Message
  Set-Gate 'perf:unit' 'FAIL'
  Write-Report 'FAILED' $msg
  Write-Error "Performance validation FAILED: $msg"
  exit 1
}
