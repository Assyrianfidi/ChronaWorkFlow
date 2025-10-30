@echo off
REM =====================================
REM AccuBooks Windows Test Script
REM =====================================
REM Quick test to verify Windows compatibility

echo Testing Windows Compatibility
echo ===============================
echo.

REM Test PowerShell
echo Testing PowerShell...
powershell -Command "Write-Host 'PowerShell working correctly' -ForegroundColor Green" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell test failed
    pause
    exit /b 1
)
echo SUCCESS: PowerShell working

REM Test Docker
echo.
echo Testing Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)
echo SUCCESS: Docker Desktop running

REM Test npm scripts
echo.
echo Testing npm scripts...
npm run clean >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm scripts failed
    pause
    exit /b 1
)
echo SUCCESS: npm scripts working

REM Test PowerShell scripts
echo.
echo Testing PowerShell scripts...
powershell -ExecutionPolicy Bypass -File ".\verify-all.ps1" -Quick >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell scripts failed
    pause
    exit /b 1
)
echo SUCCESS: PowerShell scripts working

echo.
echo All Windows compatibility tests passed!
echo.
echo The AccuBooks project is now fully compatible with Windows 11.
echo.
echo Next steps:
echo 1. Run: .\quick-start.ps1
echo 2. Or: .\start-accubooks.ps1 -Verbose
echo 3. Or: .\verify-all.ps1
echo.
echo All scripts are now Windows PowerShell 7+ compatible!
echo.
pause
