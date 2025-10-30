# AccuBooks Project Management System

## Overview
This is a comprehensive project management and automation system for the AccuBooks SaaS platform. It provides automated tracking, error fixing, and deployment management.

## Quick Start

### 1. Run the Management Script
```powershell
# Basic run with status check
.\manage-project.ps1

# Verbose mode with detailed logging
.\manage-project.ps1 -Verbose

# Auto-fix mode (attempts to resolve issues automatically)
.\manage-project.ps1 -AutoFix

# Reset all tasks to pending
.\manage-project.ps1 -Reset
```

### 2. Check Project Status
```powershell
# View current project status
.\manage-project.ps1

# Check Docker services
docker compose -f docker-compose.saas.yml ps

# View logs
docker compose -f docker-compose.saas.yml logs -f
```

### 3. Manual Commands
```powershell
# Rebuild everything from scratch
docker compose -f docker-compose.saas.yml down -v
docker compose -f docker-compose.saas.yml build --no-cache
docker compose -f docker-compose.saas.yml up -d

# Test endpoints
curl http://localhost:80/health
curl http://localhost:3001
curl http://localhost:3002
```

## Features

### ✅ Automated Task Management
- **7 Main Tasks** with 15+ subtasks
- **Real-time Status Tracking** with visual indicators
- **Automatic Progress Updates** as tasks complete

### ✅ Error Detection & Fixing
- **Dependency Analysis**: Detects missing or incompatible packages
- **File Verification**: Ensures all required files exist
- **Configuration Validation**: Checks Docker, Next.js, and environment settings
- **Auto-Repair**: Attempts to fix common issues automatically

### ✅ Comprehensive Logging
- **Project Diary**: Automatic logging of all actions and errors
- **Timestamp Tracking**: Every action recorded with precise timing
- **Error Documentation**: Detailed error messages and solutions

### ✅ Docker Management
- **Container Building**: Automated build processes for all services
- **Service Orchestration**: Coordinated startup of dependent services
- **Health Monitoring**: Continuous checking of service health

## Project Structure

```
AccuBooks/
├── manage-project.ps1      # Main management script
├── project-diary.md        # Progress tracking diary
├── repair.ps1             # Emergency repair script
├── docker-compose.saas.yml # Docker configuration
├── server/                # Main application
├── docs/                  # Documentation (Next.js)
├── status/                # Status page
├── nginx/                 # Reverse proxy
└── monitoring/            # Grafana/Prometheus configs
```

## Service URLs

Once deployed, these services will be available:

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:3000 | Core SaaS application |
| **Admin** | http://localhost:3000/admin | Administrative interface |
| **API** | http://localhost:3000/api/v1 | REST API endpoints |
| **Docs** | http://localhost:3001 | Documentation portal |
| **Status** | http://localhost:3002 | Service monitoring |
| **Grafana** | http://localhost:3003 | Monitoring dashboards |
| **Prometheus** | http://localhost:9090 | Metrics collection |

## Troubleshooting

### Common Issues

1. **PowerShell Errors**: Use proper array syntax, avoid Invoke-Expression with complex strings
2. **Next.js Export**: Ensure `next.config.js` uses `output: 'export'` format
3. **npm Dependencies**: Check for version conflicts, use `npm audit fix`
4. **Docker Build Failures**: Verify all required files exist, check logs

### Emergency Commands

```powershell
# Stop everything
docker compose -f docker-compose.saas.yml down -v

# Clean rebuild
docker system prune -f
docker compose -f docker-compose.saas.yml build --no-cache
docker compose -f docker-compose.saas.yml up -d

# Check for issues
docker compose -f docker-compose.saas.yml logs
```

## Best Practices

1. **Always run management script first**: `.\manage-project.ps1 -Verbose`
2. **Check project diary**: Review `project-diary.md` for detailed logs
3. **Use auto-fix mode**: `-AutoFix` attempts to resolve issues automatically
4. **Regular status checks**: Run the script daily to track progress

## Support

The system provides comprehensive logging and error reporting. Check:
- `project-diary.md` for detailed progress logs
- Docker logs: `docker compose -f docker-compose.saas.yml logs -f`
- Script output for real-time status updates

---
**Status**: 🟢 Active | **Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss") | **Progress**: Automated tracking enabled
