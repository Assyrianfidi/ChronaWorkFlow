# Simple health monitoring script for AccuBooks
Write-Host "=== AccuBooks System Health Check ===" -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Check Docker containers
Write-Host "🐳 Docker Container Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "accubooks"
Write-Host ""

# Check backend health
Write-Host "🔧 Backend Health Check:" -ForegroundColor Cyan
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend: HTTP $($backendResponse.StatusCode) - Healthy" -ForegroundColor Green
        $healthData = $backendResponse.Content | ConvertFrom-Json
        Write-Host "Status: $($healthData.status)" -ForegroundColor Yellow
        Write-Host "Environment: $($healthData.environment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend: Connection failed - Unhealthy" -ForegroundColor Red
}
Write-Host ""

# Check frontend health
Write-Host "🌐 Frontend Health Check:" -ForegroundColor Cyan
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: HTTP $($frontendResponse.StatusCode) - Healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: Connection failed - Unhealthy" -ForegroundColor Red
}
Write-Host ""

# Check database health
Write-Host "🗄️ Database Health Check:" -ForegroundColor Cyan
try {
    $dbStatus = docker exec accubooks-postgres pg_isready -U postgres 2>$null
    if ($dbStatus -match "accepting connections") {
        Write-Host "✅ PostgreSQL: Ready" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL: Not ready" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ PostgreSQL: Connection failed" -ForegroundColor Red
}
Write-Host ""

# Check Redis health
Write-Host "📦 Redis Health Check:" -ForegroundColor Cyan
try {
    $redisStatus = docker exec accubooks-redis redis-cli ping 2>$null
    if ($redisStatus -eq "PONG") {
        Write-Host "✅ Redis: PONG - Healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis: No response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis: Connection failed" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Health Check Complete ===" -ForegroundColor Green
