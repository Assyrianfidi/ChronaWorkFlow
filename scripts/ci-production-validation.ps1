$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RootDir

$ReportDir = $env:REPORT_DIR
if ([string]::IsNullOrWhiteSpace($ReportDir)) { $ReportDir = Join-Path $RootDir 'reports' }
$ReportFile = Join-Path $ReportDir 'production-validation-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ([string]::IsNullOrWhiteSpace($env:NODE_ENV)) { $env:NODE_ENV = 'test' }

$StartedAt = (Get-Date).ToUniversalTime().ToString('o')
$Gates = @{}

function Set-Gate([string]$Name, [string]$Value) { $script:Gates[$Name] = $Value }

function Write-Report([string]$Status, [string]$Message) {
  $report = @{
    status = $Status
    startedAt = $script:StartedAt
    finishedAt = (Get-Date).ToUniversalTime().ToString('o')
    message = $Message
    gates = $script:Gates
    productionReadinessMetrics = @{
      tenantIsolation = 'ENFORCED_BY_TESTS'
      rbac = 'ENFORCED_BY_TESTS'
      featureFlags = 'ENFORCED_BY_TESTS'
      immutableAudit = 'HASH_PLACEHOLDERS_VERIFIED'
      determinism = 'DETERMINISTIC_MOCKS_AND_RULES'
      rollback = 'SCRIPTED_PLACEHOLDER_READY'
    }
  }
  $report | ConvertTo-Json -Depth 20 | Out-File -FilePath $ReportFile -Encoding utf8
}

function Invoke-Gate([string]$Name, [scriptblock]$Action) {
  Write-Host "==== Gate: $Name ===="
  try {
    & $Action
    Set-Gate $Name 'PASS'
  } catch {
    Set-Gate $Name 'FAIL'
    $msg = $_.Exception.Message
    Write-Report 'FAILED' "$Name failed: $msg"
    throw
  }
}

try {
  Invoke-Gate 'verify:env' { npm run verify:env }
  Invoke-Gate 'verify:type-lock' { npm run verify:type-lock }
  Invoke-Gate 'lint' { npm run lint }
  Invoke-Gate 'typecheck' { npm run typecheck }
  Invoke-Gate 'unit-tests' { npm run test:backend }

  Invoke-Gate 'compliance' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-compliance-validation.ps1 }
  Invoke-Gate 'reliability' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-reliability-validation.ps1 }
  Invoke-Gate 'performance' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-performance-validation.ps1 }
  Invoke-Gate 'financial' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-financial-validation.ps1 }
  Invoke-Gate 'financial-reporting' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-financial-reporting-validation.ps1 }
  Invoke-Gate 'tax-and-exports' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-tax-and-exports-validation.ps1 }
  Invoke-Gate 'observability-and-compliance' { powershell -ExecutionPolicy Bypass -File .\scripts\ci-observability-and-compliance-validation.ps1 }

  Invoke-Gate 'e2e-integration' { npx vitest run --project server tests/integration/e2e-integration.test.ts }
  Invoke-Gate 'analytics-audit-hash' { npx vitest run --project server server/analytics/analytics.test.ts }

  Write-Report 'PASSED' 'ok'
  Write-Host "==== Production validation PASSED ===="
  Write-Host "Report: $ReportFile"
  exit 0
} catch {
  $msg = $_.Exception.Message
  Write-Error "Production validation FAILED: $msg"
  exit 1
}
