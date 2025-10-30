# AccuBooks Enterprise Cascade Setup
# PowerShell initialization script for database setup and migrations

Write-Host "Initializing AccuBooks Enterprise..."

# STEP 1: Get PostgreSQL credentials
$PostgresUser = "postgres"
$securePwd = Read-Host "Enter your PostgreSQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Database connection details
$dbConfig = @{
  Host = "localhost"
  Port = "5432"
  Database = "AccuBooks"
}

# Construct database URL (properly escaped for PowerShell)
$envFilePath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
$databaseUrl = [string]::Format(
  "postgresql://{0}:{1}@{2}:{3}/{4}",
  $PostgresUser,
  $plainPassword,
  $dbConfig.Host,
  $dbConfig.Port,
  $dbConfig.Database
)

# Create .env file with connection details
@"
DATABASE_URL="$databaseUrl"
NODE_ENV=development
PORT=3000
"@ | Out-File -Encoding utf8 -FilePath $envFilePath

Write-Host "Created .env file at: $envFilePath"

# STEP 2: Verify database connection
Write-Host "Testing database connection..."
Push-Location -Path $PSScriptRoot
try {
    & npx prisma db pull
    Write-Host "Database connection successful"
} catch {
    Write-Host "Database connection failed: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

# STEP 3: Run Prisma migrations
Write-Host "Running database migrations..."
try {
    # Initial migration (create-only, may already exist)
    & npx prisma migrate dev --name init --create-only
    Write-Host "Initial migration created"
} catch {
    Write-Host "Note: Initial migration may already exist"
}

# Apply reconciliation report migration and generate client
try {
    & npx prisma migrate dev --name add_reconciliation_report
    & npx prisma generate
    Write-Host "Reconciliation migration applied and client generated"
} catch {
    Write-Host "Migration failed: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}
Pop-Location

Write-Host "`nSetup completed successfully!"
Write-Host "`nTo start services:"
Write-Host "1. Backend:  cd backend ; npm run start:dev"
Write-Host "2. Frontend: cd client ; npm install ; npm run dev"