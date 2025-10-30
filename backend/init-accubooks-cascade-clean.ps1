Write-Host "Initializing AccuBooks Enterprise Cascade Setup (clean script)..."

# STEP 1: Environment variables (interactive)
$PostgresUser = "postgres"
$securePwd = Read-Host "Enter your PostgreSQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresDB = "AccuBooks"

n# Write .env in the backend folder
$envFilePath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
$databaseUrl = "postgresql://$PostgresUser:$plainPassword@${PostgresHost}:${PostgresPort}/${PostgresDB}"
$env = @()
$env += "DATABASE_URL=`"$databaseUrl`""
$env += "NODE_ENV=development"
$env += "PORT=3000"
$env -join "`n" | Out-File -Encoding utf8 -FilePath $envFilePath
Write-Host ".env created at $envFilePath"

# STEP 2: Test DB connection
Push-Location -Path $PSScriptRoot
try {
  Write-Host "Running: npx prisma db pull"
  npx prisma db pull
  Write-Host "Prisma db pull succeeded"
} catch {
  Write-Host "Prisma db pull failed: $($_.Exception.Message)"
  Pop-Location -ErrorAction SilentlyContinue
  exit 1
}

n# STEP 3: Run migrations and generate client
try {
  Write-Host "Creating initial migration (create-only)"
  npx prisma migrate dev --name init --create-only
} catch {
  Write-Host "init create-only may be skipped: $($_.Exception.Message)"
}

ntry {
  Write-Host "Applying reconciliation migration"
  npx prisma migrate dev --name add_reconciliation_report
  Write-Host "Generating Prisma client"
  npx prisma generate
  Write-Host "Migrations and client generation complete"
} catch {
  Write-Host "Migration failed: $($_.Exception.Message)"
  Pop-Location -ErrorAction SilentlyContinue
  exit 1
}
Pop-Location

Write-Host "Finished. To start services manually:"
Write-Host "  - Backend: cd backend ; npm run start:dev"
Write-Host "  - Frontend: cd client ; npm install ; npm run dev"
