@echo off
echo Starting AccuBooks services...

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Load environment variables
if exist .env (
    for /f "tokens=*" %%i in (.env) do (
        for /f "tokens=1* delims==" %%a in ("%%i") do (
            if not "%%b"=="" (
                set "%%a=%%b"
            )
        )
    )
) else (
    echo ❌ Error: .env file not found
    exit /b 1
)

REM Function to wait for a container to be healthy
:wait_for_container
set container_name=%~1
set max_attempts=30
set attempt=0

echo ⏳ Waiting for %container_name% to be healthy...

:check_health
set /a attempt+=1

REM Check container status
for /f "tokens=*" %%i in ('docker inspect -f "{{.State.Health.Status}}" %container_name% 2^>nul') do set "status=%%i"

if "%status%"=="healthy" (
    echo ✅ %container_name% is healthy
    goto :eof
)

if %attempt% geq %max_attempts% (
    echo ❌ Timed out waiting for %container_name% to be healthy
    exit /b 1
)

echo ⏳ Waiting for %container_name% to be healthy... (attempt %attempt%/%max_attempts%)
timeout /t 5 /nobreak >nul
goto check_health

REM Main script execution
echo 🛑 Stopping any running containers...
docker-compose -f docker-compose.saas.yml down -v

echo 🐘 Starting PostgreSQL and Redis...
docker-compose -f docker-compose.saas.yml up -d postgres redis

REM Wait for PostgreSQL to be ready
call :wait_for_container accubooks-postgres-1
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to start PostgreSQL
    exit /b 1
)

echo 🔄 Initializing database...
node scripts\init-db.js
if %ERRORLEVEL% neq 0 (
    echo ❌ Database initialization failed
    exit /b 1
)

echo 🚀 Starting all services...
docker-compose -f docker-compose.saas.yml up -d

REM Wait for app to be ready
call :wait_for_container accubooks-app-1
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to start application
    echo Check the logs with: docker-compose -f docker-compose.saas.yml logs
    exit /b 1
)

echo ✅ All services started successfully!
echo.
echo 🌐 Application URL: http://localhost:3000
echo 📚 API Documentation: http://localhost:3001
echo 📊 Status Page: http://localhost:3002
echo.
echo To view logs, run: docker-compose -f docker-compose.saas.yml logs -f
