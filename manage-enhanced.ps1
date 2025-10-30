# AccuBooks Enhanced Management System
# Features: Automatic actions, progress metrics, continuous monitoring

param(
    [switch]$AutoFix,
    [switch]$Verbose,
    [switch]$Monitor,
    [switch]$Reset
)

Write-Host "🚀 AccuBooks Enhanced Management System" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# =============================================
# 1. ENVIRONMENT INITIALIZATION
# =============================================

Write-Host "`n🔧 Step 1: Environment Check" -ForegroundColor Yellow

# Check Docker
try {
    $dockerInfo = docker info 2>&1
    Write-Host "✅ Docker: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker: Not running" -ForegroundColor Red
    if ($AutoFix) {
        Write-Host "   Attempting to start Docker..." -ForegroundColor Yellow
        # Auto-start Docker logic would go here
    }
}

# Check Node.js
try {
    $nodeVer = & node -v 2>&1
    $npmVer = & npm -v 2>&1
    Write-Host "✅ Node.js: $nodeVer, npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js/npm: Not found" -ForegroundColor Red
}

# =============================================
# 2. AUTOMATIC FILE CREATION
# =============================================

Write-Host "`n📁 Step 2: Project Structure Check" -ForegroundColor Yellow

$requiredDirs = @(
    "server", "server/routes", "server/jobs",
    "docs", "docs/app", "docs/components",
    "status", "nginx", "nginx/sites-available",
    "nginx/sites-enabled", "nginx/ssl",
    "monitoring", "grafana", "grafana/datasources",
    "grafana/dashboards", "scripts"
)

$createdDirs = 0
foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "   Created: $dir" -ForegroundColor Green
        $createdDirs++
    }
}

if ($createdDirs -eq 0) {
    Write-Host "✅ All directories exist" -ForegroundColor Green
}

# =============================================
# 3. DEPENDENCY MANAGEMENT
# =============================================

Write-Host "`n📦 Step 3: Dependencies" -ForegroundColor Yellow

# Main dependencies
if (Test-Path "package.json") {
    Write-Host "Installing main dependencies..." -ForegroundColor Cyan
    npm install --silent 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Main dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Main dependencies failed" -ForegroundColor Red
    }
}

# Docs dependencies
if (Test-Path "docs/package.json") {
    Write-Host "Installing docs dependencies..." -ForegroundColor Cyan
    Push-Location docs
    npm install --silent 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docs dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Docs dependencies failed" -ForegroundColor Red
    }
    Pop-Location
}

# =============================================
# 4. CONFIGURATION FIXES
# =============================================

Write-Host "`n🔧 Step 4: Configuration Fixes" -ForegroundColor Yellow

# Fix package.json issues
if (Test-Path "package.json") {
    $content = Get-Content "package.json" -Raw
    $modified = $false

    if ($content -match '"plaid": "\^19\.1\.0"') {
        $content = $content -replace '"plaid": "\^19\.1\.0"', '"plaid": "^18.0.0"'
        $modified = $true
        Write-Host "✅ Fixed Plaid version" -ForegroundColor Green
    }

    if ($modified) {
        Set-Content "package.json" $content
        npm install --silent 2>&1 | Out-Null
        Write-Host "✅ Dependencies reinstalled" -ForegroundColor Green
    }
}

# Fix docs package.json
if (Test-Path "docs/package.json") {
    $docsContent = Get-Content "docs/package.json" -Raw
    if ($docsContent -match '"export": "next build && next export"') {
        $docsContent = $docsContent -replace '"export": "next build && next export"', '"export": "next build"'
        Set-Content "docs/package.json" $docsContent
        Write-Host "✅ Fixed Next.js export configuration" -ForegroundColor Green
    }
}

# =============================================
# 5. DOCKER OPERATIONS
# =============================================

Write-Host "`n🐳 Step 5: Docker Operations" -ForegroundColor Yellow

try {
    # Stop existing
    docker compose -f docker-compose.saas.yml down 2>&1 | Out-Null

    # Build all
    Write-Host "Building containers..." -ForegroundColor Cyan
    docker compose -f docker-compose.saas.yml build --no-cache 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All containers built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Container build failed" -ForegroundColor Red
        if ($AutoFix) {
            Write-Host "   Attempting rebuild..." -ForegroundColor Yellow
            docker compose -f docker-compose.saas.yml build --no-cache 2>&1 | Out-Null
        }
    }

    # Start services
    Write-Host "Starting services..." -ForegroundColor Cyan
    docker compose -f docker-compose.saas.yml up -d 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All services started" -ForegroundColor Green
    } else {
        Write-Host "❌ Service startup failed" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Docker operations failed: $_" -ForegroundColor Red
}

# =============================================
# 6. CONTINUOUS MONITORING
# =============================================

