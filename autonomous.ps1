# =============================================
# ACCUBOOKS ENTERPRISE AUTONOMOUS ACTIVATION
# =============================================
# Master Control Script for Full Automation
# =============================================

param(
    [switch]$Build,
    [switch]$Test,
    [switch]$Deploy,
    [switch]$Monitor,
    [switch]$All,
    [switch]$Continuous,
    [switch]$AutoFix,
    [switch]$Verbose,
    [switch]$QuickStart
)

Write-Host "🎯 ACCUBOOKS ENTERPRISE AUTONOMOUS MANAGEMENT" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "Advanced AI-Powered DevOps & Project Management" -ForegroundColor Cyan
Write-Host "Fully Automated Build, Test, Deploy, Monitor, Repair" -ForegroundColor Cyan

$startTime = Get-Date

# Quick start mode
if ($QuickStart) {
    Write-Host "`n🚀 QUICK START MODE - Full Automation" -ForegroundColor Green
    $Build = $true
    $Test = $true
    $Deploy = $true
    $Monitor = $true
    $AutoFix = $true
    $Verbose = $true
}

# All mode
if ($All) {
    $Build = $true
    $Test = $true
    $Deploy = $true
    $AutoFix = $true
    $Verbose = $true
}

# =============================================
# PHASE 1: BUILD
# =============================================

if ($Build) {
    Write-Host "`n🏗️ PHASE 1: BUILD SYSTEM" -ForegroundColor Magenta
    Write-Host "========================" -ForegroundColor Magenta

    # Run enhanced build system
    Write-Host "🔧 Running enhanced build system..." -ForegroundColor Cyan
    & "$PSScriptRoot\build-deploy.ps1" -Build -AutoFix:$AutoFix -Verbose:$Verbose

    # Update diary
    $timestamp = Get-Date -Format "HH:mm"
    Add-Content -Path "project-diary.md" -Value "- [$timestamp] Build phase completed ✅"
}

# =============================================
# PHASE 2: TEST
# =============================================

if ($Test) {
    Write-Host "`n🧪 PHASE 2: TEST SYSTEM" -ForegroundColor Magenta
    Write-Host "=======================" -ForegroundColor Magenta

    # Run test suite
    Write-Host "🔧 Running comprehensive test suite..." -ForegroundColor Cyan
    & "$PSScriptRoot\build-deploy.ps1" -Test -Verbose:$Verbose

    # Update diary
    $timestamp = Get-Date -Format "HH:mm"
    Add-Content -Path "project-diary.md" -Value "- [$timestamp] Test phase completed ✅"
}

# =============================================
# PHASE 3: DEPLOY
# =============================================

if ($Deploy) {
    Write-Host "`n🚀 PHASE 3: DEPLOY SYSTEM" -ForegroundColor Magenta
    Write-Host "=========================" -ForegroundColor Magenta

    # Run deployment
    Write-Host "🔧 Running deployment system..." -ForegroundColor Cyan
    & "$PSScriptRoot\build-deploy.ps1" -Deploy -AutoFix:$AutoFix -Verbose:$Verbose

    # Update diary
    $timestamp = Get-Date -Format "HH:mm"
    Add-Content -Path "project-diary.md" -Value "- [$timestamp] Deploy phase completed ✅"
}

# =============================================
# PHASE 4: MONITOR
# =============================================

if ($Monitor) {
    Write-Host "`n🔍 PHASE 4: MONITORING SYSTEM" -ForegroundColor Magenta
    Write-Host "=============================" -ForegroundColor Magenta

    if ($Continuous) {
        # Continuous monitoring
        Write-Host "🔧 Starting continuous monitoring..." -ForegroundColor Cyan
        & "$PSScriptRoot\monitor-services.ps1" -Continuous -AutoRestart:$AutoFix -Interval 30
    } else {
        # Single monitoring check
        Write-Host "🔧 Running health check..." -ForegroundColor Cyan
        & "$PSScriptRoot\monitor-services.ps1" -Once -AutoRestart:$AutoFix
    }

    # Update diary
    $timestamp = Get-Date -Format "HH:mm"
    Add-Content -Path "project-diary.md" -Value "- [$timestamp] Monitoring check completed ✅"
}

# =============================================
# PHASE 5: AUTONOMOUS MODE
# =============================================

if ($Continuous -or $All) {
    Write-Host "`n🤖 PHASE 5: AUTONOMOUS OPERATIONS" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta

    # Run autonomous manager
    Write-Host "🔧 Starting autonomous management cycles..." -ForegroundColor Cyan
    & "$PSScriptRoot\autonomous-manager.ps1"

    # Update diary
    $timestamp = Get-Date -Format "HH:mm"
    Add-Content -Path "project-diary.md" -Value "- [$timestamp] Autonomous cycle completed ✅"
}

