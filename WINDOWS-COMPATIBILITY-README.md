# 🎯 AccuBooks - Windows 11 Compatibility Guide

This guide explains the Windows 11 compatibility updates made to the AccuBooks project, including all script conversions, Docker configurations, and usage instructions.

## 📋 Windows Compatibility Overview

The AccuBooks project has been fully converted from Linux/Bash to Windows 11 and PowerShell 7+ compatibility. All scripts, Docker configurations, and build processes now work seamlessly on Windows 11 with Docker Desktop.

### ✅ What's Been Updated

1. **All Bash Scripts → PowerShell 7+**
   - `start.sh` → `start-accubooks.ps1` (enhanced with comprehensive features)
   - All Linux commands converted to PowerShell equivalents
   - Proper error handling and Windows path support

2. **Docker Configuration Updates**
   - `docker-compose.saas.yml` updated for Windows Docker Desktop
   - Health checks converted to use `wget` instead of `curl`
   - Backup service updated for Windows compatibility
   - Volume mounts optimized for Windows paths

3. **TypeScript & Node.js Execution**
   - Package.json scripts updated for Windows
   - tsx runtime properly configured for Windows
   - Cross-platform build and execution support

4. **Verification Scripts**
   - `verify-all.ps1` - Master verification script
   - `quick-start.ps1` - Easy Windows startup script
   - All HTTP endpoint, database, and Redis checks

## 🚀 Quick Start (Windows)

### Prerequisites
- **Windows 11** with PowerShell 7+
- **Docker Desktop** for Windows (with WSL2 backend recommended)
- **Node.js 18+** and npm
- **Git** for Windows

### Installation Steps

1. **Clone the repository:**
   ```powershell
   git clone <repository-url>
   cd AccuBooks
   ```

2. **Start Docker Desktop** (if not already running)

3. **Run the quick start script:**
   ```powershell
   .\quick-start.ps1
   ```

4. **Or use the comprehensive startup:**
   ```powershell
   .\start-accubooks.ps1 -Verbose
   ```

### Access URLs
- **Main Application**: http://localhost:3000
- **API Documentation**: http://localhost:3001
- **Status Dashboard**: http://localhost:3002
- **Grafana Monitoring**: http://localhost:3003
- **Prometheus Metrics**: http://localhost:9090

## 📜 Available Scripts

### PowerShell Scripts (Windows Native)

| Script | Description | Usage |
|--------|-------------|-------|
| `quick-start.ps1` | Quick startup with basic verification | `.\quick-start.ps1` |
| `start-accubooks.ps1` | Full startup with health checks | `.\start-accubooks.ps1 -Verbose` |
| `verify-all.ps1` | Comprehensive system verification | `.\verify-all.ps1` |
| `repair-build-accubooks.ps1` | Repair and rebuild system | `.\repair-build-accubooks.ps1 -ForceRebuild` |
| `diagnose.bat` | Windows batch diagnostic tool | `diagnose.bat` |

### NPM Scripts (Package.json)

| Command | Description | Windows Usage |
|---------|-------------|---------------|
| `npm run dev` | Development server | `npm run dev` |
| `npm run build` | Build frontend | `npm run build` |
| `npm run start` | Start production server | `npm run start` |
| `npm run verify` | Run verification script | `npm run verify` |

## 🔧 Docker Commands (Windows)

### Basic Docker Operations
```powershell
# Start all services
docker-compose -f docker-compose.saas.yml up -d

# Stop all services
docker-compose -f docker-compose.saas.yml down

# View logs
docker-compose -f docker-compose.saas.yml logs -f

# Rebuild all services
docker-compose -f docker-compose.saas.yml up -d --build

# Clean restart
docker-compose -f docker-compose.saas.yml down -v
docker-compose -f docker-compose.saas.yml up -d
```

### Health Checks
```powershell
# Check container status
docker-compose -f docker-compose.saas.yml ps

# Check specific container logs
docker-compose -f docker-compose.saas.yml logs app

# Check container health
docker inspect --format='{{.State.Health.Status}}' accubooks-app-1
```

## 🗄️ Database and Services

### PostgreSQL (Port 5432)
-- **Connection**: `postgresql://postgres:<REDACTED_DB_PASSWORD>@localhost:5432/AccuBooks`
-- **Admin**: Username: `postgres`, Password: `<REDACTED_DB_PASSWORD>`
- **Tables**: 9 tables (companies, users, accounts, transactions, etc.)

