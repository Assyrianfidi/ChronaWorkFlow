$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RootDir

$ReportDir = $env:REPORT_DIR
if ([string]::IsNullOrWhiteSpace($ReportDir)) { $ReportDir = Join-Path $RootDir 'reports' }
$ReportFile = Join-Path $ReportDir 'observability-and-compliance-validation-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ([string]::IsNullOrWhiteSpace($env:NODE_ENV)) { $env:NODE_ENV = 'test' }
if ([string]::IsNullOrWhiteSpace($env:DETERMINISTIC_TEST_IDS)) { $env:DETERMINISTIC_TEST_IDS = 'true' }

function Write-Report([string]$status, [string]$message) {
  $report = @{ status = $status; finishedAt = (Get-Date).ToUniversalTime().ToString('o'); message = $message; deterministic = $true }
  $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8
}

try {
  Write-Host '==== Gate: observability-and-compliance ===='

  $cmd = @(
    'npx','vitest','run','--project','server',
    'server/observability/__tests__/observability.test.ts',
    'server/audit/__tests__/audit-evidence.test.ts',
    'server/compliance/__tests__/compliance-snapshot.test.ts',
    'server/ops/__tests__/disaster-recovery.test.ts'
  )

  & $cmd[0] $cmd[1..($cmd.Length-1)]

  Write-Report 'PASSED' 'ok'
  Write-Host "Report: $ReportFile"
  exit 0
} catch {
  Write-Report 'FAILED' $_.Exception.Message
  Write-Error "Observability & compliance validation FAILED: $($_.Exception.Message)"
  exit 1
}
