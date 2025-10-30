# Setup script for AccuBooks

# Stop on error
$ErrorActionPreference = "Stop"

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if Docker is installed and running
if (-not (Test-CommandExists "docker")) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "🚀 Starting Docker Desktop..." -ForegroundColor Cyan
    Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    # Wait for Docker to start
    $maxRetries = 30
    $retryCount = 0
    $dockerReady = $false
    
    while (-not $dockerReady -and $retryCount -lt $maxRetries) {
        try {
            $dockerInfo = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dockerReady = $true
                break
            }
        } catch {}
        
        $retryCount++
        Write-Host "⏳ Waiting for Docker to start ($retryCount/$maxRetries)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    if (-not $dockerReady) {
        Write-Host "❌ Failed to start Docker. Please start Docker Desktop manually and try again." -ForegroundColor Red
        exit 1
    }
}

# Check if Node.js is installed
if (-not (Test-CommandExists "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ npm is not installed. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm ci

# Build the application
Write-Host "🔨 Building the application..." -ForegroundColor Cyan
npm run build

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the build output for errors." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Test-CommandExists "docker-compose")) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Desktop which includes Docker Compose." -ForegroundColor Red
    exit 1
}

# Stop any running containers
Write-Host "🛑 Stopping any running containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml down -v

# Start the database and initialize it
Write-Host "🐘 Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml up -d postgres redis

# Wait for PostgreSQL to be ready
$maxRetries = 30
$retryCount = 0
$postgresReady = $false

while (-not $postgresReady -and $retryCount -lt $maxRetries) {
    try {
        $result = docker exec accubooks-postgres-1 pg_isready -U postgres -d AccuBooks 2>&1
        if ($LASTEXITCODE -eq 0) {
            $postgresReady = $true
            break
        }
    } catch {}
    
    $retryCount++
    Write-Host "⏳ Waiting for PostgreSQL to be ready ($retryCount/$maxRetries)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $postgresReady) {
    Write-Host "❌ PostgreSQL is not ready. Please check the logs with: docker-compose -f docker-compose.saas.yml logs postgres" -ForegroundColor Red
    exit 1
}

# Initialize the database
Write-Host "🔄 Initializing the database..." -ForegroundColor Cyan
node scripts/init-db.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database initialization failed. Please check the logs above for errors." -ForegroundColor Red
    exit 1
}

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Cyan
docker-compose -f docker-compose.saas.yml up -d

# Wait for the application to be ready
$maxRetries = 30
$retryCount = 0
$appReady = $false

while (-not $appReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            break
        }
    } catch {}
    
    $retryCount++
    Write-Host "⏳ Waiting for the application to start ($retryCount/$maxRetries)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $appReady) {
    Write-Host "❌ Application failed to start. Please check the logs with: docker-compose -f docker-compose.saas.yml logs app" -ForegroundColor Red
    exit 1
}

# Print success message
Write-Host ""
Write-Host "🎉 AccuBooks has been successfully set up!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Status Page: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs, run: docker-compose -f docker-compose.saas.yml logs -f" -ForegroundColor Yellow
Write-Host "To stop the application, run: docker-compose -f docker-compose.saas.yml down" -ForegroundColor Yellow
Write-Host ""
