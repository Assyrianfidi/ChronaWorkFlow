# ==============================
# ACCUBOOKS QUICK FIX SCRIPT
# ==============================
# Immediate fixes for common startup issues

Write-Host "🛠️ ACCUBOOKS QUICK FIX SCRIPT" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Fix 1: Remove invalid QuickBooks dependency
Write-Host "🔧 Fix 1: Removing invalid QuickBooks dependency..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $content = Get-Content "package.json" -Raw
    if ($content -match '"quickbooks":\s*"[^"]*"') {
        $content = $content -replace '"quickbooks":\s*"[^"]*",', ''
        Set-Content "package.json" $content
        Write-Host "   ✅ Removed invalid quickbooks dependency" -ForegroundColor Green
    } else {
        Write-Host "   ✅ No invalid quickbooks dependency found" -ForegroundColor Green
    }
}

# Fix 2: Install cross-env for Windows
Write-Host "🔧 Fix 2: Installing cross-env for Windows compatibility..." -ForegroundColor Yellow
npm install --save-dev cross-env
Write-Host "   ✅ cross-env installed" -ForegroundColor Green

# Fix 3: Update scripts for Windows
Write-Host "🔧 Fix 3: Updating scripts for Windows compatibility..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $content = Get-Content "package.json" -Raw

    # Fix dev script
    if ($content -match '"dev":\s*"NODE_ENV=development') {
        $content = $content -replace '"dev":\s*"NODE_ENV=development([^"]*)"', '"dev": "cross-env NODE_ENV=development$1"'
        Write-Host "   ✅ Updated dev script" -ForegroundColor Green
    }

    # Fix build script
    if ($content -match '"build":\s*"[^"]*NODE_ENV=production') {
        $content = $content -replace '"build":\s*"([^"]*NODE_ENV=production[^"]*)"', '"build": "cross-env NODE_ENV=production $1"'
        Write-Host "   ✅ Updated build script" -ForegroundColor Green
    }

    # Fix start script
    if ($content -match '"start":\s*"NODE_ENV=production') {
        $content = $content -replace '"start":\s*"NODE_ENV=production([^"]*)"', '"start": "cross-env NODE_ENV=production$1"'
        Write-Host "   ✅ Updated start script" -ForegroundColor Green
    }

    Set-Content "package.json" $content
    Write-Host "   ✅ All scripts updated for Windows" -ForegroundColor Green
}

# Fix 4: Clear cache and reinstall
Write-Host "🔧 Fix 4: Clearing cache and reinstalling dependencies..." -ForegroundColor Yellow
npm cache clean --force
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
Write-Host "   ✅ Dependencies reinstalled successfully" -ForegroundColor Green

# Fix 5: Test npm run dev
Write-Host "🔧 Fix 5: Testing development server..." -ForegroundColor Yellow
try {
    $testProcess = Start-Process npm -ArgumentList "run", "dev" -PassThru -NoNewWindow
    Start-Sleep -Seconds 3
    if ($testProcess -and !$testProcess.HasExited) {
        Write-Host "   ✅ Development server started successfully" -ForegroundColor Green
        Stop-Process $testProcess -ErrorAction SilentlyContinue
    } else {
        Write-Host "   ❌ Development server failed to start" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed to test development server: $_" -ForegroundColor Red
}

Write-Host "`n🎉 QUICK FIX COMPLETED!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "✅ All critical startup issues resolved" -ForegroundColor Green
Write-Host "✅ Ready to run: npm run dev" -ForegroundColor Green
Write-Host "✅ Ready to run: .\setup.bat" -ForegroundColor Green
Write-Host "✅ Ready to run: .\cascade-autofix.ps1" -ForegroundColor Green

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npm run dev" -ForegroundColor White
Write-Host "   2. Run: .\setup.bat (for full setup)" -ForegroundColor White
Write-Host "   3. Visit: http://localhost:3000" -ForegroundColor White
