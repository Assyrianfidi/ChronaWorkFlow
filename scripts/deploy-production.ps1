# AccuBooks Production Deployment Script
# AWS Account: 971551576768
# Execute from project root: .\scripts\deploy-production.ps1

param(
    [switch]$SkipInfrastructure,
    [switch]$SkipSecrets,
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

# Configuration
$AWS_ACCOUNT_ID = "971551576768"
$AWS_REGION = "us-east-1"
$PROJECT_ROOT = "C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks"
$TERRAFORM_DIR = Join-Path $PROJECT_ROOT "infrastructure\terraform"
$NAMESPACE = "accubooks-prod"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AccuBooks Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "Region: $AWS_REGION" -ForegroundColor Yellow
Write-Host "Domain: https://chronaworkflow.com" -ForegroundColor Yellow
Write-Host ""

# Verify AWS credentials
Write-Host "[1/6] Verifying AWS credentials..." -ForegroundColor Blue
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "✓ Authenticated as: $($identity.Arn)" -ForegroundColor Green
    
    if ($identity.Account -ne $AWS_ACCOUNT_ID) {
        Write-Host "✗ Wrong AWS account! Expected $AWS_ACCOUNT_ID, got $($identity.Account)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ AWS credentials not configured. Run 'aws configure'" -ForegroundColor Red
    exit 1
}

# Provision infrastructure
if (-not $SkipInfrastructure) {
    Write-Host ""
    Write-Host "[2/6] Provisioning infrastructure with Terraform..." -ForegroundColor Blue
    
    Push-Location $TERRAFORM_DIR
    
    Write-Host "  → Initializing Terraform..." -ForegroundColor Gray
    terraform init
    
    Write-Host "  → Planning infrastructure changes..." -ForegroundColor Gray
    terraform plan -var-file=production.tfvars -out=production.tfplan
    
    Write-Host ""
    Write-Host "Review the plan above. Continue? (Y/N): " -ForegroundColor Yellow -NoNewline
    $confirm = Read-Host
    
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        Pop-Location
        exit 0
    }
    
    Write-Host "  → Applying infrastructure..." -ForegroundColor Gray
    terraform apply production.tfplan
    
    Write-Host "  → Saving outputs..." -ForegroundColor Gray
    terraform output -json | Out-File -FilePath "outputs.json" -Encoding UTF8
    
    Pop-Location
    
    Write-Host "✓ Infrastructure provisioned" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/6] Skipping infrastructure provisioning" -ForegroundColor Yellow
}

# Configure kubectl
Write-Host ""
Write-Host "[3/6] Configuring kubectl..." -ForegroundColor Blue

Write-Host "  → Updating kubeconfig..." -ForegroundColor Gray
aws eks update-kubeconfig --region $AWS_REGION --name accubooks-production --alias accubooks-prod

Write-Host "  → Verifying cluster access..." -ForegroundColor Gray
kubectl cluster-info

Write-Host "  → Creating namespace..." -ForegroundColor Gray
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

Write-Host "✓ kubectl configured" -ForegroundColor Green

