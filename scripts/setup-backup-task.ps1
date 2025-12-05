# Create backup directory if it doesn't exist
$backupDir = "C:\Backups\AccuBooks"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force
}

# Create a scheduled task to run the backup daily at 2 AM
$action = New-ScheduledTaskAction -Execute "PowerShell" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\backup-db.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the scheduled task
Register-ScheduledTask -TaskName "AccuBooks Database Backup" -Action $action -Trigger $trigger -Principal $principal -Force

Write-Host "✅ Backup task scheduled to run daily at 2 AM" -ForegroundColor Green
Write-Host "Backup directory: $backupDir"
