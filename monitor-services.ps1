# =============================================
# ACCUBOOKS ENTERPRISE MONITORING SYSTEM
# =============================================
# Continuous Health Monitoring & Auto-Repair
# =============================================

param(
    [switch]$Continuous,
    [switch]$Once,
    [int]$Interval = 60,
    [switch]$AutoRestart
)

Write-Host "🔍 AccuBooks Enterprise Monitoring System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

class MonitoringManager {
    [string]$ProjectRoot
    [hashtable]$Services
    [hashtable]$HealthHistory
    [int]$CheckCount

    MonitoringManager([string]$projectRoot) {
        $this.ProjectRoot = $projectRoot
        $this.CheckCount = 0
        $this.HealthHistory = @{}
        $this.InitializeServices()
    }

    [void]InitializeServices() {
        $this.Services = @{
            "main_app" = @{
                name = "Main Application"
                url = "http://localhost:3000"
                port = 3000
                health_endpoint = "http://localhost:3000/api/v1/health"
                status = "unknown"
                last_check = $null
                response_time = 0
                restart_command = "docker compose -f docker-compose.saas.yml restart app"
            }
            "docs" = @{
                name = "Documentation Portal"
                url = "http://localhost:3001"
                port = 3001
                health_endpoint = "http://localhost:3001"
                status = "unknown"
                last_check = $null
                response_time = 0
                restart_command = "docker compose -f docker-compose.saas.yml restart docs"
            }
            "status_page" = @{
                name = "Status Page"
                url = "http://localhost:3002"
                port = 3002
                health_endpoint = "http://localhost:3002"
                status = "unknown"
                last_check = $null
                response_time = 0
                restart_command = "docker compose -f docker-compose.saas.yml restart status"
            }
            "grafana" = @{
                name = "Grafana Monitoring"
                url = "http://localhost:3003"
                port = 3003
                health_endpoint = "http://localhost:3003"
                status = "unknown"
                last_check = $null
                response_time = 0
                restart_command = "docker compose -f docker-compose.saas.yml restart grafana"
            }
            "prometheus" = @{
                name = "Prometheus Metrics"
                url = "http://localhost:9090"
                port = 9090
                health_endpoint = "http://localhost:9090"
                status = "unknown"
                last_check = $null
                response_time = 0
                restart_command = "docker compose -f docker-compose.saas.yml restart prometheus"
            }
        }
    }

    [void]CheckServiceHealth([string]$serviceId) {
        $service = $this.Services[$serviceId]
        $startTime = Get-Date

        try {
            $response = Invoke-WebRequest -Uri $service.health_endpoint -Method Head -TimeoutSec 5 -ErrorAction Stop
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds

            if ($response.StatusCode -eq 200) {
                $newStatus = "online"
                $statusColor = "Green"
                $icon = "✅"
            } else {
                $newStatus = "degraded"
                $statusColor = "Yellow"
                $icon = "⚠️"
            }

            $service.response_time = $responseTime
            $service.last_check = Get-Date

            if ($service.status -ne $newStatus) {
                $service.status = $newStatus
                Write-Host "   $icon $($service.name): $newStatus ($responseTime ms)" -ForegroundColor $statusColor
                $this.LogHealthChange($serviceId, $newStatus, $responseTime)
            } else {
                Write-Host "   $icon $($service.name): $newStatus ($responseTime ms)" -ForegroundColor $statusColor
            }

        } catch {
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds

            $newStatus = "offline"
            $service.status = $newStatus
            $service.response_time = $responseTime
            $service.last_check = Get-Date

            Write-Host "   ❌ $($service.name): offline ($responseTime ms)" -ForegroundColor Red
            $this.LogHealthChange($serviceId, $newStatus, $responseTime)

            # Auto-restart if enabled
            if ($AutoRestart) {
                $this.RestartService($serviceId)
            }
        }
    }

    [void]RestartService([string]$serviceId) {
        $service = $this.Services[$serviceId]

        Write-Host "   🔄 Restarting $($service.name)..." -ForegroundColor Yellow

        try {
            Invoke-Expression $service.restart_command 2>&1 | Out-Null
            Start-Sleep -Seconds 5

            # Check if restart worked
            $response = Invoke-WebRequest -Uri $service.health_endpoint -Method Head -TimeoutSec 3 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ $($service.name) restarted successfully" -ForegroundColor Green
                $service.status = "online"
                $this.LogHealthChange($serviceId, "online", 0)
            } else {
                Write-Host "   ❌ $($service.name) restart failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ $($service.name) restart failed: $_" -ForegroundColor Red
        }
    }

