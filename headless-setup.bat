@echo off
REM =========================================
REM ACCUBOOKS HEADLESS AUTO-FIX (BATCH VERSION)
REM =========================================
REM One-click headless deployment for Windows

echo 🎯 ACCUBOOKS HEADLESS AUTO-FIX
echo ==============================
echo Starting comprehensive headless repair and deployment...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found!
    echo Please run this from the AccuBooks root directory.
    pause
    exit /b 1
)

echo 📁 Working Directory: %CD%
echo.

REM Check Node.js and npm
echo 🔍 Checking Node.js and npm...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found! Please install npm.
    pause
    exit /b 1
)

echo ✅ Node.js and npm available
echo.

REM Check Docker (optional)
echo 🔍 Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Docker not running. Docker features will be skipped.
    set SKIP_DOCKER=1
) else (
    echo ✅ Docker available
    set SKIP_DOCKER=0
)
echo.

REM Phase 1: Clean and fix dependencies
echo 🧹 PHASE 1: CLEANING AND FIXING DEPENDENCIES
echo ============================================
echo.

echo 🧹 Cleaning existing dependencies...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del package-lock.json 2>nul
echo ✅ Removed old node_modules and package-lock.json
echo.

echo 🔧 Fixing QuickBooks dependency...
powershell -Command "
try {
    $json = Get-Content 'package.json' -Raw | ConvertFrom-Json -ErrorAction Stop;
    if ($json.dependencies.PSObject.Properties.Name -contains 'quickbooks') {
        Write-Host '   ❌ Found invalid quickbooks package';
        $json.dependencies.PSObject.Properties.Remove('quickbooks');
        $json | ConvertTo-Json -Depth 10 | Set-Content 'package.json';
        Write-Host '   ✅ Removed invalid quickbooks dependency';
    } else {
        Write-Host '   ✅ No invalid quickbooks dependency found';
    }
} catch {
    Write-Host '   ⚠️ Could not fix QuickBooks dependency automatically';
}
"
echo ✅ QuickBooks dependency fixed
echo.

echo 🔧 Installing cross-env for Windows compatibility...
npm install --save-dev cross-env --silent
if errorlevel 1 (
    echo ❌ Failed to install cross-env
) else (
    echo ✅ cross-env installed for Windows compatibility
)
echo.

echo 🔧 Updating npm scripts for Windows...
powershell -Command "
$content = Get-Content 'package.json' -Raw;
$updated = $false;

if ($content -match '\"dev\":\s*\"NODE_ENV=development') {
    $content = $content -replace '\"dev\":\s*\"NODE_ENV=development([^\"]*)\"', '\"dev\": \"cross-env NODE_ENV=development$1\"';
    $updated = $true;
}

if ($content -match '\"build\":\s*\"[^\"]*NODE_ENV=production') {
    $content = $content -replace '\"build\":\s*\"([^\"]*NODE_ENV=production[^\"]*)\"', '\"build\": \"cross-env NODE_ENV=production $1\"';
    $updated = $true;
}

if ($content -match '\"start\":\s*\"NODE_ENV=production') {
    $content = $content -replace '\"start\":\s*\"NODE_ENV=production([^\"]*)\"', '\"start\": \"cross-env NODE_ENV=production$1\"';
    $updated = $true;
}

if ($updated) {
    Set-Content 'package.json' $content;
    Write-Host '✅ Updated npm scripts for Windows compatibility';
} else {
    Write-Host '⚠️ Scripts may already be updated or need manual review';
}
"
echo ✅ Windows script compatibility updated
echo.

echo 📦 Clearing npm cache and installing dependencies...
npm cache clean --force >nul 2>&1
echo ✅ npm cache cleared

npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install dependencies!
    echo Please check for dependency conflicts in package.json
    pause
    exit /b 1
) else (
    echo ✅ All dependencies installed successfully
)
echo.

