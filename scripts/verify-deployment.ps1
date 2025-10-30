# verify-deployment.ps1
# Windows PowerShell Production Deployment Verification Script for AccuBooks
# Run this script after deployment to verify everything is working correctly
# Compatible with Windows 11 and PowerShell 7+

param(
    [switch]$Verbose,
    [string]$ComposeFile = "docker-compose.prod.yml",
    [string]$EnvFile = ".env.production"
)

# Configuration
$logFile = "deployment-verification.log"
$startTime = Get-Date

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$warningColor = "Yellow"
$infoColor = "Cyan"

$verificationItems = 0
$passedItems = 0

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

function Write-Status {
    param([string]$Message, [bool]$Success = $true)

    $script:verificationItems++

    if ($Success) {
        $script:passedItems++
        Write-Host "SUCCESS: $Message" -ForegroundColor $successColor
    } else {
        Write-Host "ERROR: $Message" -ForegroundColor $errorColor
    }
}

function Write-Info {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor $infoColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor $warningColor
}

function Test-Command {
    param([string]$Command)

    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Check-Dependencies {
    Write-Info "Checking dependencies..."

    if (Test-Command "curl") {
        Write-Status "curl is installed"
    } else {
        Write-Status "curl is installed" $false
    }

    if (Test-Command "docker") {
        Write-Status "Docker is installed"
    } else {
        Write-Status "Docker is installed" $false
    }

    if (Test-Command "docker-compose") {
        Write-Status "Docker Compose is installed"
    } else {
        Write-Status "Docker Compose is installed" $false
    }
}

function Check-Environment {
    Write-Info "Checking environment configuration..."

    if (Test-Path $EnvFile) {
        Write-Status "Production environment file exists"

        # Check for required variables
        $envContent = Get-Content $EnvFile -Raw
        if ($envContent -match "DATABASE_URL=") {
            Write-Status "Database URL is configured"
        } else {
            Write-Status "Database URL is configured" $false
        }

        if ($envContent -match "JWT_SECRET=") {
            Write-Status "JWT secret is configured"
        } else {
            Write-Status "JWT secret is configured" $false
        }

        if ($envContent -match "DOMAIN=") {
            Write-Status "Domain is configured"
        } else {
            Write-Status "Domain is configured" $false
        }
    } else {
        Write-Status "Production environment file exists" $false
    }
}

function Check-DockerServices {
    Write-Info "Checking Docker services..."

    try {
        $services = docker-compose -f $ComposeFile ps --format "table {{.Service}}\t{{.Status}}"
        if ($services -and $services -match "Up") {
            Write-Status "Docker services are running"

            # Check specific services
            $serviceList = @("postgres", "redis", "app", "nginx")
            foreach ($service in $serviceList) {
                try {
                    $serviceStatus = docker-compose -f $ComposeFile ps $service --format "{{.Status}}"
                    if ($serviceStatus -match "Up") {
                        Write-Status "Service $service is running"
                    } else {
                        Write-Status "Service $service is running" $false
                    }
                } catch {
                    Write-Status "Service $service is running" $false
                }
            }
        } else {
            Write-Status "Docker services are running" $false
        }
    } catch {
        Write-Status "Docker services are running" $false
    }
}

function Check-ApplicationHealth {
    Write-Info "Checking application health..."

    try {
        # Get domain from environment file
        if (Test-Path $EnvFile) {
            $domain = (Get-Content $EnvFile | Select-String "DOMAIN=(.+)").Matches[0].Groups[1].Value
        } else {
            $domain = "localhost"
        }

        # Check main health endpoint
        try {
            $response = Invoke-WebRequest -Uri "https://$domain/health" -UseBasicParsing -TimeoutSec 10
            Write-Status "Application health endpoint is accessible"
        } catch {
            Write-Status "Application health endpoint is accessible" $false
        }

        # Check API endpoint
        try {
            $response = Invoke-WebRequest -Uri "https://$domain/api/companies" -UseBasicParsing -TimeoutSec 10 -Headers @{"Authorization"="Bearer test"}
            Write-Status "API endpoint is accessible"
        } catch {
            Write-Status "API endpoint is accessible" $false
        }
    } catch {
        Write-Status "Application health check failed" $false
    }
}

function Check-SSLCertificate {
    Write-Info "Checking SSL certificate..."

    try {
        if (Test-Path $EnvFile) {
            $domain = (Get-Content $EnvFile | Select-String "DOMAIN=(.+)").Matches[0].Groups[1].Value
        } else {
            $domain = "localhost"
        }

        try {
            $response = Invoke-WebRequest -Uri "https://$domain" -UseBasicParsing -Method Head
            Write-Status "SSL certificate is valid"
        } catch {
            Write-Status "SSL certificate is valid" $false
        }
    } catch {
        Write-Status "SSL certificate check failed" $false
    }
}

function Check-Database {
    Write-Info "Checking database connectivity..."

    try {
        $dbReady = docker-compose -f $ComposeFile exec postgres pg_isready -U accubooks_prod 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Database is accessible"

            # Check if database has tables
            try {
                $tableCount = docker-compose -f $ComposeFile exec postgres psql -U accubooks_prod -d accubooks_prod -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
                $count = [int]($tableCount | Select-String "\d+" | ForEach-Object { $_.Matches[0].Value })
                if ($count -gt 0) {
                    Write-Status "Database contains tables"
                } else {
                    Write-Status "Database contains tables" $false
                }
            } catch {
                Write-Status "Database contains tables" $false
            }
        } else {
            Write-Status "Database is accessible" $false
        }
    } catch {
        Write-Status "Database connectivity check failed" $false
    }
}

