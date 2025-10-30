# quick-start.ps1
# Windows PowerShell Quick Start Script for AccuBooks
# Compatible with Windows 11 and PowerShell 7+

param(
    [switch]$SkipVerification,
    [switch]$Verbose
)

Write-Host "AccuBooks Windows Quick Start" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

function Write-Log {
    param([string]$Message, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Status] $Message"
    Write-Host $logEntry
    Add-Content -Path "BuildTracker.log" -Value $logEntry
}

# Log the start of quick-start
Write-Log "AccuBooks Windows Quick Start initiated" "START"

# Check Docker Desktop
try {
    $dockerInfo = docker info 2>$null
    Write-Host "SUCCESS: Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Check Node.js and npm
try {
    $nodeVersion = & node -v 2>$null
    $npmVersion = & npm -v 2>$null
    Write-Host "SUCCESS: Node.js $nodeVersion and npm $npmVersion available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js or npm not found" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Start the application
Write-Host ""
Write-Host "Starting AccuBooks..." -ForegroundColor Green

# Use the enhanced start script
& ".\start-accubooks.ps1" -Verbose:$Verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Quick start completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Cyan
    Write-Host "  Main Application: http://localhost:3000"
    Write-Host "  Documentation: http://localhost:3001"
    Write-Host "  Status Dashboard: http://localhost:3002"
    Write-Host "  Grafana Monitoring: http://localhost:3003"
    Write-Host ""
    Write-Host "Run '.\verify-all.ps1' to check all services" -ForegroundColor Yellow

    if (-not $SkipVerification) {
        Write-Host "Running verification..." -ForegroundColor Cyan
        & ".\verify-all.ps1" -Quick
    }
} else {
    Write-Host "Quick start failed. Check the logs above." -ForegroundColor Red
    Write-Host "Run '.\start-accubooks.ps1 -Verbose' for detailed logs" -ForegroundColor Yellow
    exit 1
}
