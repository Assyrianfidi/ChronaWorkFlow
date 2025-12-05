#!/bin/bash

# Generate secure random strings for all required secrets
echo "# AccuBooks Production Secrets" > .env.production.local
echo "# Generated on $(date)" >> .env.production.local
echo "# DO NOT COMMIT THIS FILE TO VERSION CONTROL" >> .env.production.local
echo "" >> .env.production.local

# Database
if [ -z "$DB_PASSWORD" ]; then
  echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)" >> .env.production.local
else
  echo "DB_PASSWORD=$DB_PASSWORD" >> .env.production.local
fi

# NextAuth
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)" >> .env.production.local
else
  echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.production.local
fi

# JWT
if [ -z "$JWT_SECRET" ]; then
  echo "JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)" >> .env.production.local
else
  echo "JWT_SECRET=$JWT_SECRET" >> .env.production.local
fi

# Encryption Key (for at-rest encryption)
if [ -z "$ENCRYPTION_KEY" ]; then
  echo "ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)" >> .env.production.local
else
  echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.production.local
fi

# Cookie Secret
if [ -z "$COOKIE_SECRET" ]; then
  echo "COOKIE_SECRET=$(openssl rand -base64 32 | tr -d '\n' | cut -c1-32)" >> .env.production.local
else
  echo "COOKIE_SECRET=$COOKIE_SECRET" >> .env.production.local
fi

# SMTP Configuration
echo "" >> .env.production.local
echo "# SMTP Configuration" >> .env.production.local
if [ -z "$SMTP_USER" ]; then
  echo "SMTP_USER=your_smtp_username" >> .env.production.local
else
  echo "SMTP_USER=$SMTP_USER" >> .env.production.local
fi

if [ -z "$SMTP_PASSWORD" ]; then
  echo "SMTP_PASSWORD=your_smtp_password" >> .env.production.local
else
  echo "SMTP_PASSWORD=$SMTP_PASSWORD" >> .env.production.local
fi

# OAuth Providers
echo "" >> .env.production.local
echo "# OAuth Providers" >> .env.production.local
if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "GOOGLE_CLIENT_ID=your_google_client_id" >> .env.production.local
else
  echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> .env.production.local
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "GOOGLE_CLIENT_SECRET=your_google_client_secret" >> .env.production.local
else
  echo "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" >> .env.production.local
fi

if [ -z "$GITHUB_CLIENT_ID" ]; then
  echo "GITHUB_CLIENT_ID=your_github_client_id" >> .env.production.local
else
  echo "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID" >> .env.production.local
fi

if [ -z "$GITHUB_CLIENT_SECRET" ]; then
  echo "GITHUB_CLIENT_SECRET=your_github_client_secret" >> .env.production.local
else
  echo "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET" >> .env.production.local
fi

# Sentry
echo "" >> .env.production.local
echo "# Sentry" >> .env.production.local
if [ -z "$SENTRY_DSN" ]; then
  echo "SENTRY_DSN=your_sentry_dsn" >> .env.production.local
else
  echo "SENTRY_DSN=$SENTRY_DSN" >> .env.production.local
fi

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "SENTRY_AUTH_TOKEN=your_sentry_auth_token" >> .env.production.local
else
  echo "SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN" >> .env.production.local
fi

echo ""
echo "✅ Generated .env.production.local with secure secrets"
echo "🔒 Please review and edit the file to add any missing values"
echo "🚫 Add .env.production.local to .gitignore to prevent accidental commits"
echo ""
echo "Next steps:"
echo "1. Edit .env.production.local to add your OAuth credentials and SMTP settings"
echo "2. Run 'source .env.production.local' to load the variables"
echo "3. Run 'envsubst < .env.production > .env' to generate the final .env file"
echo ""

# Create a sample .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
  echo "# Environment files" > .gitignore
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.development.local" >> .gitignore
  echo ".env.test.local" >> .gitignore
  echo ".env.production.local" >> .gitignore
  echo "" >> .gitignore
  echo "# Dependencies" >> .gitignore
  echo "node_modules/" >> .gitignore
  echo ".next/" >> .gitignore
  echo "out/" >> .gitignore
  echo "" >> .gitignore
  echo "# Debug logs" >> .gitignore
  echo "npm-debug.log*" >> .gitignore
  echo "yarn-debug.log*" >> .gitignore
  echo "yarn-error.log*" >> .gitignore
  echo "" >> .gitignore
  echo "# Production" >> .gitignore
  echo ".vercel" >> .gitignore
  echo "" >> .gitignore
  echo "# Local development" >> .gitignore
  echo ".DS_Store" >> .gitignore
  echo "*.pem" >> .gitignore
  echo "" >> .gitignore
  echo "# Testing" >> .gitignore
  echo "coverage/" >> .gitignore
  echo "" >> .gitignore
  echo "# Logs" >> .gitignore
  echo "logs" >> .gitignore
  echo "*.log" >> .gitignore
  echo "" >> .gitignore
  echo "# Local development" >> .gitignore
  echo "*.local" >> .gitignore
  echo "" >> .gitignore
  echo "# IDE specific files" >> .gitignore
  echo ".idea/" >> .gitignore
  echo ".vscode/" >> .gitignore
  echo "*.suo" >> .gitignore
  echo "*.ntvs*" >> .gitignore
  echo "*.njsproj" >> .gitignore
  echo "*.sln" >> .gitignore
  echo "*.sw?" >> .gitignore
  
  echo ""
  echo "📝 Created .gitignore file with common exclusions"
fi

echo ""
echo "🔒 Security Note:"
echo "- Store these secrets securely (e.g., in a password manager)"
echo "- Use environment variables or a secret management service in production"
echo "- Never commit .env.production.local to version control"
echo "- Rotate these secrets periodically for enhanced security"

exit 0
