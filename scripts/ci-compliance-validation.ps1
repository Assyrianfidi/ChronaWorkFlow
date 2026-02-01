$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RootDir

$ReportDir = $env:REPORT_DIR
if ([string]::IsNullOrWhiteSpace($ReportDir)) { $ReportDir = Join-Path $RootDir 'reports' }
$ReportFile = Join-Path $ReportDir 'compliance-validation-report.json'
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if ([string]::IsNullOrWhiteSpace($env:NODE_ENV)) { $env:NODE_ENV = 'test' }

$Gates = @{}

function Set-Gate([string]$Name, [string]$Value) {
  $script:Gates[$Name] = $Value
}

function Write-Report([string]$Status, [string]$Message) {
  $report = @{ status = $Status; finishedAt = (Get-Date).ToUniversalTime().ToString('o'); message = $Message; gates = $script:Gates }
  $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding utf8
}

try {
  Write-Host '==== Gate: compliance ===='

  Write-Host '==== Compliance Gate: controls:mapping ===='
  & node -e "const fs=require('fs'); const p='server/compliance/control-mapping.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); if(!Array.isArray(j.controls)) throw new Error('controls missing'); const ids=new Set(j.controls.map(c=>c.controlId)); const required=['ACCU-CONTROL-001','ACCU-CONTROL-002','ACCU-CONTROL-003','ACCU-CONTROL-004','ACCU-CONTROL-005','ACCU-CONTROL-006','ACCU-CONTROL-007','ACCU-CONTROL-008','ACCU-CONTROL-009']; for(const id of required){ if(!ids.has(id)) throw new Error('missing '+id); }"
  Set-Gate 'controls:mapping' 'PASS'

  Write-Host '==== Compliance Gate: compliance:test ===='
  & npx vitest run --project server server/compliance/compliance.test.ts
  Set-Gate 'compliance:test' 'PASS'

  Write-Report 'PASSED' 'ok'
  Write-Host "Report: $ReportFile"
  exit 0
} catch {
  $msg = $_.Exception.Message
  if ($script:Gates['controls:mapping'] -ne 'PASS') { Set-Gate 'controls:mapping' 'FAIL' }
  if ($script:Gates['compliance:test'] -ne 'PASS') { Set-Gate 'compliance:test' 'FAIL' }
  Write-Report 'FAILED' $msg
  Write-Error "Compliance validation FAILED: $msg"
  exit 1
}
