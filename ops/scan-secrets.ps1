# Secret scanning script for AccuBooks repository

# Create reports directory if it doesn't exist
$reportsDir = "phase_final_reports"
if (-not (Test-Path -Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

# Patterns to match common secrets and credentials
$patterns = @{
    "AWS_ACCESS_KEY_ID" = "(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"
    "AWS_SECRET_ACCESS_KEY" = "[\"\']?[a-zA-Z0-9/\\+]{40}[\"\']?"
    "Authorization" = "[bB]earer\s+[a-zA-Z0-9_\-\.=]+|Basic\s+[a-zA-Z0-9=]+\r?\n"
    "Password" = "[pP][aA][sS][sS][wW][oO][rR][dD]\s*[=:;]\s*[\"\']?[^\"\'\s]+[\"\']?"
    "Secret" = "[sS][eE][cC][rR][eE][tT]\s*[=:;]\s*[\"\']?[^\"\'\s]+[\"\']?"
    "API[_-]?[kK]ey" = "[a-zA-Z0-9_\-]{20,}"
    "Stripe" = "(sk|pk)_(test|live)_[0-9a-zA-Z]{24}"
    "Twilio" = "SK[0-9a-fA-F]{32}"
    "GitHub" = "[gG][iI][tT][hH][uU][bB].*[\'\"][0-9a-zA-Z]{35,40}[\'\"]"
    "Google" = "AIza[0-9A-Za-z\\-_]+"
    "Heroku" = "[hH][eE][rR][oO][kK][uU].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}"
}

# Files to exclude from scanning
$excludeDirs = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "phase_final_reports",
    ".backups",
    "logs"
)

# File extensions to scan
$includeExtensions = @(
    "*.js", "*.jsx", "*.ts", "*.tsx", "*.json", "*.yaml", "*.yml", 
    "*.env*", "*.config.js", "*.config.ts", "*.conf", "*.sh", "*.bat",
    "*.ps1", "*.md", "*.txt", "Dockerfile*"
)

# Output file for results
$outputFile = "$reportsDir/secret_scan_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$results = @()

Write-Host "🔍 Starting secret scan..." -ForegroundColor Cyan

# Get all files to scan
$files = Get-ChildItem -Path . -Recurse -Include $includeExtensions -Exclude $excludeDirs | 
         Where-Object { -not $_.FullName.Contains('node_modules') -and -not $_.FullName.Contains('\.git') }

$totalFiles = $files.Count
$currentFile = 0

foreach ($file in $files) {
    $currentFile++
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    
    Write-Progress -Activity "Scanning files for secrets" -Status "$currentFile of $totalFiles - $relativePath" -PercentComplete (($currentFile / $totalFiles) * 100)
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        
        foreach ($pattern in $patterns.GetEnumerator()) {
            $patternName = $pattern.Key
            $regex = $pattern.Value
            
            if ($content -match $regex) {
                $matches[0] | ForEach-Object {
                    $result = @{
                        file = $relativePath
                        pattern = $patternName
                        match = $_.Trim()
                        line = ($content -split "`n" | Select-String -Pattern [regex]::Escape($_) -SimpleMatch -Context 0,1 | Select-Object -First 1).ToString()
                    }
                    $results += $result
                }
            }
        }
    }
    catch {
        Write-Warning "Error processing file: $($file.FullName) - $_"
    }
}

# Save results to file
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath $outputFile -Encoding utf8

# Generate a summary
$summary = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    filesScanned = $totalFiles
    potentialSecretsFound = $results.Count
    reportFile = $outputFile
}

$summary | ConvertTo-Json | Out-File "$reportsDir/secret_scan_summary.json" -Encoding utf8

Write-Host "✅ Secret scan complete. Found $($results.Count) potential issues." -ForegroundColor Green
Write-Host "📄 Report saved to: $outputFile" -ForegroundColor Cyan

# Display summary
$summary | Format-List

# Return non-zero exit code if potential secrets found
if ($results.Count -gt 0) {
    exit 1
}

exit 0
