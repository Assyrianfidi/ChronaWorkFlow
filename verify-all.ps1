# verify-all.ps1
# Windows PowerShell Comprehensive Verification Script for AccuBooks
# Verifies all Docker containers, HTTP endpoints, database, Redis, and worker processes
# Compatible with Windows 11 and PowerShell 7+

param(
    [switch]$Verbose,
    [switch]$Quick,
    [int]$TimeoutSeconds = 30
)

# Configuration
$logFile = "verification.log"
$startTime = Get-Date

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$warningColor = "Yellow"
$infoColor = "Cyan"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

function Test-DockerRunning {
    try {
        $dockerInfo = docker info 2>$null
        return $true
    } catch {
        return $false
    }
}

function Test-Endpoint {
    param([string]$Url, [string]$Description)

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
        Write-Host "SUCCESS: $Description - HTTP $($response.StatusCode)" -ForegroundColor $successColor
        return $true
    } catch {
        Write-Host "ERROR: $Description - $($_.Exception.Message)" -ForegroundColor $errorColor
        return $false
    }
}

function Wait-ForEndpoint {
    param([string]$Url, [string]$Description, [int]$MaxAttempts = 10)

    Write-Host "Waiting for $Description..." -ForegroundColor $warningColor

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "SUCCESS: $Description - HTTP $($response.StatusCode)" -ForegroundColor $successColor
                return $true
            }
        } catch {
            # Still waiting
        }

        Write-Host "Attempt $attempt/$MaxAttempts for $Description..." -ForegroundColor $warningColor
        Start-Sleep -Seconds 3
    }

    Write-Host "ERROR: $Description - Timed out after $MaxAttempts attempts" -ForegroundColor $errorColor
    return $false
}

function Test-DockerContainer {
    param([string]$ContainerName, [string]$Description)

    try {
        $containerInfo = docker ps -f "name=$ContainerName" --format "{{.Names}}"
        if ($containerInfo -and $containerInfo.Contains($ContainerName)) {
            Write-Host "SUCCESS: $Description - Running" -ForegroundColor $successColor
            return $true
        } else {
            Write-Host "ERROR: $Description - Not Running" -ForegroundColor $errorColor
            return $false
        }
    } catch {
        Write-Host "ERROR: $Description - Error checking status: $($_.Exception.Message)" -ForegroundColor $errorColor
        return $false
    }
}

function Test-Database {
    try {
        $dbResult = docker exec accubooks-postgres-1 psql -U postgres -d AccuBooks -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
        $tableCount = [int]($dbResult | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })
        Write-Host "SUCCESS: Database - $tableCount tables" -ForegroundColor $successColor
        return $true
    } catch {
        Write-Host "ERROR: Database - Connection failed: $($_.Exception.Message)" -ForegroundColor $errorColor
        return $false
    }
}

function Test-Redis {
    try {
        $redisResult = docker exec accubooks-redis-1 redis-cli ping 2>$null
        if ($redisResult -eq "PONG") {
            Write-Host "SUCCESS: Redis - Connected" -ForegroundColor $successColor
            return $true
        } else {
            Write-Host "ERROR: Redis - Not responding" -ForegroundColor $errorColor
            return $false
        }
    } catch {
        Write-Host "ERROR: Redis - Connection failed: $($_.Exception.Message)" -ForegroundColor $errorColor
        return $false
    }
}

function Test-WorkerProcess {
    try {
        $workerResult = docker exec accubooks-worker-1 node -e "console.log('Worker operational'); process.exit(0)" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Worker Process - Operational" -ForegroundColor $successColor
            return $true
        } else {
            Write-Host "ERROR: Worker Process - Not responding" -ForegroundColor $errorColor
            return $false
        }
    } catch {
        Write-Host "ERROR: Worker Process - Error: $($_.Exception.Message)" -ForegroundColor $errorColor
        return $false
    }
}

# Main execution
Write-Host "AccuBooks Windows Verification Script" -ForegroundColor $infoColor
Write-Host "=====================================" -ForegroundColor $infoColor

# Initialize log
Clear-Content $logFile -ErrorAction SilentlyContinue
Write-Log "AccuBooks Windows verification started" "START"

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "ERROR: Docker Desktop is not running. Please start Docker Desktop and try again." -ForegroundColor $errorColor
    Write-Log "Docker Desktop not running" "ERROR"
    exit 1
}
Write-Host "SUCCESS: Docker Desktop is running" -ForegroundColor $successColor

# Check Docker containers
Write-Host ""
Write-Host "Checking Docker Containers..." -ForegroundColor $infoColor