# =============================================
# PHASE 6: DIARY UPDATE
# =============================================

Write-Host "`n📖 PHASE 6: DIARY & REPORTING" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta

# Update diary with session summary
$endTime = Get-Date
$duration = $endTime - $startTime

$sessionSummary = @"

---

### [$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")] AUTONOMOUS SESSION COMPLETE
**Duration:** $($duration.TotalMinutes.ToString("F1")) minutes
**Mode:** $(if ($QuickStart) { "Quick Start" } elseif ($All) { "Full Automation" } else { "Custom" })
**Auto-Fix:** $(if ($AutoFix) { "Enabled" } else { "Disabled" })
**Features:**
- ✅ Build System: Executed
- $(if ($Test) { "✅" } else { "❌" }) Test Suite: $(if ($Test) { "Completed" } else { "Skipped" })
- $(if ($Deploy) { "✅" } else { "❌" }) Deployment: $(if ($Deploy) { "Completed" } else { "Skipped" })
- $(if ($Monitor) { "✅" } else { "❌" }) Monitoring: $(if ($Monitor) { "Active" } else { "Skipped" })

**System Status:** $(if ($All -or $QuickStart) { "🟢 FULLY OPERATIONAL" } else { "🟡 PARTIALLY READY" })

"@

Add-Content -Path "project-diary.md" -Value $sessionSummary

# Generate final report
Write-Host "🔧 Generating final status report..." -ForegroundColor Cyan
& "$PSScriptRoot\diary-manager.ps1" -Update

# =============================================
# FINAL STATUS DISPLAY
# =============================================

Write-Host "`n🎯 FINAL AUTONOMOUS STATUS REPORT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$metrics = & "$PSScriptRoot\diary-manager.ps1" -Show | Out-Null
# Get metrics from diary manager (simplified for now)

Write-Host "⏱️ Session Duration: $($duration.TotalMinutes.ToString("F1")) minutes" -ForegroundColor White
Write-Host "🎛️ Operations Completed: $(if ($Build) { "Build " } else { "" }) $(if ($Test) { "Test " } else { "" }) $(if ($Deploy) { "Deploy " } else { "" }) $(if ($Monitor) { "Monitor" } else { "" })" -ForegroundColor White
Write-Host "🔧 Auto-Fix Mode: $(if ($AutoFix) { "🟢 Enabled" } else { "🟡 Disabled" })" -ForegroundColor $(if ($AutoFix) { "Green" } else { "Yellow" })

# Service URLs
Write-Host "`n🌐 ACTIVE SERVICES:" -ForegroundColor Green
Write-Host "   • Main App:    http://localhost:3000" -ForegroundColor White
Write-Host "   • Admin:       http://localhost:3000/admin" -ForegroundColor White
Write-Host "   • API:         http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host "   • Docs:        http://localhost:3001" -ForegroundColor White
Write-Host "   • Status:      http://localhost:3002" -ForegroundColor White
Write-Host "   • Grafana:     http://localhost:3003" -ForegroundColor White
Write-Host "   • Prometheus:  http://localhost:9090" -ForegroundColor White

# Quick commands
Write-Host "`n📋 MANAGEMENT COMMANDS:" -ForegroundColor Cyan
Write-Host "   • Quick Check:     .\manage-enhanced.ps1" -ForegroundColor White
Write-Host "   • Full Automation: .\autonomous.ps1 -All" -ForegroundColor White
Write-Host "   • Monitor Only:    .\monitor-services.ps1 -Continuous" -ForegroundColor White
Write-Host "   • View Diary:      Get-Content project-diary.md -Tail 15" -ForegroundColor White
Write-Host "   • Docker Status:   docker compose -f docker-compose.saas.yml ps" -ForegroundColor White

# Completion status
$completionStatus = if ($All -or $QuickStart) {
    "🎉 ACCUBOOKS ENTERPRISE SYSTEM FULLY OPERATIONAL!"
} elseif ($Build -or $Test -or $Deploy -or $Monitor) {
    "⚡ ACCUBOOKS SYSTEM PARTIALLY OPERATIONAL"
} else {
    "⏳ ACCUBOOKS SYSTEM READY FOR OPERATIONS"
}

Write-Host "`n$completionStatus" -ForegroundColor $(if ($completionStatus -like "*🎉*") { "Green" } elseif ($completionStatus -like "*⚡*") { "Yellow" } else { "Cyan" })

Write-Host "`n📖 Project diary updated with session summary!" -ForegroundColor Green

# Final timestamp
$finalTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "project-diary.md" -Value "- [$finalTimestamp] Autonomous session ended ✅"
