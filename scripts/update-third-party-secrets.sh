#!/bin/bash
# Script to update third-party secrets in AWS Secrets Manager
# Usage: ./update-third-party-secrets.sh [environment]
# Example: ./update-third-party-secrets.sh production

set -euo pipefail

ENVIRONMENT=${1:-production}
SECRET_NAME="accubooks/${ENVIRONMENT}/third-party"

echo "🔐 Updating third-party secrets for ${ENVIRONMENT} environment..."
echo ""
echo "This script will prompt you for third-party service credentials."
echo "Press Enter to skip optional credentials."
echo ""

# Prompt for credentials
read -p "SendGrid API Key (optional): " SENDGRID_API_KEY
read -p "SMTP Host (optional): " SMTP_HOST
read -p "SMTP Port (optional): " SMTP_PORT
read -p "SMTP User (optional): " SMTP_USER
read -sp "SMTP Password (optional): " SMTP_PASS
echo ""
read -p "Stripe Secret Key (optional): " STRIPE_SECRET_KEY
read -p "Stripe Publishable Key (optional): " STRIPE_PUBLISHABLE_KEY
read -p "Stripe Webhook Secret (optional): " STRIPE_WEBHOOK_SECRET
read -p "Sentry DSN (optional): " SENTRY_DSN
read -p "Google Client ID (optional): " GOOGLE_CLIENT_ID
read -sp "Google Client Secret (optional): " GOOGLE_CLIENT_SECRET
echo ""
read -p "GitHub Client ID (optional): " GITHUB_CLIENT_ID
read -sp "GitHub Client Secret (optional): " GITHUB_CLIENT_SECRET
echo ""

# Build JSON
SECRET_JSON=$(jq -n \
    --arg sendgrid "$SENDGRID_API_KEY" \
    --arg smtp_host "$SMTP_HOST" \
    --arg smtp_port "$SMTP_PORT" \
    --arg smtp_user "$SMTP_USER" \
    --arg smtp_pass "$SMTP_PASS" \
    --arg stripe_secret "$STRIPE_SECRET_KEY" \
    --arg stripe_public "$STRIPE_PUBLISHABLE_KEY" \
    --arg stripe_webhook "$STRIPE_WEBHOOK_SECRET" \
    --arg sentry "$SENTRY_DSN" \
    --arg google_id "$GOOGLE_CLIENT_ID" \
    --arg google_secret "$GOOGLE_CLIENT_SECRET" \
    --arg github_id "$GITHUB_CLIENT_ID" \
    --arg github_secret "$GITHUB_CLIENT_SECRET" \
    '{
        SENDGRID_API_KEY: $sendgrid,
        SMTP_HOST: $smtp_host,
        SMTP_PORT: $smtp_port,
        SMTP_USER: $smtp_user,
        SMTP_PASS: $smtp_pass,
        STRIPE_SECRET_KEY: $stripe_secret,
        STRIPE_PUBLISHABLE_KEY: $stripe_public,
        STRIPE_WEBHOOK_SECRET: $stripe_webhook,
        SENTRY_DSN: $sentry,
        GOOGLE_CLIENT_ID: $google_id,
        GOOGLE_CLIENT_SECRET: $google_secret,
        GITHUB_CLIENT_ID: $github_id,
        GITHUB_CLIENT_SECRET: $github_secret
    }')

echo ""
echo "📤 Updating secret in AWS Secrets Manager..."

aws secretsmanager update-secret \
    --secret-id "$SECRET_NAME" \
    --secret-string "$SECRET_JSON"

echo "✅ Third-party secrets updated successfully"
echo ""
echo "⚠️  Remember to sync secrets to Kubernetes:"
echo "   ./scripts/create-secrets.sh ${ENVIRONMENT}"