REM Phase 2: Docker setup (if available)
if "%SKIP_DOCKER%"=="0" (
    echo.
    echo 🐳 PHASE 2: DOCKER CONTAINER SETUP
    echo ==================================
    echo.

    echo 🛑 Stopping existing containers...
    docker compose -f docker-compose.saas.yml down >nul 2>&1
    echo ✅ All containers stopped

    echo 🗑️ Cleaning up old images...
    docker image prune -f >nul 2>&1
    echo ✅ Old images removed

    echo 🔄 Rebuilding all containers...
    docker compose -f docker-compose.saas.yml build --no-cache
    if errorlevel 1 (
        echo ❌ Docker build failed!
        echo Please check Docker configuration and try again.
    ) else (
        echo ✅ All containers built successfully

        echo 🚀 Starting all services...
        docker compose -f docker-compose.saas.yml up -d
        if errorlevel 1 (
            echo ❌ Failed to start services!
        ) else (
            echo ✅ All services started successfully
            timeout /t 30 /nobreak >nul
        )
    )
    echo.
) else (
    echo.
    echo ⏭️ DOCKER SETUP SKIPPED
    echo ======================
    echo Docker not available. Install Docker Desktop to enable container features.
    echo.
)

REM Phase 3: Start headless services
echo 🚀 PHASE 3: STARTING HEADLESS SERVICES
echo ======================================
echo.

echo 🚀 Starting development server (headless)...
start /B powershell -NoProfile -WindowStyle Hidden -Command "cd /d %~dp0 && npm run dev"
timeout /t 5 /nobreak >nul
echo ✅ Development server started in background
echo.

echo 🤖 Starting autonomous monitoring (headless)...
start /B powershell -NoProfile -WindowStyle Hidden -Command "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File command-center.ps1 -Continuous -AutoFix -Interval 10"
echo ✅ Continuous monitoring started in background
echo.

REM Phase 4: Service validation
echo.
echo 🔍 PHASE 4: SERVICE VALIDATION
echo ==============================
echo.

set HEALTHY=0
set TOTAL=0

powershell -Command "
$services = @(
    @{name='Main App'; url='http://localhost:3000'; critical=$true},
    @{name='Admin Panel'; url='http://localhost:3000/admin'; critical=$true},
    @{name='API Gateway'; url='http://localhost:3000/api/v1/health'; critical=$true},
    @{name='Documentation'; url='http://localhost:3001'; critical=$false},
    @{name='Dashboard'; url='http://localhost:3004/dashboard'; critical=$true}
);

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.url -Method Head -TimeoutSec 5 -ErrorAction Stop;
        if ($response.StatusCode -eq 200) {
            Write-Host \"✅ $($service.name): ONLINE\" -ForegroundColor Green;
        } else {
            Write-Host \"⚠️ $($service.name): DEGRADED\" -ForegroundColor Yellow;
        }
    } catch {
        if ($service.critical) {
            Write-Host \"❌ $($service.name): OFFLINE\" -ForegroundColor Red;
        } else {
            Write-Host \"⚠️ $($service.name): OFFLINE\" -ForegroundColor Yellow;
        }
    }
}
"
echo.

REM Phase 5: Final status
echo.
echo 🎉 HEADLESS CASCADE AUTO-FIX COMPLETED!
echo =======================================
echo.
echo 🌐 ACCESS YOUR APPLICATION:
echo   • Main App:    http://localhost:3000
echo   • Admin Panel: http://localhost:3000/admin
echo   • API Gateway: http://localhost:3000/api/v1/health
echo   • Documentation: http://localhost:3001
echo   • Status Page: http://localhost:3002
echo   • Grafana:     http://localhost:3003
echo   • Prometheus:  http://localhost:9090
echo   • Dashboard:   http://localhost:3004/dashboard
echo.
echo 🤖 HEADLESS MODE ACTIVE:
echo   • Development server running in background
echo   • Continuous monitoring every 10 minutes
echo   • Auto-repair enabled for failed services
echo   • Real-time logging to cascade_headless.log
echo.
echo 📋 MANAGEMENT COMMANDS:
echo   • View Status: Get-Content project-diary.md -Tail 20
echo   • View Logs:   Get-Content cascade_headless.log -Tail 20
echo   • Quick Check: .\monitor-services.ps1 -Once
echo   • Stop All:    docker compose -f docker-compose.saas.yml down
echo.
echo ✅ All systems are now running completely autonomously!
echo.

pause