    [void]LogHealthChange([string]$serviceId, [string]$status, [double]$responseTime) {
        $service = $this.Services[$serviceId]
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

        $entry = "[$timestamp] $($service.name) - Status: $status, Response: $($responseTime)ms"

        # Log to diary
        Add-Content -Path "project-diary.md" -Value $entry

        # Update history
        if (-not $this.HealthHistory.ContainsKey($serviceId)) {
            $this.HealthHistory[$serviceId] = New-Object System.Collections.ArrayList
        }

        $this.HealthHistory[$serviceId].Add(@{
            timestamp = $timestamp
            status = $status
            response_time = $responseTime
        }) | Out-Null

        # Keep only last 20 entries per service
        if ($this.HealthHistory[$serviceId].Count -gt 20) {
            $this.HealthHistory[$serviceId].RemoveAt(0)
        }
    }

    [void]DisplayHealthReport() {
        $this.CheckCount++
        $onlineServices = ($this.Services.Values | Where-Object { $_.status -eq "online" }).Count
        $totalServices = $this.Services.Count
        $healthPercentage = [math]::Round(($onlineServices / $totalServices) * 100, 1)

        Write-Host "`n📊 HEALTH REPORT - Check #$($this.CheckCount)" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Overall Health: $healthPercentage% ($onlineServices/$totalServices services)" -ForegroundColor $(if ($healthPercentage -eq 100) { "Green" } elseif ($healthPercentage -ge 80) { "Yellow" } else { "Red" })
        Write-Host "Check Time: $(Get-Date -Format "HH:mm:ss")" -ForegroundColor Gray

        Write-Host "`n🏥 SERVICE STATUS:" -ForegroundColor Yellow

        # Check all services
        foreach ($service in $this.Services.GetEnumerator()) {
            $this.CheckServiceHealth($service.Key)
        }

        # Summary statistics
        Write-Host "`n📈 PERFORMANCE METRICS:" -ForegroundColor Yellow

        $avgResponseTimes = @()
        foreach ($service in $this.Services.Values) {
            if ($service.response_time -gt 0) {
                $avgResponseTimes += $service.response_time
            }
        }

        if ($avgResponseTimes.Count -gt 0) {
            $avgResponse = [math]::Round(($avgResponseTimes | Measure-Object -Average).Average, 0)
            Write-Host "   Average Response Time: $($avgResponse)ms" -ForegroundColor White
        }

        $uptimePercentage = if ($this.CheckCount -gt 1) {
            $totalChecks = $this.CheckCount * $totalServices
            $successfulChecks = ($this.Services.Values | Where-Object { $_.status -eq "online" }).Count
            [math]::Round(($successfulChecks / $totalServices) * 100, 1)
        } else { 100 }

        Write-Host "   System Uptime: $($uptimePercentage)%" -ForegroundColor $(if ($uptimePercentage -eq 100) { "Green" } else { "Yellow" })

        # Recommendations
        $offlineServices = $this.Services.Values | Where-Object { $_.status -eq "offline" }
        if ($offlineServices.Count -gt 0) {
            Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Cyan
            Write-Host "   • Check Docker logs: docker compose logs -f" -ForegroundColor Yellow
            Write-Host "   • Verify port availability on localhost" -ForegroundColor Yellow
            Write-Host "   • Restart Docker services if issues persist" -ForegroundColor Yellow
        } else {
            Write-Host "`n✅ All services healthy - system operating optimally!" -ForegroundColor Green
        }
    }

    [void]StartContinuousMonitoring([int]$intervalSeconds) {
        Write-Host "`n🔄 STARTING CONTINUOUS MONITORING..." -ForegroundColor Magenta
        Write-Host "====================================" -ForegroundColor Magenta
        Write-Host "Monitoring interval: $intervalSeconds seconds" -ForegroundColor Cyan
        Write-Host "Auto-restart: $(if ($AutoRestart) { 'ENABLED' } else { 'DISABLED' })" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray

        try {
            while ($true) {
                $this.DisplayHealthReport()

                if (-not $Continuous) { break }
                Write-Host "`n⏳ Next check in $intervalSeconds seconds..." -ForegroundColor Gray
                Start-Sleep -Seconds $intervalSeconds
            }
        } catch {
            Write-Host "`n⚡ Monitoring stopped by user" -ForegroundColor Yellow
        }
    }
}

# Initialize monitoring
$monitor = [MonitoringManager]::new($PSScriptRoot)

# Single check mode
if ($Once) {
    $monitor.DisplayHealthReport()
}

# Continuous monitoring mode
if ($Continuous) {
    $monitor.StartContinuousMonitoring($Interval)
}

# Default single check
if (-not $Once -and -not $Continuous) {
    $monitor.DisplayHealthReport()
}

Write-Host "`n✅ Monitoring complete!" -ForegroundColor Green