# Configure secrets
if (-not $SkipSecrets) {
    Write-Host ""
    Write-Host "[4/6] Configuring secrets..." -ForegroundColor Blue
    
    Write-Host ""
    Write-Host "You need to provide third-party service credentials." -ForegroundColor Yellow
    Write-Host "Press Enter to skip optional credentials." -ForegroundColor Yellow
    Write-Host ""
    
    # Prompt for third-party credentials
    $sendgridKey = Read-Host "SendGrid API Key (optional)"
    $smtpHost = Read-Host "SMTP Host (optional)"
    $smtpPort = Read-Host "SMTP Port (optional)"
    $smtpUser = Read-Host "SMTP User (optional)"
    $smtpPass = Read-Host "SMTP Password (optional)" -AsSecureString
    $stripeSecret = Read-Host "Stripe Secret Key (optional)"
    $stripePublic = Read-Host "Stripe Publishable Key (optional)"
    $stripeWebhook = Read-Host "Stripe Webhook Secret (optional)"
    $sentryDsn = Read-Host "Sentry DSN (optional)"
    $googleClientId = Read-Host "Google Client ID (optional)"
    $googleSecret = Read-Host "Google Client Secret (optional)" -AsSecureString
    $githubClientId = Read-Host "GitHub Client ID (optional)"
    $githubSecret = Read-Host "GitHub Client Secret (optional)" -AsSecureString
    
    # Convert SecureString to plain text for AWS
    $smtpPassPlain = if ($smtpPass.Length -gt 0) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass)) } else { "" }
    $googleSecretPlain = if ($googleSecret.Length -gt 0) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($googleSecret)) } else { "" }
    $githubSecretPlain = if ($githubSecret.Length -gt 0) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($githubSecret)) } else { "" }
    
    # Build JSON
    $thirdPartyJson = @{
        SENDGRID_API_KEY = $sendgridKey
        SMTP_HOST = $smtpHost
        SMTP_PORT = $smtpPort
        SMTP_USER = $smtpUser
        SMTP_PASS = $smtpPassPlain
        STRIPE_SECRET_KEY = $stripeSecret
        STRIPE_PUBLISHABLE_KEY = $stripePublic
        STRIPE_WEBHOOK_SECRET = $stripeWebhook
        SENTRY_DSN = $sentryDsn
        GOOGLE_CLIENT_ID = $googleClientId
        GOOGLE_CLIENT_SECRET = $googleSecretPlain
        GITHUB_CLIENT_ID = $githubClientId
        GITHUB_CLIENT_SECRET = $githubSecretPlain
    } | ConvertTo-Json -Compress
    
    Write-Host "  → Updating third-party secrets in AWS Secrets Manager..." -ForegroundColor Gray
    aws secretsmanager update-secret --secret-id accubooks/prod/third-party --secret-string $thirdPartyJson
    
    Write-Host "  → Syncing secrets to Kubernetes..." -ForegroundColor Gray
    
    # Fetch all secrets from AWS Secrets Manager
    $dbSecret = aws secretsmanager get-secret-value --secret-id accubooks/prod/database --query SecretString --output text | ConvertFrom-Json
    $redisSecret = aws secretsmanager get-secret-value --secret-id accubooks/prod/redis --query SecretString --output text | ConvertFrom-Json
    $authSecret = aws secretsmanager get-secret-value --secret-id accubooks/prod/auth --query SecretString --output text | ConvertFrom-Json
    $thirdParty = aws secretsmanager get-secret-value --secret-id accubooks/prod/third-party --query SecretString --output text | ConvertFrom-Json
    
    # Create backend secrets
    kubectl create secret generic accubooks-backend-secrets `
        --from-literal=DATABASE_URL="$($dbSecret.DATABASE_URL)" `
        --from-literal=REDIS_URL="$($redisSecret.REDIS_URL)" `
        --from-literal=REDIS_PASSWORD="$($redisSecret.REDIS_PASSWORD)" `
        --from-literal=JWT_SECRET="$($authSecret.JWT_SECRET)" `
        --from-literal=JWT_REFRESH_SECRET="$($authSecret.JWT_REFRESH_SECRET)" `
        --from-literal=SESSION_SECRET="$($authSecret.SESSION_SECRET)" `
        --from-literal=ENCRYPTION_KEY="$($authSecret.ENCRYPTION_KEY)" `
        --from-literal=SENDGRID_API_KEY="$($thirdParty.SENDGRID_API_KEY)" `
        --from-literal=SMTP_HOST="$($thirdParty.SMTP_HOST)" `
        --from-literal=SMTP_PORT="$($thirdParty.SMTP_PORT)" `
        --from-literal=SMTP_USER="$($thirdParty.SMTP_USER)" `
        --from-literal=SMTP_PASS="$($thirdParty.SMTP_PASS)" `
        --from-literal=STRIPE_SECRET_KEY="$($thirdParty.STRIPE_SECRET_KEY)" `
        --from-literal=STRIPE_WEBHOOK_SECRET="$($thirdParty.STRIPE_WEBHOOK_SECRET)" `
        --from-literal=SENTRY_DSN="$($thirdParty.SENTRY_DSN)" `
        --from-literal=GOOGLE_CLIENT_SECRET="$($thirdParty.GOOGLE_CLIENT_SECRET)" `
        --from-literal=GITHUB_CLIENT_SECRET="$($thirdParty.GITHUB_CLIENT_SECRET)" `
        --namespace=$NAMESPACE `
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create frontend secrets
    kubectl create secret generic accubooks-frontend-secrets `
        --from-literal=NEXT_PUBLIC_APP_URL="https://chronaworkflow.com" `
        --from-literal=NEXT_PUBLIC_API_URL="https://chronaworkflow.com/api" `
        --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$($thirdParty.STRIPE_PUBLISHABLE_KEY)" `
        --from-literal=NEXT_PUBLIC_SENTRY_DSN="$($thirdParty.SENTRY_DSN)" `
        --namespace=$NAMESPACE `
        --dry-run=client -o yaml | kubectl apply -f -
    
    Write-Host "✓ Secrets configured" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[4/6] Skipping secret configuration" -ForegroundColor Yellow
}

