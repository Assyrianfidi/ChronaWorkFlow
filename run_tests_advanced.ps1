# run_tests_advanced.ps1
$ErrorActionPreference = "Stop"
$projectRoot = "C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks\client"
$logFile = "$projectRoot\cascade_test_log.txt"
$maxRetries = 5
$currentTry = 0
$allFixed = $false

# Initialize log file
function Initialize-Log {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $header = @"
========================================
AccuBooks Test Automation
Started: $timestamp
========================================
"@
    Set-Content -Path $logFile -Value $header -Force
}

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $logMessage
}

function Install-Dependencies {
    if (-not (Test-Path "$projectRoot\node_modules")) {
        Write-Log "Installing dependencies..."
        npm ci
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
    }
}

function Run-Tests {
    param([switch]$coverage = $false)
    $args = "run"
    if ($coverage) { $args += " --coverage" }
    
    $output = npx vitest $args 2>&1 | Out-String
    Write-Log "Test Output:`n$output"
    return $output
}

function Get-FailedTestFiles {
    param([string]$testOutput)
    $failedFiles = @()
    $testOutput -split "`n" | ForEach-Object {
        if ($_ -match 'FAIL\s+([^\s]+\.test\.[jt]sx?)') {
            $failedFiles += $matches[1]
        }
    }
    return $failedFiles | Select-Object -Unique
}

function Fix-TestFile {
    param([string]$filePath)
    $content = Get-Content $filePath -Raw
    
    # Common fixes
    $fixes = @{
        # Fix 1: Replace getBy with findBy for async elements
        'screen\.getBy(Text|LabelText|PlaceholderText|Role)\((.*?)\)' = 'await screen.findBy$1($2)'
        
        # Fix 2: Add missing Testing Library imports
        '(import.*?from ''@testing-library/react'';?)' = "`$1`nimport { screen, waitFor } from '@testing-library/react';"
        
        # Fix 3: Add vi.mock placeholders
        '(describe\()' = "// Mock any external dependencies here`n`$1"
    }
    
    foreach ($pattern in $fixes.Keys) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $fixes[$pattern]
            Write-Log "Applied fix in $filePath for pattern: $pattern"
        }
    }
    
    # Save changes
    Set-Content -Path $filePath -Value $content
}

# Main execution
try {
    Initialize-Log
    Set-Location $projectRoot
    Install-Dependencies

    do {
        $currentTry++
        Write-Log "Test Run Attempt #$currentTry"
        
        $testOutput = Run-Tests
        $failedFiles = Get-FailedTestFiles $testOutput
        
        if ($failedFiles.Count -eq 0) {
            Write-Log "All tests passed!"
            $allFixed = $true
            break
        }
        
        Write-Log "Found ${$failedFiles.Count} failed test files"
        
        foreach ($file in $failedFiles) {
            $fullPath = Join-Path $projectRoot $file
            if (Test-Path $fullPath) {
                Write-Log "Attempting to fix: $fullPath"
                Fix-TestFile $fullPath
            }
        }
        
        if ($currentTry -ge $maxRetries) {
            Write-Log "Maximum retry limit reached. Some tests may still be failing."
            break
        }
        
    } while ($failedFiles.Count -gt 0)
    
    # Final coverage report
    Write-Log "Generating coverage report..."
    $coverageOutput = Run-Tests -coverage $true
    Write-Log "Coverage Report:`n$coverageOutput"
    
    # Extract and log coverage summary
    if ($coverageOutput -match 'Coverage summary[^`n]*\n([^`$]+)') {
        Write-Log "Coverage Summary:`n$($matches[1])"
    }
    
    # Final status
    $status = if ($allFixed) { "SUCCESS" } else { "PARTIAL SUCCESS - Some tests may still be failing" }
    Write-Log "Test Automation $status after $currentTry attempt(s)"
}
catch {
    Write-Log "ERROR: $_"
    Write-Log $_.ScriptStackTrace
    exit 1
}