### Redis (Port 6379)
- **Connection**: `redis://localhost:6379`
- **Purpose**: Caching and session storage

### Worker Processes
- **Background jobs**: Async processing
- **Health check**: Responds to Node.js execution tests

## 🔍 Troubleshooting (Windows)

### Common Issues and Solutions

#### Docker Desktop Not Starting
```powershell
# Check Docker Desktop status
Get-Process docker*

# Restart Docker Desktop service
Restart-Service docker

# Or restart via Services.msc
services.msc  # Find "Docker Desktop Service"
```

#### Port Conflicts
```powershell
# Check what's using ports
netstat -ano | findstr :3000

# Find and kill process using port
netstat -ano | findstr :3000 | ForEach-Object { $_.Split()[-1] } | Get-Unique | ForEach-Object { taskkill /PID $_ /F }
```

#### Container Restart Loops
```powershell
# Check container logs
docker-compose -f docker-compose.saas.yml logs app

# Check Docker events
docker events --filter "container=accubooks-app-1" --since "1m"

# Restart specific container
docker-compose -f docker-compose.saas.yml restart app
```

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set to allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📁 File Structure (Windows Compatible)

```
AccuBooks/
├── 📄 package.json          # NPM scripts (Windows compatible)
├── 📄 docker-compose.saas.yml # Docker config (Windows paths)
├── 📄 Dockerfile.saas       # Main app Dockerfile (tsx support)
├── 📄 Dockerfile.worker     # Worker Dockerfile
├── 📄 nginx.dev.conf        # Nginx config (Windows paths)
├── 📄 .env                  # Environment variables
├── 📄 verify-all.ps1        # Master verification script
├── 📄 quick-start.ps1       # Quick start script
├── 📄 start-accubooks.ps1   # Comprehensive start script
├── 📄 repair-build-accubooks.ps1 # Repair script
├── 📄 diagnose.bat          # Windows batch diagnostic
├── 📁 dist/                 # Build output
├── 📁 src/                  # Frontend source (React/TypeScript)
├── 📁 server/               # Backend source (Node.js/TypeScript)
└── 📁 docker-compose files/ # Additional Docker configs
```

## 🛠️ Development (Windows)

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://postgres:<REDACTED_DB_PASSWORD>@postgres:5432/AccuBooks
REDIS_URL=redis://redis:6379
PORT=3000
NODE_ENV=production
JWT_SECRET=your_local_jwt_secret_minimum_32_characters_long_for_development
```

### TypeScript Development
- **Frontend**: Vite + React + TypeScript
- **Backend**: tsx + Node.js + Express
- **Build**: TypeScript compilation for workers

### Docker Development
- **Context**: Windows file system mounted to Linux containers
- **Volumes**: Windows paths properly mapped
- **Networks**: Windows Docker networks

## 🔄 Migration from Linux

If you're migrating from a Linux environment:

1. **Backup your data** (database, uploads, logs)
2. **Copy environment files** (ensure Windows line endings)
3. **Run the Windows setup scripts**
4. **Verify all services** with `.\verify-all.ps1`

### Key Differences
- **Line Endings**: Windows uses CRLF, Linux uses LF
- **Path Separators**: Windows uses `\`, Linux uses `/`
- **Shell Commands**: PowerShell instead of Bash
- **Docker Desktop**: Windows-specific Docker Desktop vs Linux Docker

## 📞 Support

### Getting Help
1. **Run verification**: `.\verify-all.ps1`
2. **Check logs**: `docker-compose -f docker-compose.saas.yml logs`
3. **View status**: `docker-compose -f docker-compose.saas.yml ps`
4. **Run diagnostics**: `diagnose.bat`

### Common Solutions
- **Restart Docker Desktop** and run `.\quick-start.ps1`
- **Check Windows Firewall** allows Docker ports
- **Verify PowerShell 7+** is installed and configured
- **Ensure WSL2** is enabled for Docker Desktop

## 🎯 Final Notes

The AccuBooks project is now **100% Windows 11 compatible** with:

- ✅ All scripts converted to PowerShell 7+
- ✅ Docker Desktop for Windows optimized
- ✅ Windows path and volume support
- ✅ Comprehensive verification and troubleshooting
- ✅ Production-ready deployment

**Ready for Windows 11 development and production deployment!** 🚀