# Build and push Docker images
Write-Host ""
Write-Host "[5/6] Building and pushing Docker images..." -ForegroundColor Blue

$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$IMAGE_TAG = (git rev-parse --short HEAD 2>$null)
if (-not $IMAGE_TAG) { $IMAGE_TAG = "latest" }

Write-Host "  → Logging into ECR..." -ForegroundColor Gray
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

Write-Host "  → Creating ECR repositories..." -ForegroundColor Gray
aws ecr create-repository --repository-name accubooks-backend --region $AWS_REGION 2>$null
aws ecr create-repository --repository-name accubooks-frontend --region $AWS_REGION 2>$null

Write-Host "  → Building backend image..." -ForegroundColor Gray
Push-Location $PROJECT_ROOT
docker build --platform linux/amd64 -t accubooks-backend:$IMAGE_TAG -f Dockerfile .
docker tag accubooks-backend:$IMAGE_TAG $ECR_REGISTRY/accubooks-backend:$IMAGE_TAG
docker tag accubooks-backend:$IMAGE_TAG $ECR_REGISTRY/accubooks-backend:latest

Write-Host "  → Pushing backend image..." -ForegroundColor Gray
docker push $ECR_REGISTRY/accubooks-backend:$IMAGE_TAG
docker push $ECR_REGISTRY/accubooks-backend:latest

Write-Host "  → Building frontend image (using same Dockerfile)..." -ForegroundColor Gray
docker tag accubooks-backend:$IMAGE_TAG $ECR_REGISTRY/accubooks-frontend:$IMAGE_TAG
docker tag accubooks-backend:$IMAGE_TAG $ECR_REGISTRY/accubooks-frontend:latest

Write-Host "  → Pushing frontend image..." -ForegroundColor Gray
docker push $ECR_REGISTRY/accubooks-frontend:$IMAGE_TAG
docker push $ECR_REGISTRY/accubooks-frontend:latest

Pop-Location

Write-Host "✓ Docker images built and pushed" -ForegroundColor Green

# Deploy to Kubernetes
if (-not $SkipDeploy) {
    Write-Host ""
    Write-Host "[6/6] Deploying to Kubernetes..." -ForegroundColor Blue
    
    # Update deployment manifests with image tags
    $env:AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID
    $env:AWS_REGION = $AWS_REGION
    $env:IMAGE_TAG = $IMAGE_TAG
    
    Write-Host "  → Applying Kubernetes manifests..." -ForegroundColor Gray
    kubectl apply -f "$PROJECT_ROOT\k8s\base\secrets.yaml"
    kubectl apply -f "$PROJECT_ROOT\k8s\deployment.yaml"
    
    Write-Host "  → Waiting for rollout..." -ForegroundColor Gray
    kubectl rollout status deployment/accubooks-web -n $NAMESPACE --timeout=10m
    
    Write-Host "✓ Deployment complete" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[6/6] Skipping Kubernetes deployment" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Infrastructure provisioned" -ForegroundColor Green
Write-Host "✓ Secrets configured" -ForegroundColor Green
Write-Host "✓ Docker images pushed" -ForegroundColor Green
Write-Host "✓ Application deployed" -ForegroundColor Green
Write-Host ""

Write-Host "Checking deployment status..." -ForegroundColor Blue
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE
kubectl get ingress -n $NAMESPACE 2>$null

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure DNS to point chronaworkflow.com to the load balancer" -ForegroundColor White
Write-Host "2. Wait for SSL certificate to be issued (up to 30 minutes)" -ForegroundColor White
Write-Host "3. Test: curl https://chronaworkflow.com/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Deployment complete! 🎉" -ForegroundColor Green