function Check-Redis {
    Write-Info "Checking Redis connectivity..."

    try {
        $redisPing = docker-compose -f $ComposeFile exec redis redis-cli ping 2>$null
        if ($redisPing -eq "PONG") {
            Write-Status "Redis is accessible"
        } else {
            Write-Status "Redis is accessible" $false
        }
    } catch {
        Write-Status "Redis connectivity check failed" $false
    }
}

function Check-Monitoring {
    Write-Info "Checking monitoring services..."

    # Check Prometheus
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 10
        Write-Status "Prometheus is running"
    } catch {
        Write-Status "Prometheus is running" $false
    }

    # Check Grafana
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        Write-Status "Grafana is running"
    } catch {
        Write-Status "Grafana is running" $false
    }
}

function Check-BackgroundJobs {
    Write-Info "Checking background jobs..."

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/jobs/queues" -UseBasicParsing -TimeoutSec 10
        Write-Status "Background job API is accessible"
    } catch {
        Write-Status "Background job API is accessible" $false
    }
}

function Check-Integrations {
    Write-Info "Checking third-party integrations..."

    # Check Stripe (basic connectivity test)
    try {
        $response = Invoke-WebRequest -Uri "https://api.stripe.com/v1/charges" -UseBasicParsing -TimeoutSec 10 -Headers @{"Authorization"="Bearer sk_test_..."}
        Write-Status "Stripe API is accessible"
    } catch {
        Write-Warning "Stripe API connectivity test failed (may need valid API key)"
    }

    # Check Plaid (basic connectivity test)
    try {
        $response = Invoke-WebRequest -Uri "https://sandbox.plaid.com/" -UseBasicParsing -TimeoutSec 10
        Write-Status "Plaid API is accessible"
    } catch {
        Write-Warning "Plaid API connectivity test failed"
    }
}

function Check-Security {
    Write-Info "Checking security configurations..."

    try {
        if (Test-Path $EnvFile) {
            $domain = (Get-Content $EnvFile | Select-String "DOMAIN=(.+)").Matches[0].Groups[1].Value
        } else {
            $domain = "localhost"
        }

        try {
            $response = Invoke-WebRequest -Uri "https://$domain" -UseBasicParsing -Method Head
            $headers = $response.Headers

            if ($headers["Strict-Transport-Security"]) {
                Write-Status "HSTS security headers are present"
            } else {
                Write-Status "HSTS security headers are present" $false
            }

            if ($headers["X-Frame-Options"]) {
                Write-Status "X-Frame-Options header is present"
            } else {
                Write-Status "X-Frame-Options header is present" $false
            }
        } catch {
            Write-Status "Security headers check failed" $false
        }
    } catch {
        Write-Status "Security configuration check failed" $false
    }
}

# Main verification flow
Write-Host "AccuBooks Production Deployment Verification" -ForegroundColor $infoColor
Write-Host "============================================" -ForegroundColor $infoColor

# Initialize log
Clear-Content $logFile -ErrorAction SilentlyContinue
Write-Log "AccuBooks production deployment verification started" "START"

Check-Dependencies
Write-Host ""

Check-Environment
Write-Host ""

Check-DockerServices
Write-Host ""

Check-ApplicationHealth
Write-Host ""

Check-SSLCertificate
Write-Host ""

Check-Database
Write-Host ""

Check-Redis
Write-Host ""

Check-Monitoring
Write-Host ""

Check-BackgroundJobs
Write-Host ""

Check-Integrations
Write-Host ""

Check-Security
Write-Host ""

# Final summary
Write-Host "VERIFICATION SUMMARY:" -ForegroundColor $infoColor
Write-Host "=====================" -ForegroundColor $infoColor
Write-Host "Total checks: $verificationItems"
Write-Host "Passed: $passedItems"
Write-Host "Failed: $($verificationItems - $passedItems)"

if ($passedItems -eq $verificationItems) {
    Write-Host "SUCCESS: All verification checks passed!" -ForegroundColor $successColor
    Write-Host ""
    Write-Host "AccuBooks is ready for production use!" -ForegroundColor $successColor
    Write-Host ""

    if (Test-Path $EnvFile) {
        $domain = (Get-Content $EnvFile | Select-String "DOMAIN=(.+)").Matches[0].Groups[1].Value
    } else {
        $domain = "your-domain.com"
    }

    Write-Host "Access URLs:" -ForegroundColor $infoColor
    Write-Host "  Application: https://$domain"
    Write-Host "  Monitoring: http://localhost:3000"
    Write-Host "  API Documentation: https://$domain/api/docs"

    Write-Log "All verification checks passed successfully" "SUCCESS"
    exit 0
} else {
    Write-Host "ERROR: Some verification checks failed." -ForegroundColor $errorColor
    Write-Host ""
    Write-Host "Please address the failed checks before going live." -ForegroundColor $errorColor
    Write-Host ""
    Write-Host "Run this script again after fixing the issues." -ForegroundColor $warningColor

    Write-Log "Some verification checks failed" "ERROR"
    exit 1
}
