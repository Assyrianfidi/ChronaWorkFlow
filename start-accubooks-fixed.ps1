# AccuBooks Startup Script - Fixed
# Validates environment and starts all services

Write-Host "🚀 Starting AccuBooks Environment Validation..." -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if required ports are available
$ports = @(3000, 3001, 3002, 3003, 5432, 6379, 9090)
$available = $true

Write-Host "🔍 Checking required ports..." -ForegroundColor Cyan
foreach ($port in $ports) {
    $portInUse = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
    if ($portInUse) {
        Write-Host "❌ Port $port is already in use" -ForegroundColor Red
        $available = $false
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

if (-not $available) {
    Write-Host "❌ Some required ports are in use. Please free them up and try again." -ForegroundColor Red
    exit 1
}

# Clean up any existing containers
Write-Host "🧹 Cleaning up any existing containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml down --remove-orphans

# Build and start the services
Write-Host "🚀 Starting AccuBooks services..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml up -d --build

# Check if services started successfully
Write-Host "`n🔄 Verifying services..." -ForegroundColor Cyan
Start-Sleep -Seconds 10  # Give services time to start

# Get list of services from docker-compose file
$services = (docker-compose -f docker-compose.saas.yml config --services) -split "`n"
$allRunning = $true

foreach ($service in $services) {
    $status = docker-compose -f docker-compose.saas.yml ps $service | Select-Object -Last 1
    if ($status -match "running") {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
        $allRunning = $false
        # Show logs for failed container
        Write-Host "📝 $service logs:" -ForegroundColor Yellow
        docker-compose -f docker-compose.saas.yml logs $service | Select-Object -Last 20
    }
}

# Final status
if ($allRunning) {
    Write-Host "`n🎉 All services started successfully!" -ForegroundColor Green
    Write-Host "🌐 Access the application at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📚 Documentation: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "📊 Status Page: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "📈 Grafana: http://localhost:3003" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Some services failed to start. Check the logs above for details." -ForegroundColor Red
    Write-Host "View logs with: docker-compose -f docker-compose.saas.yml logs" -ForegroundColor Yellow
}

# Show running containers
docker ps --format "table {{.Names}}	{{.Status}}	{{.Ports}}"