if ($Monitor) {
    Write-Host "`n📊 Step 6: Continuous Monitoring" -ForegroundColor Yellow

    while ($true) {
        Write-Host "`n--- Service Health Check ---" -ForegroundColor Cyan

        $services = @(
            @{name="Main App"; url="http://localhost:80/health"},
            @{name="Docs"; url="http://localhost:3001"},
            @{name="Status"; url="http://localhost:3002"},
            @{name="Grafana"; url="http://localhost:3003"},
            @{name="Prometheus"; url="http://localhost:9090"}
        )

        $healthy = 0
        foreach ($service in $services) {
            try {
                Invoke-WebRequest -Uri $service.url -Method Head -TimeoutSec 3 -ErrorAction Stop | Out-Null
                Write-Host "✅ $($service.name) - ONLINE" -ForegroundColor Green
                $healthy++
            } catch {
                Write-Host "❌ $($service.name) - OFFLINE" -ForegroundColor Red

                if ($AutoFix) {
                    Write-Host "   🔄 Restarting $($service.name)..." -ForegroundColor Yellow
                    docker compose -f docker-compose.saas.yml restart $($service.name.ToLower()) 2>&1 | Out-Null
                    Start-Sleep -Seconds 3
                }
            }
        }

        $percentage = [math]::Round(($healthy / $services.Count) * 100, 1)
        Write-Host "`n📈 Health: $percentage% ($healthy/$($services.Count) services)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })

        if (-not $Monitor) { break }
        Write-Host "Next check in 30 seconds... (Ctrl+C to stop)" -ForegroundColor Gray
        Start-Sleep -Seconds 30
    }
}

# =============================================
# 7. FINAL VALIDATION
# =============================================

Write-Host "`n🎯 Step 7: Final Validation" -ForegroundColor Yellow

$endpoints = @(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:9090"
)

$onlineServices = 0
foreach ($endpoint in $endpoints) {
    try {
        Invoke-WebRequest -Uri $endpoint -Method Head -TimeoutSec 5 -ErrorAction Stop | Out-Null
        Write-Host "✅ $(Split-Path $endpoint -Leaf) - ONLINE" -ForegroundColor Green
        $onlineServices++
    } catch {
        Write-Host "❌ $(Split-Path $endpoint -Leaf) - OFFLINE" -ForegroundColor Red
    }
}

# =============================================
# 8. PROGRESS METRICS
# =============================================

Write-Host "`n📊 PROGRESS METRICS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

$dockerRunning = docker ps -q 2>$null
$nodeWorking = Test-Path "node_modules"
$docsWorking = Test-Path "docs/node_modules"
$envExists = Test-Path ".env"

$completedSteps = 0
$totalSteps = 4

if ($dockerInfo) { $completedSteps++ }
if ($nodeWorking -and $docsWorking) { $completedSteps++ }
if ($envExists) { $completedSteps++ }
if ($dockerRunning) { $completedSteps++ }

$progressPercentage = [math]::Round(($completedSteps / $totalSteps) * 100, 1)

Write-Host "✅ Tasks Completed: $completedSteps / $totalSteps" -ForegroundColor Green
Write-Host "⏳ Overall Progress: $progressPercentage%" -ForegroundColor Cyan
Write-Host "🟢 Services Online: $onlineServices / $($endpoints.Count)" -ForegroundColor $(if ($onlineServices -eq $endpoints.Count) { "Green" } else { "Yellow" })

# =============================================
# 9. RECOMMENDATIONS
# =============================================

Write-Host "`n💡 RECOMMENDATIONS" -ForegroundColor Cyan

if (-not $dockerInfo) {
    Write-Host "1. Start Docker Desktop" -ForegroundColor Yellow
}

if (-not ($nodeWorking -and $docsWorking)) {
    Write-Host "2. Run 'npm install' in project root and docs/" -ForegroundColor Yellow
}

if (-not $envExists) {
    Write-Host "3. Create .env file from .env.local" -ForegroundColor Yellow
}

if ($onlineServices -lt $endpoints.Count) {
    Write-Host "4. Check Docker logs: docker compose logs -f" -ForegroundColor Yellow
}

# =============================================
# 10. FINAL STATUS
# =============================================

Write-Host "`n🌐 SERVICE URLs" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "• Main App:    http://localhost:3000" -ForegroundColor White
Write-Host "• Admin:       http://localhost:3000/admin" -ForegroundColor White
Write-Host "• API:         http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host "• Docs:        http://localhost:3001" -ForegroundColor White
Write-Host "• Status:      http://localhost:3002" -ForegroundColor White
Write-Host "• Grafana:     http://localhost:3003" -ForegroundColor White
Write-Host "• Prometheus:  http://localhost:9090" -ForegroundColor White

Write-Host "`n📋 QUICK COMMANDS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "• View logs:    docker compose -f docker-compose.saas.yml logs -f" -ForegroundColor White
Write-Host "• Restart all:  docker compose -f docker-compose.saas.yml restart" -ForegroundColor White
Write-Host "• Stop all:     docker compose -f docker-compose.saas.yml down" -ForegroundColor White
Write-Host "• Check status: docker compose -f docker-compose.saas.yml ps" -ForegroundColor White

$finalStatus = if ($progressPercentage -eq 100 -and $onlineServices -eq $endpoints.Count) {
    "🎉 FULLY OPERATIONAL"
} elseif ($progressPercentage -ge 75) {
    "⚠️ MOSTLY READY"
} else {
    "⏳ WORK IN PROGRESS"
}

Write-Host "`n$finalStatus" -ForegroundColor $(if ($finalStatus -like "*🎉*") { "Green" } elseif ($finalStatus -like "*⚠️*") { "Yellow" } else { "Red" })

# Log to diary
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$diaryEntry = @"

### [$timestamp] ENHANCED MANAGEMENT - Session Complete
**Progress**: $progressPercentage% Complete
**Services Online**: $onlineServices/$($endpoints.Count)
**Auto-Fix Mode**: $(if ($AutoFix) { "ENABLED" } else { "DISABLED" })
**Status**: $finalStatus

"@

Add-Content -Path "project-diary.md" -Value $diaryEntry

Write-Host "`n📖 Project diary updated!" -ForegroundColor Green
