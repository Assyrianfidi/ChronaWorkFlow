# AccuBooks Quick Validation Script
# Tests all services and endpoints after deployment

Write-Host "🧪 AccuBooks Validation Test Suite" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$testResults = @()

# Test 1: Docker Services
Write-Host "`n🐳 Testing Docker Services..." -ForegroundColor Yellow
try {
    $services = docker compose -f docker-compose.saas.yml ps --format "table {{.Name}}\t{{.Status}}"
    if ($LASTEXITCODE -eq 0) {
        $testResults += @{test="Docker Services"; status="PASS"; message="All services are running"}
        Write-Host "✅ Docker services are operational" -ForegroundColor Green
    } else {
        $testResults += @{test="Docker Services"; status="FAIL"; message="Some services failed to start"}
        Write-Host "❌ Docker services check failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Docker Services"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Error checking Docker services: $_" -ForegroundColor Red
}

# Test 2: Main App Health
Write-Host "`n🏥 Testing Main App Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/health" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="Main App Health"; status="PASS"; message="Health endpoint responding"}
        Write-Host "✅ Main app health check passed" -ForegroundColor Green
    } else {
        $testResults += @{test="Main App Health"; status="FAIL"; message="Health endpoint returned $($response.StatusCode)"}
        Write-Host "❌ Main app health check failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Main App Health"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Main app health check error: $_" -ForegroundColor Red
}

# Test 3: API Endpoint
Write-Host "`n🔌 Testing API Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/api/v1/health" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="API Endpoint"; status="PASS"; message="API responding correctly"}
        Write-Host "✅ API endpoint test passed" -ForegroundColor Green
    } else {
        $testResults += @{test="API Endpoint"; status="FAIL"; message="API returned $($response.StatusCode)"}
        Write-Host "❌ API endpoint test failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="API Endpoint"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ API endpoint error: $_" -ForegroundColor Red
}

# Test 4: Documentation Portal
Write-Host "`n📖 Testing Documentation Portal..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="Documentation"; status="PASS"; message="Docs portal responding"}
        Write-Host "✅ Documentation portal test passed" -ForegroundColor Green
    } else {
        $testResults += @{test="Documentation"; status="FAIL"; message="Docs returned $($response.StatusCode)"}
        Write-Host "❌ Documentation portal test failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Documentation"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Documentation portal error: $_" -ForegroundColor Red
}

# Test 5: Status Page
Write-Host "`n📊 Testing Status Page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="Status Page"; status="PASS"; message="Status page responding"}
        Write-Host "✅ Status page test passed" -ForegroundColor Green
    } else {
        $testResults += @{test="Status Page"; status="FAIL"; message="Status page returned $($response.StatusCode)"}
        Write-Host "❌ Status page test failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Status Page"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Status page error: $_" -ForegroundColor Red
}

# Test 6: Monitoring Services
Write-Host "`n📈 Testing Monitoring Services..." -ForegroundColor Yellow

# Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="Grafana"; status="PASS"; message="Grafana dashboard responding"}
        Write-Host "✅ Grafana monitoring test passed" -ForegroundColor Green
    } else {
        $testResults += @{test="Grafana"; status="FAIL"; message="Grafana returned $($response.StatusCode)"}
        Write-Host "❌ Grafana test failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Grafana"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Grafana error: $_" -ForegroundColor Red
}

# Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $testResults += @{test="Prometheus"; status="PASS"; message="Prometheus metrics responding"}
        Write-Host "✅ Prometheus monitoring test passed" -ForegroundColor Green
    } else {
        $testResults += @{test="Prometheus"; status="FAIL"; message="Prometheus returned $($response.StatusCode)"}
        Write-Host "❌ Prometheus test failed" -ForegroundColor Red
    }
} catch {
    $testResults += @{test="Prometheus"; status="FAIL"; message=$_.Exception.Message}
    Write-Host "❌ Prometheus error: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n📋 VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$passedTests = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$totalTests = $testResults.Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "Tests Passed: $passedTests/$totalTests ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

foreach ($result in $testResults) {
    $icon = if ($result.status -eq "PASS") { "✅" } else { "❌" }
    $color = if ($result.status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$icon $($result.test): $($result.message)" -ForegroundColor $color
}

if ($successRate -eq 100) {
    Write-Host "`n🎉 ALL TESTS PASSED! AccuBooks is fully operational!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n⚠️ MOST TESTS PASSED! Check failed services in the list above." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ SOME TESTS FAILED! Review the errors above and check Docker logs." -ForegroundColor Red
    Write-Host "   Command: docker compose -f docker-compose.saas.yml logs -f" -ForegroundColor Yellow
}

Write-Host "`n🌐 ACTIVE SERVICES:" -ForegroundColor Cyan
Write-Host "   • Main App:    http://localhost:3000" -ForegroundColor White
Write-Host "   • API:         http://localhost:3000/api/v1/health" -ForegroundColor White
Write-Host "   • Docs:        http://localhost:3001" -ForegroundColor White
Write-Host "   • Status:      http://localhost:3002" -ForegroundColor White
Write-Host "   • Grafana:     http://localhost:3003" -ForegroundColor White
Write-Host "   • Prometheus:  http://localhost:9090" -ForegroundColor White

Write-Host "`n✅ Validation complete! Check project-diary.md for detailed logs." -ForegroundColor Green
