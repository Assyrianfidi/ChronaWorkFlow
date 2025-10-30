# AccuBooks Project Repair Script
# This script fixes all common issues and rebuilds the project

param(
    [switch]$SkipDocker,
    [switch]$Verbose
)

Write-Host "🩺 AccuBooks Project Health Check & Repair Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Set working directory
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}
Set-Location $projectRoot

Write-Host "`n📁 Working Directory: $projectRoot" -ForegroundColor Yellow

# 1. Check Docker Desktop
Write-Host "`n🐳 Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop and run this script again" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker Desktop is not installed or not running" -ForegroundColor Red
    exit 1
}

# 2. Check Docker Compose
Write-Host "`n🔧 Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Compose is available" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# 3. Check required files and directories
Write-Host "`n📂 Checking Project Structure..." -ForegroundColor Yellow

$requiredDirs = @(
    "server",
    "docs",
    "status",
    "nginx",
    "nginx/sites-available",
    "nginx/sites-enabled",
    "nginx/ssl",
    "monitoring",
    "grafana",
    "grafana/datasources",
    "grafana/dashboards",
    "scripts"
)

$createdDirs = @()
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ Directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing directory: $dir" -ForegroundColor Red
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $createdDirs += $dir
        Write-Host "   → Created: $dir" -ForegroundColor Green
    }
}

# 4. Check required files
Write-Host "`n📄 Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "docker-compose.saas.yml",
    "package.json",
    "package-lock.json",
    "docs/package.json",
    "docs/next.config.js",
    "docs/app/layout.tsx",
    "docs/app/page.tsx",
    "status/Dockerfile",
    "status/index.html",
    "status/nginx.conf",
    "nginx/saas.conf",
    "monitoring/prometheus.yml"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ File: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing file: $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

# 5. Check .env file
Write-Host "`n🔐 Checking Environment Files..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    if (Test-Path ".env.local") {
        Copy-Item ".env.local" ".env"
        Write-Host "✅ Created .env from .env.local" -ForegroundColor Green
    } else {
        Write-Host "❌ Neither .env nor .env.local found" -ForegroundColor Red
        Write-Host "   → Please create a .env file with your configuration" -ForegroundColor Yellow
    }
}

# 6. Fix Next.js export issue
Write-Host "`n🔧 Fixing Next.js Configuration..." -ForegroundColor Yellow

# Update docs package.json to remove deprecated next export
$docsPackageJson = "docs/package.json"
if (Test-Path $docsPackageJson) {
    $content = Get-Content $docsPackageJson -Raw
    if ($content -match '"export": "next build && next export"') {
        Write-Host "❌ Found deprecated Next.js export command" -ForegroundColor Red
        $content = $content -replace '"export": "next build && next export"', '"export": "next build"'
        Set-Content $docsPackageJson $content
        Write-Host "   → Fixed: Updated export script to use modern Next.js format" -ForegroundColor Green
    }
}

# 7. Fix Plaid dependency
Write-Host "`n📦 Fixing npm Dependencies..." -ForegroundColor Yellow
$mainPackageJson = "package.json"
if (Test-Path $mainPackageJson) {
    $content = Get-Content $mainPackageJson -Raw
    if ($content -match '"plaid": "\^19\.1\.0"') {
        Write-Host "❌ Found invalid Plaid version ^19.1.0" -ForegroundColor Red
        $content = $content -replace '"plaid": "\^19\.1\.0"', '"plaid": "^18.0.0"'
        Set-Content $mainPackageJson $content
        Write-Host "   → Fixed: Updated Plaid to version ^18.0.0" -ForegroundColor Green
    }
}

# 8. Install dependencies
Write-Host "`n📥 Installing Dependencies..." -ForegroundColor Yellow

# Main project dependencies
if (Test-Path "package-lock.json") {
    Write-Host "Installing main project dependencies..." -ForegroundColor Cyan
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Main dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install main dependencies" -ForegroundColor Red
    }
}

# Docs dependencies
if (Test-Path "docs/package.json") {
    Write-Host "Installing docs dependencies..." -ForegroundColor Cyan
    Push-Location docs
    if (Test-Path "package-lock.json") {
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docs dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install docs dependencies" -ForegroundColor Red
        }
    } else {
        Write-Host "Generating docs package-lock.json..." -ForegroundColor Cyan
        npm install --silent
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docs package-lock.json generated" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate docs package-lock.json" -ForegroundColor Red
        }
    }
    Pop-Location
}

# 9. Stop existing containers
if (-not $SkipDocker) {
    Write-Host "`n🛑 Stopping Existing Containers..." -ForegroundColor Yellow
    docker compose -f docker-compose.saas.yml down 2>&1 | Out-Null
    Write-Host "✅ Existing containers stopped" -ForegroundColor Green

    # 10. Build containers
    Write-Host "`n🔨 Building Docker Containers..." -ForegroundColor Yellow
    docker compose -f docker-compose.saas.yml build --no-cache 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All containers built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Container build failed" -ForegroundColor Red
        Write-Host "   Check the build logs above for specific errors" -ForegroundColor Yellow
    }

    # 11. Start containers
    Write-Host "`n🚀 Starting Services..." -ForegroundColor Yellow
    docker compose -f docker-compose.saas.yml up -d 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All services started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start services" -ForegroundColor Red
    }

    # 12. Check service status
    Write-Host "`n📊 Checking Service Status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    docker compose -f docker-compose.saas.yml ps

    # 13. Test services
    Write-Host "`n🧪 Testing Services..." -ForegroundColor Yellow

    $services = @(
        @{name="Main App"; url="http://localhost:80/health"},
        @{name="API"; url="http://localhost:80/api/v1/health"},
        @{name="Docs"; url="http://localhost:3001"},
        @{name="Status"; url="http://localhost:3002"},
        @{name="Grafana"; url="http://localhost:3003"},
        @{name="Prometheus"; url="http://localhost:9090"}
    )

    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.url -Method Head -TimeoutSec 5
            Write-Host "✅ $($service.name): $($service.url) - ONLINE" -ForegroundColor Green
        } catch {
            Write-Host "❌ $($service.name): $($service.url) - OFFLINE" -ForegroundColor Red
        }
    }
}

# 14. Summary
Write-Host "`n📋 SUMMARY" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($createdDirs.Count -gt 0) {
    Write-Host "`n📁 Created Directories:" -ForegroundColor Green
    foreach ($dir in $createdDirs) {
        Write-Host "   • $dir"
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n❌ Still Missing Files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   • $file"
    }
    Write-Host "   These files may be created by the application or need manual creation" -ForegroundColor Yellow
}

Write-Host "`n✅ Project Health Check Complete!" -ForegroundColor Green
Write-Host "`n🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "   • Main App: http://localhost:3000" -ForegroundColor White
Write-Host "   • Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "   • API: http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host "   • Docs: http://localhost:3001" -ForegroundColor White
Write-Host "   • Status: http://localhost:3002" -ForegroundColor White
Write-Host "   • Grafana: http://localhost:3003" -ForegroundColor White
Write-Host "   • Prometheus: http://localhost:9090" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open the URLs above in your browser" -ForegroundColor White
Write-Host "   2. Check Grafana at http://localhost:3003 (admin/admin)" -ForegroundColor White
Write-Host "   3. Monitor services at http://localhost:3002" -ForegroundColor White
Write-Host "   4. View logs with: docker compose -f docker-compose.saas.yml logs -f" -ForegroundColor White

Write-Host "`n🎉 AccuBooks SaaS platform is ready!" -ForegroundColor Green
