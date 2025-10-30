@echo off
REM =====================================
REM AccuBooks Windows Verification Batch
REM =====================================
REM Quick verification script for Windows

echo AccuBooks Windows Verification
echo ===============================
echo.

REM Check if PowerShell is available
powershell -Command "exit 0" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell not available.
    echo Please install PowerShell 7+.
    pause
    exit /b 1
)

echo SUCCESS: PowerShell available
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running.
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo SUCCESS: Docker Desktop is running
echo.

REM Run PowerShell verification
echo Running comprehensive verification...
powershell -ExecutionPolicy Bypass -File ".\verify-all.ps1"

if errorlevel 1 (
    echo.
    echo WARNING: Some services may have issues.
    echo Check the logs above for details.
) else (
    echo.
    echo SUCCESS: All systems verified successfully!
)

echo.
echo Press any key to exit...
pause >nul
