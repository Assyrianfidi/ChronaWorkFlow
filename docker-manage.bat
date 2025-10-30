@echo off
REM =====================================
REM AccuBooks Docker Management Batch
REM =====================================
REM Windows batch file for Docker operations

echo AccuBooks Docker Management
echo ===========================
echo.

if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="status" goto :status
if "%1"=="clean" goto :clean

REM Show help
echo Usage: %0 {start^|stop^|restart^|logs^|status^|clean}
echo.
echo Commands:
echo   start   - Start all services
echo   stop    - Stop all services
echo   restart - Restart all services
echo   logs    - View logs for all services
echo   status  - Show status of all containers
echo   clean   - Stop and remove all containers and volumes
echo.
pause
exit /b 0

:start
echo 🚀 Starting all AccuBooks services...
docker-compose -f docker-compose.saas.yml up -d
if errorlevel 1 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)
echo ✅ Services started successfully!
goto :show_status

:stop
echo 🛑 Stopping all AccuBooks services...
docker-compose -f docker-compose.saas.yml down
echo ✅ Services stopped
goto :end

:restart
echo 🔄 Restarting all AccuBooks services...
docker-compose -f docker-compose.saas.yml restart
if errorlevel 1 (
    echo ❌ Failed to restart services
    pause
    exit /b 1
)
echo ✅ Services restarted successfully!
goto :show_status

:logs
echo 📝 Showing logs for all services...
docker-compose -f docker-compose.saas.yml logs -f
goto :end

:status
:show_status
echo 📊 Current container status:
docker-compose -f docker-compose.saas.yml ps
echo.
echo 🌐 Access URLs:
echo   Main Application: http://localhost:3000
echo   Documentation: http://localhost:3001
echo   Status Dashboard: http://localhost:3002
echo   Grafana Monitoring: http://localhost:3003
goto :end

:clean
echo 🧹 Cleaning up all containers and volumes...
docker-compose -f docker-compose.saas.yml down -v --remove-orphans
docker system prune -f
echo ✅ Cleanup completed
goto :end

:end
echo.
echo Press any key to exit...
pause >nul
