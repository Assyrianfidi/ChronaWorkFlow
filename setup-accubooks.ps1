# Setup script for AccuBooks
# This script will set up the development environment and start all services

# Stop on error
$ErrorActionPreference = "Stop"

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Function to write colored output
function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "INFO",
        [string]$Color = "Cyan"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] [$Status] $Message" -ForegroundColor $Color
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker info 2>&1
        return $true
    } catch {
        return $false
    }
}

# Function to wait for a service to be healthy
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxRetries = 30,
        [int]$RetryDelay = 5
    )
    
    $retryCount = 0
    $isHealthy = $false
    
    Write-Status "Waiting for $ServiceName to be ready..."
    
    while (-not $isHealthy -and $retryCount -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $isHealthy = $true
                Write-Status "$ServiceName is ready" -Status "SUCCESS" -Color "Green"
                return $true
            }
        } catch {
            # Ignore errors and retry
        }
        
        $retryCount++
        Write-Status "Waiting for $ServiceName to be ready... (attempt $retryCount/$MaxRetries)" -Status "WAITING" -Color "Yellow"
        Start-Sleep -Seconds $RetryDelay
    }
    
    if (-not $isHealthy) {
        Write-Status "Timed out waiting for $ServiceName to be ready" -Status "ERROR" -Color "Red"
        return $false
    }
    
    return $true
}

# Main script execution
try {
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Status "This script requires administrator privileges. Please run as administrator." -Status "ERROR" -Color "Red"
        exit 1
    }
    
    Write-Status "Starting AccuBooks setup..." -Status "STARTING" -Color "Cyan"
    
    # Check if Docker is installed and running
    if (-not (Test-CommandExists "docker")) {
        Write-Status "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -Status "ERROR" -Color "Red"
        exit 1
    }
    
    if (-not (Test-DockerRunning)) {
        Write-Status "Docker is not running. Starting Docker Desktop..." -Status "INFO" -Color "Yellow"
        Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        
        # Wait for Docker to start
        $dockerReady = $false
        $maxRetries = 30
        $retryCount = 0
        
        while (-not $dockerReady -and $retryCount -lt $maxRetries) {
            if (Test-DockerRunning) {
                $dockerReady = $true
                break
            }
            
            $retryCount++
            Write-Status "Waiting for Docker to start... (attempt $retryCount/$maxRetries)" -Status "WAITING" -Color "Yellow"
            Start-Sleep -Seconds 5
        }
        
        if (-not $dockerReady) {
            Write-Status "Failed to start Docker. Please start Docker Desktop manually and try again." -Status "ERROR" -Color "Red"
            exit 1
        }
    }
    
    # Check if .env file exists, create if it doesn't
    $envFilePath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
    if (-not (Test-Path $envFilePath)) {
        Write-Status "Creating .env file..." -Status "INFO" -Color "Cyan"
        @"
# ========================================
# DATABASE CONFIGURATION (redacted)
# ========================================
DATABASE_URL=postgresql://postgres:<REDACTED_DB_PASSWORD>@postgres:5432/AccuBooks
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<REDACTED_DB_PASSWORD>
POSTGRES_DB=AccuBooks

# ========================================
# REDIS CONFIGURATION
# ========================================
REDIS_URL=redis://redis:6379

# ========================================
# NODE ENVIRONMENT
# ========================================
NODE_ENV=production

# ========================================
# PORTS
# ========================================
PORT=3000

# ========================================
# APPLICATION URLS
# ========================================
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
DOCS_URL=http://localhost:3001
STATUS_URL=http://localhost:3002

# ========================================
# AUTHENTICATION
# ========================================
JWT_SECRET=your_local_jwt_secret_minimum_32_characters_long_for_development
JWT_EXPIRES_IN=7d

# ========================================
# SECURITY
# ========================================
COOKIE_SECRET=your_cookie_secret_minimum_32_characters_long
CSRF_SECRET=your_csrf_secret_minimum_32_characters_long

# ========================================
# LOGGING
# ========================================
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
"@ | Out-File -FilePath $envFilePath -Encoding utf8
        
        Write-Status ".env file created successfully" -Status "SUCCESS" -Color "Green"
    } else {
        Write-Status ".env file already exists" -Status "INFO" -Color "Cyan"
    }
    
    # Stop and remove any existing containers
    Write-Status "Stopping and removing any existing containers..." -Status "INFO" -Color "Cyan"
    docker-compose -f docker-compose.saas.yml down -v --remove-orphans
    
    # Start PostgreSQL and Redis
    Write-Status "Starting PostgreSQL and Redis..." -Status "INFO" -Color "Cyan"
    docker-compose -f docker-compose.saas.yml up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    $postgresReady = Wait-ForService -ServiceName "PostgreSQL" -Url "http://localhost:5432"
    if (-not $postgresReady) {
        Write-Status "Failed to start PostgreSQL. Check the logs with: docker-compose -f docker-compose.saas.yml logs postgres" -Status "ERROR" -Color "Red"
        exit 1
    }
    
    # Install dependencies and build the application
    Write-Status "Installing dependencies and building the application..." -Status "INFO" -Color "Cyan"
    npm ci
    npm run build
    
    # Start all services
    Write-Status "Starting all services..." -Status "INFO" -Color "Cyan"
    docker-compose -f docker-compose.saas.yml up -d --build
    
    # Wait for the application to be ready
    $appReady = Wait-ForService -ServiceName "AccuBooks" -Url "http://localhost:3000/health"
    if (-not $appReady) {
        Write-Status "Failed to start AccuBooks. Check the logs with: docker-compose -f docker-compose.saas.yml logs app" -Status "ERROR" -Color "Red"
        exit 1
    }
    
    # Success message
    Write-Status "" -Status "" -Color "White"
    Write-Status "🎉 AccuBooks has been successfully set up!" -Status "SUCCESS" -Color "Green"
    Write-Status "" -Status "" -Color "White"
    Write-Status "🌐 Application URL: http://localhost:3000" -Status "INFO" -Color "Cyan"
    Write-Status "📚 API Documentation: http://localhost:3001" -Status "INFO" -Color "Cyan"
    Write-Status "📊 Status Page: http://localhost:3002" -Status "INFO" -Color "Cyan"
    Write-Status "" -Status "" -Color "White"
    Write-Status "To view logs, run: docker-compose -f docker-compose.saas.yml logs -f" -Status "INFO" -Color "Yellow"
    Write-Status "To stop the application, run: docker-compose -f docker-compose.saas.yml down" -Status "INFO" -Color "Yellow"
    Write-Status "" -Status "" -Color "White"
    
} catch {
    Write-Status "An error occurred: $_" -Status "ERROR" -Color "Red"
    exit 1
}
