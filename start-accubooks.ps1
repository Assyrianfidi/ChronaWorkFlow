# AccuBooks Startup Script - Windows PowerShell Version
# Enhanced version with comprehensive health checks and database initialization
# Compatible with Windows 11 and PowerShell 7+

param(
    [switch]$SkipDatabase,
    [switch]$SkipMigrations,
    [switch]$SkipBuild,
    [switch]$Verbose,
    [int]$MaxWaitTime = 120  # Maximum seconds to wait for health checks
)

# Exit on error
$ErrorActionPreference = "Stop"

# Configuration
$logFile = "BuildTracker.log"
$startTime = Get-Date

function Write-Log {
    param([string]$Message, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Status] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

function Load-EnvironmentVariables {
    if (Test-Path ".env") {
        Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan
        $envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
        foreach ($line in $envContent) {
            $parts = $line -split '=', 2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Remove quotes if present
                $value = $value -replace '^["'']|["'']$', ''
                [Environment]::SetEnvironmentVariable($key, $value)
                if ($Verbose) {
                    Write-Host "  Set $key = $value" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "ERROR: .env file not found" -ForegroundColor Red
        exit 1
    }
}

function Test-DockerRunning {
    try {
        $dockerInfo = docker info 2>$null
        return $true
    } catch {
        return $false
    }
}

function Wait-ForContainer {
    param(
        [string]$ContainerName,
        [int]$MaxAttempts = 30,
        [int]$SleepSeconds = 5
    )

    Write-Host "Waiting for $ContainerName to be healthy..." -ForegroundColor Yellow

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $healthStatus = docker inspect -f '{{.State.Health.Status}}' $ContainerName 2>$null
            if ($healthStatus -eq "healthy") {
                Write-Host "SUCCESS: $ContainerName is healthy" -ForegroundColor Green
                return $true
            }
        } catch {
            # Container might not exist or not have health checks yet
        }

        Write-Host "Waiting for $ContainerName to be healthy... (attempt $attempt/$MaxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds $SleepSeconds
    }

    Write-Host "ERROR: Timed out waiting for $ContainerName to be healthy" -ForegroundColor Red
    return $false
}

function Test-Endpoint {
    param([string]$Url, [string]$Description)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        Write-Host "SUCCESS: $Description - HTTP $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "ERROR: $Description - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "Starting AccuBooks services..." -ForegroundColor Green

# Initialize log
Clear-Content $logFile -ErrorAction SilentlyContinue
Write-Log "AccuBooks Windows PowerShell Startup Started" "START"

# Load environment variables
Load-EnvironmentVariables

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Docker Desktop is running" -ForegroundColor Green

# Check if required ports are available
$ports = @(3000, 3001, 3002, 3003, 5432, 6379, 9090)
$available = $true

Write-Host "Checking required ports..." -ForegroundColor Cyan
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "ERROR: Port $port is already in use" -ForegroundColor Red
            $available = $false
        } else {
            Write-Host "SUCCESS: Port $port is available" -ForegroundColor Green
        }
    } catch {
        Write-Host "SUCCESS: Port $port is available" -ForegroundColor Green
    }
}

if (-not $available) {
    Write-Host "ERROR: Some required ports are in use. Please free them up and try again." -ForegroundColor Red
    exit 1
}

# Clean up any existing containers
Write-Host "Stopping any running containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.saas.yml down -v 2>$null

# Build if not skipped
if (-not $SkipBuild) {
    Write-Host "Building Docker images..." -ForegroundColor Cyan
    docker-compose -f docker-compose.saas.yml build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker build failed" -ForegroundColor Red
        exit 1
    }
}

# Start PostgreSQL and Redis first
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml up -d postgres redis

# Wait for PostgreSQL to be ready
if (-not (Wait-ForContainer "accubooks-postgres-1")) {
    Write-Host "ERROR: Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

# Initialize the database (skip if requested)
if (-not $SkipDatabase) {
    Write-Host "Initializing database..." -ForegroundColor Cyan

    # Check if init script exists
    if (Test-Path "scripts\init-db.js") {
        node scripts\init-db.js
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Database initialization failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "WARNING: Database init script not found, skipping initialization..." -ForegroundColor Yellow
    }

    # Run database migrations if not skipped
    if (-not $SkipMigrations) {
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        docker exec accubooks-app-1 npx drizzle-kit push 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Database migrations failed or not needed" -ForegroundColor Yellow
        } else {
            Write-Host "SUCCESS: Database migrations completed" -ForegroundColor Green
        }
    }
}

# Start all services
Write-Host "Starting all services..." -ForegroundColor Green
docker-compose -f docker-compose.saas.yml up -d

# Wait for app to be ready
if (Wait-ForContainer "accubooks-app-1") {
    Write-Host "All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "AccuBooks URLs:" -ForegroundColor Cyan
    Write-Host "  Main Application: http://localhost:3000"
    Write-Host "  API Documentation: http://localhost:3001"
    Write-Host "  Status Dashboard: http://localhost:3002"
    Write-Host "  Grafana Monitoring: http://localhost:3003"
    Write-Host "  Prometheus Metrics: http://localhost:9090"
    Write-Host "  Nginx Health: http://localhost:80/health"
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Gray
    Write-Host "  View logs: docker-compose -f docker-compose.saas.yml logs -f"
    Write-Host "  Stop services: docker-compose -f docker-compose.saas.yml down"
    Write-Host "  Restart app: docker-compose -f docker-compose.saas.yml restart app"
} else {
    Write-Host "Failed to start application" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose -f docker-compose.saas.yml logs" -ForegroundColor Yellow
    exit 1
}

# Final verification
Write-Host "Final verification..." -ForegroundColor Cyan
$endpointsWorking = $true

$endpoints = @(
    @{Url="http://localhost:3000"; Desc="Main Application"},
    @{Url="http://localhost:3000/api/health"; Desc="API Backend"},
    @{Url="http://localhost:3001"; Desc="Documentation"},
    @{Url="http://localhost:3002"; Desc="Status Dashboard"},
    @{Url="http://localhost:3003"; Desc="Grafana"},
    @{Url="http://localhost:9090"; Desc="Prometheus"}
)

foreach ($endpoint in $endpoints) {
    if (-not (Test-Endpoint $endpoint.Url $endpoint.Desc)) {
        $endpointsWorking = $false
    }
}

# Check database and Redis
Write-Host "Checking backend services..." -ForegroundColor Cyan
try {
    $dbResult = docker exec accubooks-postgres-1 psql -U postgres -d AccuBooks -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    Write-Host "SUCCESS: Database: $($dbResult | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value }) tables" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Database connection failed" -ForegroundColor Red
    $endpointsWorking = $false
}

try {
    $redisResult = docker exec accubooks-redis-1 redis-cli ping 2>$null
    if ($redisResult -eq "PONG") {
        Write-Host "SUCCESS: Redis: Connected" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Redis: Not responding" -ForegroundColor Red
        $endpointsWorking = $false
    }
} catch {
    Write-Host "ERROR: Redis connection failed" -ForegroundColor Red
    $endpointsWorking = $false
}

# Show final status
Write-Host ""
Write-Host "Final Status Report:" -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

if ($endpointsWorking) {
    Write-Host "SUCCESS: All systems operational!" -ForegroundColor Green
    Write-Log "AccuBooks startup completed successfully" "SUCCESS"
} else {
    Write-Host "WARNING: Some services may not be working correctly" -ForegroundColor Yellow
    Write-Host "Check logs with: docker-compose -f docker-compose.saas.yml logs" -ForegroundColor Gray
    Write-Log "Some services may have issues" "WARNING"
}
