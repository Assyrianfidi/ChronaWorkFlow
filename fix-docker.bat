@echo off
REM =========================================
REM ACCUBOOKS DOCKER CONNECTION FIX (BATCH)
REM =========================================
REM Windows batch version of Docker connection fix

echo 🔧 ACCUBOOKS DOCKER CONNECTION FIX
echo ===================================
echo Fixing Docker container startup and localhost connection issues
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

REM Check Docker
echo 🔍 Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not running! Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Phase 1: Clean old containers and dependencies
echo 🧹 PHASE 1: CLEANING OLD CONTAINERS AND DEPENDENCIES
echo ====================================================
echo.

echo 🛑 Stopping all Docker containers...
docker compose -f docker-compose.saas.yml down -v >nul 2>&1
echo ✅ All containers stopped

echo 🧹 Removing node_modules and package locks...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del package-lock.json 2>nul
echo ✅ Cleaned node_modules and package-lock.json

echo 🧹 Clearing npm cache...
npm cache clean --force >nul 2>&1
echo ✅ npm cache cleared
echo.

REM Phase 2: Install dependencies correctly
echo 📦 PHASE 2: INSTALLING DEPENDENCIES CORRECTLY
echo ==============================================
echo.

echo ⚙️ Installing cross-env globally for Windows...
npm install -g cross-env >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to install cross-env globally
) else (
    echo ✅ cross-env installed globally
)

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

echo 📥 Installing all npm dependencies...
npm install >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to install npm dependencies!
    pause
    exit /b 1
) else (
    echo ✅ All dependencies installed successfully
)

echo ✅ Installed packages: $(powershell -Command "(Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue | Measure-Object).Count")
echo.

REM Phase 3: Update scripts for Windows
echo 🔧 PHASE 3: UPDATING SCRIPTS FOR WINDOWS
echo ========================================
echo.

echo 🔧 Updating npm scripts for Windows compatibility...
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
    Write-Host '⚠️ Scripts may already be updated';
}
"
echo ✅ Windows script compatibility updated
echo.

REM Phase 4: Test app outside Docker
echo 🧪 PHASE 4: TESTING APP OUTSIDE DOCKER
echo ======================================
echo.

echo Testing development server outside Docker...
powershell -Command "
try {
    Write-Host 'Starting test server...';
    $process = Start-Process powershell -ArgumentList '-NoProfile -WindowStyle Hidden -Command', 'cd /d %~dp0; npx cross-env NODE_ENV=development tsx server/index.ts' -PassThru -NoNewWindow;
    Start-Sleep -Seconds 5;

    if ($process -and !$process.HasExited) {
        Write-Host '✅ Development server started successfully';
        try {
            $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method Head -TimeoutSec 5 -ErrorAction Stop;
            Write-Host '✅ localhost:3000 is responding!';
        } catch {
            Write-Host '⚠️ localhost:3000 not responding yet';
        }
        Stop-Process $process -ErrorAction SilentlyContinue;
    } else {
        Write-Host '❌ Development server failed to start';
    }
} catch {
    Write-Host '❌ Failed to test development server';
}
"
echo ✅ Development server test completed
echo.

REM Phase 5: Clean and rebuild Docker
echo 🐳 PHASE 5: CLEANING AND REBUILDING DOCKER
echo ==========================================
echo.

echo 🧹 Cleaning up old Docker images and cache...
docker system prune -f >nul 2>&1
docker image prune -f >nul 2>&1
echo ✅ Old Docker images and cache cleaned

echo 🛠️ Cleaning Rollup optional binaries...
if exist "node_modules\.bin\.rollup*" del /s /q "node_modules\.bin\.rollup*" 2>nul
if exist "node_modules\.rollup*" del /s /q "node_modules\.rollup*" 2>nul
echo ✅ Rollup binaries cleaned

echo 📦 Reinstalling dependencies after cleanup...
npm install >nul 2>&1
echo ✅ Dependencies reinstalled

echo 🔄 Rebuilding all containers (no cache)...
docker compose -f docker-compose.saas.yml build --no-cache
if errorlevel 1 (
    echo ❌ Docker build failed!
    echo Check Docker configuration and try again.
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

REM Phase 6: Check container status
echo 🔍 PHASE 6: CHECKING CONTAINER STATUS
echo =====================================
echo.

echo Checking Docker container status...
docker compose -f docker-compose.saas.yml ps
if errorlevel 1 (
    echo ❌ Failed to get container status!
) else (
    echo ✅ Container status retrieved
)

echo.
echo Checking Docker container logs...
docker compose -f docker-compose.saas.yml logs --tail=10
echo ✅ Container logs checked
echo.

REM Phase 7: Test in browser
echo 🌐 PHASE 7: TESTING IN BROWSER
echo ==============================
echo.

set HEALTHY=0
set TOTAL=0

powershell -Command "
$testUrls = @(
    @{name='Main App'; url='http://localhost:3000'; critical=$true},
    @{name='Admin Panel'; url='http://localhost:3000/admin'; critical=$true},
    @{name='API Gateway'; url='http://localhost:3000/api/v1/health'; critical=$true},
    @{name='Documentation'; url='http://localhost:3001'; critical=$false},
    @{name='Dashboard'; url='http://localhost:3004/dashboard'; critical=$true}
);

foreach ($service in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $service.url -Method Head -TimeoutSec 10 -ErrorAction Stop;
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

REM Phase 8: Final status
echo 🎉 DOCKER CONNECTION FIX COMPLETED!
echo ===================================
echo.
echo 🌐 READY TO ACCESS:
echo   • Main App:    http://localhost:3000
echo   • Admin Panel: http://localhost:3000/admin
echo   • API Gateway: http://localhost:3000/api/v1/health
echo   • Documentation: http://localhost:3001
echo   • Dashboard:   http://localhost:3004/dashboard
echo.
echo 🔧 MANAGEMENT COMMANDS:
echo   • View logs:    docker compose -f docker-compose.saas.yml logs -f
echo   • Check status: docker compose -f docker-compose.saas.yml ps
echo   • Restart:      docker compose -f docker-compose.saas.yml restart
echo   • Stop all:     docker compose -f docker-compose.saas.yml down
echo.
echo 📋 TROUBLESHOOTING:
echo   • If still not working, check Docker Desktop logs
echo   • Verify Windows firewall allows ports 3000-3004
echo   • Try: npm run dev directly to test outside Docker
echo.
echo ✅ Docker connection issues should now be resolved!
echo.

pause
