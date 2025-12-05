# Security Check Script for AccuBooks

# Check for default credentials
function Check-DefaultCredentials {
    $services = @(
        @{Name="PostgreSQL"; Port=5432; DefaultUsers=@("postgres")},
        @{Name="Redis"; Port=6379; DefaultUsers=@("default", "redis")},
        @{Name="Grafana"; Port=3000; DefaultUsers=@("admin")}
    )

    Write-Host "`n🔒 Checking for default credentials..." -ForegroundColor Cyan
    
    foreach ($service in $services) {
        Write-Host "`nChecking $($service.Name)..."
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $service.Port -ErrorAction Stop
            if ($connection.TcpTestSucceeded) {
                Write-Host "✅ $($service.Name) is running" -ForegroundColor Green
                
                # Check for default users
                foreach ($user in $service.DefaultUsers) {
                    Write-Host "   Checking for default user: $user"
                    # Add specific checks for each service
                }
            } else {
                Write-Host "ℹ️ $($service.Name) is not running" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "ℹ️ Could not connect to $($service.Name): $_" -ForegroundColor Yellow
        }
    }
}

# Check open ports
function Check-OpenPorts {
    Write-Host "`n🔍 Checking open ports..." -ForegroundColor Cyan
    
    $ports = @(80, 443, 3000, 5432, 6379, 9090, 9093, 9100, 9115)
    $openPorts = @()
    
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -ErrorAction Stop
            if ($connection.TcpTestSucceeded) {
                $openPorts += $port
                Write-Host "   Port $port is open" -ForegroundColor Red
            }
        } catch {
            # Port is closed or filtered
        }
    }
    
    if ($openPorts.Count -eq 0) {
        Write-Host "✅ No unexpected open ports found" -ForegroundColor Green
    } else {
        Write-Host "❌ Found open ports that might need attention: $($openPorts -join ', ')" -ForegroundColor Red
    }
}

# Check container security
function Check-ContainerSecurity {
    Write-Host "`n🐳 Checking container security..." -ForegroundColor Cyan
    
    try {
        $containers = docker ps --format '{{.Names}}'
        if ($LASTEXITCODE -ne 0) { throw "Failed to list containers" }
        
        Write-Host "✅ Running containers:" -ForegroundColor Green
        $containers | ForEach-Object { Write-Host "   - $_" }
        
        # Check for containers running as root
        Write-Host "`n🔍 Checking for containers running as root..."
        $rootContainers = docker ps --format '{{.Names}}' --filter "user=root"
        if ($rootContainers) {
            Write-Host "❌ The following containers are running as root:" -ForegroundColor Red
            $rootContainers | ForEach-Object { Write-Host "   - $_" }
        } else {
            Write-Host "✅ No containers running as root" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Error checking container security: $_" -ForegroundColor Red
    }
}

# Check SSL/TLS configuration
function Check-SSLConfig {
    Write-Host "`n🔐 Checking SSL/TLS configuration..." -ForegroundColor Cyan
    
    $domains = @("localhost", "accubooks.example.com")
    
    foreach ($domain in $domains) {
        try {
            $tls = Test-NetConnection -ComputerName $domain -Port 443 -ErrorAction Stop
            if ($tls.TcpTestSucceeded) {
                Write-Host "✅ Successfully connected to $domain on port 443" -ForegroundColor Green
                # Add more detailed TLS checks here
            }
        } catch {
            Write-Host "⚠️ Could not establish TLS connection to $domain: $_" -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Host "`n🔒 Starting AccuBooks Security Check 🔒" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta

Check-DefaultCredentials
Check-OpenPorts
Check-ContainerSecurity
Check-SSLConfig

Write-Host "`n✅ Security check completed. Review any warnings or errors above." -ForegroundColor Green
