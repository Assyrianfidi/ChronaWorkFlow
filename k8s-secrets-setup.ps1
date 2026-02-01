#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates Kubernetes secrets from AWS Secrets Manager
.DESCRIPTION
    Fetches secrets from AWS Secrets Manager and creates Kubernetes secrets
#>

param(
    [string]$AWSRegion = "ca-central-1",
    [string]$Namespace = "accubooks-prod"
)

$ErrorActionPreference = "Stop"

Write-Host "Fetching secrets from AWS Secrets Manager..." -ForegroundColor Yellow

# Fetch database secret
$dbSecret = aws secretsmanager get-secret-value --secret-id "accubooks/prod/v2/database" --region $AWSRegion --query SecretString --output text | ConvertFrom-Json
$databaseUrl = $dbSecret.DATABASE_URL

# Fetch Redis secret
$redisSecret = aws secretsmanager get-secret-value --secret-id "accubooks/prod/v2/redis" --region $AWSRegion --query SecretString --output text | ConvertFrom-Json
$redisUrl = $redisSecret.REDIS_URL
$redisPassword = $redisSecret.REDIS_PASSWORD

# Fetch auth secret
$authSecret = aws secretsmanager get-secret-value --secret-id "accubooks/prod/v2/auth" --region $AWSRegion --query SecretString --output text | ConvertFrom-Json
$jwtSecret = $authSecret.JWT_SECRET
$jwtRefreshSecret = $authSecret.JWT_REFRESH_SECRET
$sessionSecret = $authSecret.SESSION_SECRET
$encryptionKey = $authSecret.ENCRYPTION_KEY

# Fetch third-party secret
$thirdPartySecret = aws secretsmanager get-secret-value --secret-id "accubooks/prod/v2/third-party" --region $AWSRegion --query SecretString --output text | ConvertFrom-Json

Write-Host "✓ Secrets fetched from AWS" -ForegroundColor Green

# Create Kubernetes secret
Write-Host "Creating Kubernetes secret..." -ForegroundColor Yellow

@"
apiVersion: v1
kind: Secret
metadata:
  name: accubooks-secrets
  namespace: $Namespace
type: Opaque
stringData:
  database-url: "$databaseUrl"
  redis-url: "$redisUrl"
  redis-password: "$redisPassword"
  jwt-secret: "$jwtSecret"
  jwt-refresh-secret: "$jwtRefreshSecret"
  session-secret: "$sessionSecret"
  encryption-key: "$encryptionKey"
  stripe-secret-key: "$($thirdPartySecret.STRIPE_SECRET_KEY)"
  stripe-publishable-key: "$($thirdPartySecret.STRIPE_PUBLISHABLE_KEY)"
  google-client-id: "$($thirdPartySecret.GOOGLE_CLIENT_ID)"
  google-client-secret: "$($thirdPartySecret.GOOGLE_CLIENT_SECRET)"
  smtp-host: "$($thirdPartySecret.SMTP_HOST)"
  smtp-port: "$($thirdPartySecret.SMTP_PORT)"
  smtp-user: "$($thirdPartySecret.SMTP_USER)"
  smtp-pass: "$($thirdPartySecret.SMTP_PASS)"
"@ | kubectl apply -f -

Write-Host "✓ Kubernetes secrets created" -ForegroundColor Green

# Create ServiceAccount with IAM role annotation
@"
apiVersion: v1
kind: ServiceAccount
metadata:
  name: accubooks-backend-sa
  namespace: $Namespace
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::971551576768:role/accubooks-production-backend-sa-role
"@ | kubectl apply -f -

Write-Host "✓ ServiceAccount created with IAM role" -ForegroundColor Green
