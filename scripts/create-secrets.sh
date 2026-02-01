#!/bin/bash
# Script to create Kubernetes secrets from AWS Secrets Manager
# Usage: ./create-secrets.sh [environment]
# Example: ./create-secrets.sh production

set -euo pipefail

ENVIRONMENT=${1:-production}
NAMESPACE="accubooks-prod"

echo "🔐 Creating Kubernetes secrets for ${ENVIRONMENT} environment..."
echo ""

# Check AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Check kubectl is configured
if ! kubectl cluster-info &>/dev/null; then
    echo "❌ kubectl not configured. Configure access to your cluster first."
    exit 1
fi

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

echo "📥 Fetching secrets from AWS Secrets Manager..."

# Fetch secrets from AWS Secrets Manager
DATABASE_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id accubooks/${ENVIRONMENT}/database \
    --query SecretString --output text)

REDIS_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id accubooks/${ENVIRONMENT}/redis \
    --query SecretString --output text)

AUTH_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id accubooks/${ENVIRONMENT}/auth \
    --query SecretString --output text)

THIRD_PARTY_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id accubooks/${ENVIRONMENT}/third-party \
    --query SecretString --output text)

# Extract individual values
DATABASE_URL=$(echo $DATABASE_SECRET | jq -r '.DATABASE_URL')
REDIS_URL=$(echo $REDIS_SECRET | jq -r '.REDIS_URL')
REDIS_PASSWORD=$(echo $REDIS_SECRET | jq -r '.REDIS_PASSWORD // empty')
JWT_SECRET=$(echo $AUTH_SECRET | jq -r '.JWT_SECRET')
JWT_REFRESH_SECRET=$(echo $AUTH_SECRET | jq -r '.JWT_REFRESH_SECRET')
SESSION_SECRET=$(echo $AUTH_SECRET | jq -r '.SESSION_SECRET')
ENCRYPTION_KEY=$(echo $AUTH_SECRET | jq -r '.ENCRYPTION_KEY')

# Third-party services
SENDGRID_API_KEY=$(echo $THIRD_PARTY_SECRET | jq -r '.SENDGRID_API_KEY // empty')
SMTP_HOST=$(echo $THIRD_PARTY_SECRET | jq -r '.SMTP_HOST // empty')
SMTP_PORT=$(echo $THIRD_PARTY_SECRET | jq -r '.SMTP_PORT // empty')
SMTP_USER=$(echo $THIRD_PARTY_SECRET | jq -r '.SMTP_USER // empty')
SMTP_PASS=$(echo $THIRD_PARTY_SECRET | jq -r '.SMTP_PASS // empty')
STRIPE_SECRET_KEY=$(echo $THIRD_PARTY_SECRET | jq -r '.STRIPE_SECRET_KEY // empty')
STRIPE_WEBHOOK_SECRET=$(echo $THIRD_PARTY_SECRET | jq -r '.STRIPE_WEBHOOK_SECRET // empty')
SENTRY_DSN=$(echo $THIRD_PARTY_SECRET | jq -r '.SENTRY_DSN // empty')
GOOGLE_CLIENT_SECRET=$(echo $THIRD_PARTY_SECRET | jq -r '.GOOGLE_CLIENT_SECRET // empty')
GITHUB_CLIENT_SECRET=$(echo $THIRD_PARTY_SECRET | jq -r '.GITHUB_CLIENT_SECRET // empty')

echo "✅ Secrets fetched successfully"
echo ""

# Validate required secrets
echo "🔍 Validating required secrets..."

MISSING_SECRETS=()

[[ -z "$DATABASE_URL" ]] && MISSING_SECRETS+=("DATABASE_URL")
[[ -z "$REDIS_URL" ]] && MISSING_SECRETS+=("REDIS_URL")
[[ -z "$JWT_SECRET" ]] && MISSING_SECRETS+=("JWT_SECRET")
[[ -z "$JWT_REFRESH_SECRET" ]] && MISSING_SECRETS+=("JWT_REFRESH_SECRET")
[[ -z "$SESSION_SECRET" ]] && MISSING_SECRETS+=("SESSION_SECRET")
[[ -z "$ENCRYPTION_KEY" ]] && MISSING_SECRETS+=("ENCRYPTION_KEY")

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    echo "❌ Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    exit 1
fi

echo "✅ All required secrets present"
echo ""

# Create backend secrets
echo "📝 Creating backend secrets in Kubernetes..."

kubectl create secret generic accubooks-backend-secrets \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    --from-literal=REDIS_URL="$REDIS_URL" \
    --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    --from-literal=SESSION_SECRET="$SESSION_SECRET" \
    --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    --from-literal=SENDGRID_API_KEY="$SENDGRID_API_KEY" \
    --from-literal=SMTP_HOST="$SMTP_HOST" \
    --from-literal=SMTP_PORT="$SMTP_PORT" \
    --from-literal=SMTP_USER="$SMTP_USER" \
    --from-literal=SMTP_PASS="$SMTP_PASS" \
    --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    --from-literal=SENTRY_DSN="$SENTRY_DSN" \
    --from-literal=GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
    --from-literal=GITHUB_CLIENT_SECRET="$GITHUB_CLIENT_SECRET" \
    --namespace=${NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Backend secrets created"
echo ""

# Create frontend secrets (only public-safe values)
echo "📝 Creating frontend secrets in Kubernetes..."

APP_URL="https://chronaworkflow.com"
API_URL="https://chronaworkflow.com/api"

# Get public Stripe key from third-party secret
STRIPE_PUBLISHABLE_KEY=$(echo $THIRD_PARTY_SECRET | jq -r '.STRIPE_PUBLISHABLE_KEY // empty')

kubectl create secret generic accubooks-frontend-secrets \
    --from-literal=NEXT_PUBLIC_APP_URL="$APP_URL" \
    --from-literal=NEXT_PUBLIC_API_URL="$API_URL" \
    --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" \
    --from-literal=NEXT_PUBLIC_SENTRY_DSN="$SENTRY_DSN" \
    --namespace=${NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Frontend secrets created"
echo ""

# Verify secrets were created
echo "🔍 Verifying secrets..."

kubectl get secret accubooks-backend-secrets -n ${NAMESPACE} &>/dev/null && \
    echo "✅ Backend secrets verified" || \
    echo "❌ Backend secrets not found"

kubectl get secret accubooks-frontend-secrets -n ${NAMESPACE} &>/dev/null && \
    echo "✅ Frontend secrets verified" || \
    echo "❌ Frontend secrets not found"

echo ""
echo "✅ Secret creation complete!"
echo ""
echo "📋 Summary:"
echo "   Environment: ${ENVIRONMENT}"
echo "   Namespace: ${NAMESPACE}"
echo "   Secrets created:"
echo "     - accubooks-backend-secrets"
echo "     - accubooks-frontend-secrets"
echo ""
echo "🚀 You can now deploy the application"
