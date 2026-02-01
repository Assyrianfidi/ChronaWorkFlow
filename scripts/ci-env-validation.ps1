$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RootDir

$ReportDir = $env:REPORT_DIR
if ([string]::IsNullOrWhiteSpace($ReportDir)) { $ReportDir = Join-Path $RootDir 'reports' }
$ReportFile = Join-Path $ReportDir 'env-validation-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ([string]::IsNullOrWhiteSpace($env:NODE_ENV)) { $env:NODE_ENV = 'test' }

try {
  Write-Host '==== Gate: env ===='
  & npm run verify:env

  $report = @{ status = 'PASSED'; finishedAt = (Get-Date).ToUniversalTime().ToString('o') }
  $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8
  Write-Host "Report: $ReportFile"
  exit 0
} catch {
  $msg = $_.Exception.Message
  $report = @{ status = 'FAILED'; finishedAt = (Get-Date).ToUniversalTime().ToString('o'); message = $msg }
  $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8
  Write-Error "Env validation FAILED: $msg"
  exit 1
}