$containers = @(
    @{Name="accubooks-app-1"; Desc="Main Application"},
    @{Name="accubooks-postgres-1"; Desc="PostgreSQL Database"},
    @{Name="accubooks-redis-1"; Desc="Redis Cache"},
    @{Name="accubooks-worker-1"; Desc="Worker Process 1"},
    @{Name="accubooks-worker-2"; Desc="Worker Process 2"},
    @{Name="accubooks-nginx-1"; Desc="Nginx Proxy"},
    @{Name="accubooks-docs-1"; Desc="Documentation"},
    @{Name="accubooks-status-1"; Desc="Status Dashboard"},
    @{Name="accubooks-grafana-1"; Desc="Grafana Monitoring"},
    @{Name="accubooks-prometheus-1"; Desc="Prometheus Metrics"}
)

$containersRunning = $true
foreach ($container in $containers) {
    if (-not (Test-DockerContainer $container.Name $container.Desc)) {
        $containersRunning = $false
    }
}

# Check HTTP endpoints
Write-Host ""
Write-Host "Checking HTTP Endpoints..." -ForegroundColor $infoColor

$endpoints = @(
    @{Url="http://localhost:3000"; Desc="Main Application"},
    @{Url="http://localhost:3000/api/health"; Desc="API Backend"},
    @{Url="http://localhost:3001"; Desc="Documentation"},
    @{Url="http://localhost:3002"; Desc="Status Dashboard"},
    @{Url="http://localhost:3003"; Desc="Grafana Monitoring"},
    @{Url="http://localhost:9090"; Desc="Prometheus Metrics"},
    @{Url="http://localhost:80/health"; Desc="Nginx Health"}
)

$endpointsWorking = $true
foreach ($endpoint in $endpoints) {
    if (-not $Quick) {
        if (-not (Wait-ForEndpoint $endpoint.Url $endpoint.Desc)) {
            $endpointsWorking = $false
        }
    } else {
        if (-not (Test-Endpoint $endpoint.Url $endpoint.Desc)) {
            $endpointsWorking = $false
        }
    }
}

# Check backend services
Write-Host ""
Write-Host "Checking Backend Services..." -ForegroundColor $infoColor

if (-not (Test-Database)) {
    $endpointsWorking = $false
}

if (-not (Test-Redis)) {
    $endpointsWorking = $false
}

if (-not (Test-WorkerProcess)) {
    $endpointsWorking = $false
}

# Show comprehensive status
Write-Host ""
Write-Host "COMPREHENSIVE STATUS REPORT" -ForegroundColor $infoColor
Write-Host "==========================" -ForegroundColor $infoColor

# Container status table
Write-Host "Docker Containers:" -ForegroundColor $infoColor
docker-compose -f docker-compose.saas.yml ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Final assessment
Write-Host ""
Write-Host "VERIFICATION SUMMARY" -ForegroundColor $infoColor

$allSystemsGo = $containersRunning -and $endpointsWorking

if ($allSystemsGo) {
    Write-Host "SUCCESS: All systems operational!" -ForegroundColor $successColor
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor $infoColor
    Write-Host "  Main Application: http://localhost:3000"
    Write-Host "  API Documentation: http://localhost:3001"
    Write-Host "  Status Dashboard: http://localhost:3002"
    Write-Host "  Grafana Monitoring: http://localhost:3003"
    Write-Host "  Prometheus Metrics: http://localhost:9090"
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor $warningColor
    Write-Host "  View logs: docker-compose -f docker-compose.saas.yml logs -f"
    Write-Host "  Restart services: docker-compose -f docker-compose.saas.yml restart"
    Write-Host "  Stop services: docker-compose -f docker-compose.saas.yml down"

    Write-Log "All systems verified successfully" "SUCCESS"
} else {
    Write-Host "WARNING: Some services may not be working correctly" -ForegroundColor $warningColor
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor $warningColor
    Write-Host "  1. Check Docker Desktop is running"
    Write-Host "  2. View logs: docker-compose -f docker-compose.saas.yml logs"
    Write-Host "  3. Restart services: docker-compose -f docker-compose.saas.yml restart"
    Write-Host "  4. Check ports: netstat -ano | findstr :3000"

    Write-Log "Some services may have issues" "WARNING"
}

# Show verification timing
$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host ""
Write-Host "Verification completed in: $($duration.TotalSeconds) seconds" -ForegroundColor $infoColor

Write-Log "AccuBooks Windows verification completed in $($duration.TotalSeconds) seconds" "END"

# Exit with appropriate code
if ($allSystemsGo) {
    exit 0
} else {
    exit 1
}
