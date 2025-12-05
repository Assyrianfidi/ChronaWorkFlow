Write-Host "Initializing AccuBooks Enterprise Cascade Setup..."

# STEP 1: Set up Environment Variables
$PostgresUser = "postgres"
$PostgresPassword = "Fkhouch8"
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresDB = "AccuBooks"

# Create or overwrite .env in the backend directory
$envFilePath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
# Use braces for host/port to avoid ambiguous variable parsing
$databaseUrl = "postgresql://$PostgresUser:$PostgresPassword@${PostgresHost}:${PostgresPort}/${PostgresDB}"
$envContent = @()
$envContent += "DATABASE_URL=`"$databaseUrl`""
$envContent += "NODE_ENV=development"
$envContent += "PORT=3000"
$envContent -join "`n" | Out-File -Encoding utf8 -FilePath $envFilePath

Write-Host ".env file written to $envFilePath"

# STEP 2: Test database connection (prisma db pull)
Write-Host "Testing database connection with 'npx prisma db pull'..."
try {
    Push-Location -Path $PSScriptRoot
    npx prisma db pull
    Write-Host "Connection successful."
    Pop-Location
} catch {
    Write-Host "Database connection failed. Message: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

# STEP 3: Run Prisma migrations
Write-Host "Running Prisma migrations (create-only initial migration then apply reconciliation migration)..."
try {
    Push-Location -Path $PSScriptRoot
    npx prisma migrate dev --name init --create-only
} catch {
    Write-Host "init migration create-only skipped or already exists: $($_.Exception.Message)"
}

try {
    npx prisma migrate dev --name add_reconciliation_report
    npx prisma generate
    Write-Host "Prisma migrations and client generation completed."
    Pop-Location
} catch {
    Write-Host "Prisma migrate failed: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "All migration steps finished."

Write-Host "Next: Start the backend and frontend manually (recommended to watch logs):"
Write-Host "  - To start backend: Open a terminal, cd backend, then run: npm run start:dev"
Write-Host "  - To start frontend (client): Open a terminal, cd client, then run: npm install ; npm run dev"

Write-Host "If you want the script to auto-start backend/frontend, re-run with elevated permissions or let me add non-blocking start commands."

Write-Host "Initializing AccuBooks Enterprise Cascade Setup..."

# STEP 1: Set up Environment Variables
$PostgresUser = "postgres"
$PostgresPassword = "Fkhouch8"
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresDB = "AccuBooks"

# Create or overwrite .env in the backend directory
$envFilePath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
# Use braces for host/port to avoid ambiguous variable parsing
$databaseUrl = "postgresql://$PostgresUser:$PostgresPassword@${PostgresHost}:${PostgresPort}/${PostgresDB}"
$envContent = @()
$envContent += "DATABASE_URL=`"$databaseUrl`""
$envContent += "NODE_ENV=development"
$envContent += "PORT=3000"
$envContent -join "`n" | Out-File -Encoding utf8 -FilePath $envFilePath

Write-Host ".env file written to $envFilePath"

# STEP 2: Test database connection (prisma db pull)
Write-Host "Testing database connection with 'npx prisma db pull'..."
try {
    Push-Location -Path $PSScriptRoot
    npx prisma db pull
    Write-Host "Connection successful."
    Pop-Location
} catch {
    Write-Host "Database connection failed. Message: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

# STEP 3: Run Prisma migrations
Write-Host "Running Prisma migrations (create-only initial migration then apply reconciliation migration)..."
try {
    Push-Location -Path $PSScriptRoot
    npx prisma migrate dev --name init --create-only
} catch {
    Write-Host "init migration create-only skipped or already exists: $($_.Exception.Message)"
}

try {
    npx prisma migrate dev --name add_reconciliation_report
    npx prisma generate
    Write-Host "Prisma migrations and client generation completed."
    Pop-Location
} catch {
    Write-Host "Prisma migrate failed: $($_.Exception.Message)"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "All migration steps finished."

Write-Host "Next: Start the backend and frontend manually (recommended to watch logs):"
Write-Host "  - To start backend: Open a terminal, cd backend, then run: npm run start:dev"
Write-Host "  - To start frontend (client): Open a terminal, cd client, then run: npm install ; npm run dev"

Write-Host "If you want the script to auto-start backend/frontend, re-run with elevated permissions or let me add non-blocking start commands."

Write-Host "🔧 Initializing AccuBooks Enterprise Cascade Setup..."

# STEP 1️⃣: Set up Environment Variables
$PostgresUser = "postgres"
$PostgresPassword = "Fkhouch8"
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresDB = "AccuBooks"

# Create or overwrite .env in the backend directory
$envFilePath = "./.env"
@"
DATABASE_URL="postgresql://$PostgresUser:$PostgresPassword@$PostgresHost:$PostgresPort/$PostgresDB"
NODE_ENV=development
PORT=3000
"@ | Out-File -Encoding utf8 $envFilePath

Write-Host "✅ .env file created successfully at backend\.env"

# STEP 2️⃣: Test database connection (prisma db pull)
Write-Host "🔍 Testing database connection with 'npx prisma db pull'..."
try {
    npx prisma db pull
    Write-Host "✅ Connection successful!"
} catch {
    Write-Host "❌ Database connection failed. Check credentials or PostgreSQL service."
    Write-Host $_.Exception.Message
    exit 1
}

# STEP 3️⃣: Run Prisma migrations
nWrite-Host "⚙️ Running Prisma migrations..."
try {
    # Create initial migration if none exists (will prompt if destructive)
    npx prisma migrate dev --name init --create-only
} catch {
    Write-Host "⚠️ init migrate failed or already present: $($_.Exception.Message)"
}

try {
    npx prisma migrate dev --name add_reconciliation_report
    npx prisma generate
    Write-Host "✅ Prisma migrations and client generation completed successfully."
} catch {
    Write-Host "❌ Prisma migrate failed: $($_.Exception.Message)"
    exit 1
}

# STEP 4️⃣: Optionally open Prisma Studio for inspection (non-blocking)
Write-Host "🔎 Opening Prisma Studio (optional)..."
Start-Process -FilePath "npx" -ArgumentList "prisma studio" -NoNewWindow

# STEP 5️⃣: Start NestJS backend (non-blocking)
Write-Host "🚀 Starting AccuBooks Backend Server (npm run start:dev)..."
Start-Process powershell -ArgumentList "-NoProfile -Command cd '$PWD'; cd ..; cd backend; npm run start:dev" -NoNewWindow

# STEP 6️⃣: Launch Frontend (client) if present
$clientFolder = Join-Path -Path (Split-Path -Parent $PWD) -ChildPath "client"
if (Test-Path $clientFolder) {
    Write-Host "🖥️ Starting Frontend (client) on default Vite port..."
    Start-Process powershell -ArgumentList "-NoProfile -Command cd '$clientFolder'; npm install; npm run dev" -NoNewWindow
} else {
    Write-Host "ℹ️ Frontend folder 'client' not found. Skipping frontend start."
}

# STEP 7️⃣: Validate health check (attempt)
Start-Sleep -Seconds 5
Write-Host "🌐 Checking AccuBooks API health (http://localhost:3000/health)"
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($resp.StatusCode -eq 200) { Write-Host "✅ API is running properly." } else { Write-Host "⚠️ API health returned status $($resp.StatusCode)" }
} catch {
    Write-Host "⚠️ Could not reach API health endpoint: $($_.Exception.Message)"
}

Write-Host "🎯 AccuBooks Enterprise System initialization script finished. Check the terminal windows for backend/frontend logs."