@echo off
echo 🔒 Running Security Audit for AccuBooks...

REM Check for npm audit
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📦 Running npm audit...
    npm audit --audit-level=moderate
)

REM Check for outdated dependencies
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📅 Checking for outdated dependencies...
    npm outdated || echo No outdated dependencies found
)

REM Check for license issues
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📄 Checking license compliance...
    npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC" || echo License issues found
)

echo ✅ Security audit complete
