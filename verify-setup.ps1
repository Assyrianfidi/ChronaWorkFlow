# AccuBooks Setup Verification Script
# Run this script to verify your setup is complete

Write-Host "AccuBooks Setup Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Test 1: AWS CLI Installation
Write-Host "1. Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   [OK] AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] AWS CLI not found. Install from: https://aws.amazon.com/cli/" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: AWS Credentials
Write-Host ""
Write-Host "2. Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "   [OK] AWS credentials configured" -ForegroundColor Green
    Write-Host "   Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "   User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Terraform Installation
Write-Host ""
Write-Host "3. Checking Terraform..." -ForegroundColor Yellow
try {
    $tfVersion = terraform version 2>&1
    Write-Host "   [OK] Terraform installed: $($tfVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Terraform not found. Install from: https://www.terraform.io/downloads" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Terraform Initialization
Write-Host ""
Write-Host "4. Checking Terraform initialization..." -ForegroundColor Yellow
$tfDir = "infrastructure\terraform"
if (Test-Path "$tfDir\.terraform") {
    Write-Host "   [OK] Terraform initialized (.terraform directory exists)" -ForegroundColor Green
    
    # Check if .terraform is in Git
    $gitStatus = git status --porcelain "$tfDir\.terraform" 2>&1
    if ($gitStatus) {
        Write-Host "   [WARN] .terraform directory appears in git status" -ForegroundColor Yellow
        Write-Host "   Make sure .terraform/ is in .gitignore" -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] .terraform directory properly ignored by Git" -ForegroundColor Green
    }
} else {
    Write-Host "   [FAIL] Terraform not initialized. Run: cd $tfDir; terraform init" -ForegroundColor Red
    $allPassed = $false
}

# Test 5: Node.js Installation
Write-Host ""
Write-Host "5. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Host "   [OK] Node.js installed: $nodeVersion" -ForegroundColor Green
    Write-Host "   [OK] npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Node.js not found. Install from: https://nodejs.org/" -ForegroundColor Red
    $allPassed = $false
}

# Test 6: Backend Dependencies
Write-Host ""
Write-Host "6. Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   [OK] Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Backend dependencies not installed. Run: cd backend; npm install" -ForegroundColor Yellow
}

# Test 7: Backend Environment Variables
Write-Host ""
Write-Host "7. Checking backend environment..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   [OK] Backend .env file exists" -ForegroundColor Green
    
    # Check if .env is in Git
    $gitStatus = git status --porcelain "backend\.env" 2>&1
    if ($gitStatus) {
        Write-Host "   [WARN] .env file appears in git status" -ForegroundColor Yellow
        Write-Host "   Make sure .env is in .gitignore" -ForegroundColor Yellow
    } else {
        Write-Host "   [OK] .env file properly ignored by Git" -ForegroundColor Green
    }
} else {
    Write-Host "   [WARN] Backend .env file not found. Create from .env.example" -ForegroundColor Yellow
}

# Test 8: Git Repository Status
Write-Host ""
Write-Host "8. Checking Git repository..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($gitStatus -match "verify-setup.ps1") {
    Write-Host "   [WARN] New setup files need to be committed" -ForegroundColor Yellow
} elseif ($gitStatus) {
    Write-Host "   [WARN] Working tree has uncommitted changes" -ForegroundColor Yellow
} else {
    Write-Host "   [OK] Working tree clean" -ForegroundColor Green
}

# Test 9: Large Files Check
Write-Host ""
Write-Host "9. Checking for large files in Git..." -ForegroundColor Yellow
$largeFiles = git ls-files | Where-Object { 
    $file = $_
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $size -gt 50MB
    }
}
if ($largeFiles) {
    Write-Host "   [WARN] Large files found in repository:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { Write-Host "      - $_" -ForegroundColor Gray }
} else {
    Write-Host "   [OK] No large files in repository" -ForegroundColor Green
}

# Test 10: .gitignore Coverage
Write-Host ""
Write-Host "10. Checking .gitignore coverage..." -ForegroundColor Yellow
$requiredIgnores = @(
    ".env",
    ".terraform/",
    "*.tfstate",
    "*.tfvars",
    "node_modules/"
)
$gitignoreContent = Get-Content ".gitignore" -Raw
$missingIgnores = @()
foreach ($pattern in $requiredIgnores) {
    if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
        $missingIgnores += $pattern
    }
}
if ($missingIgnores.Count -eq 0) {
    Write-Host "   [OK] All critical patterns in .gitignore" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Missing .gitignore patterns:" -ForegroundColor Yellow
    $missingIgnores | ForEach-Object { Write-Host "      - $_" -ForegroundColor Gray }
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "[SUCCESS] All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. cd backend; npm run dev" -ForegroundColor Gray
    Write-Host "  2. Test: curl http://localhost:5000/api/health" -ForegroundColor Gray
    Write-Host "  3. Review: SETUP_COMPLETE_GUIDE.md" -ForegroundColor Gray
} else {
    Write-Host "[FAILED] Some checks failed. Review errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "See SETUP_COMPLETE_GUIDE.md for detailed instructions" -ForegroundColor Yellow
}
Write-Host ""
