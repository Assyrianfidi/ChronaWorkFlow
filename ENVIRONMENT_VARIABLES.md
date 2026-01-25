# Environment Variables Documentation

## Overview
This document outlines all environment variables used in the AccuBooks application for production deployment.

## Required Environment Variables

### Core Infrastructure
These variables are **REQUIRED** for the application to start:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `DATABASE_URL` | Secret | PostgreSQL connection string | `postgres://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret | JWT signing secret (min 32 chars) | `k8s9FJq3BvZpR1nA6H7qW4xYzL2fT0uI` |
| `SESSION_SECRET` | Secret | Session encryption secret (min 32 chars) | `wQ4rT6vX9mN2bL8cP1sK5yZ0hJ3uV7dR` |
| `NODE_ENV` | Plain Text | Environment mode | `production` |
| `FRONTEND_URL` | Plain Text | Frontend application URL | `https://app.example.com` |
| `PORT` | Plain Text | Server port | `5000` |
| `HOSTNAME` | Plain Text | Server bind address | `0.0.0.0` |

## Optional Environment Variables

### Services Integration
These variables enable additional features:

| Variable | Type | Service | Description |
|----------|------|---------|-------------|
| `REDIS_HOST` | Plain Text | Redis Cache | Redis server hostname |
| `REDIS_PORT` | Plain Text | Redis Cache | Redis server port |
| `REDIS_PASSWORD` | Secret | Redis Cache | Redis authentication password |
| `STRIPE_SECRET_KEY` | Secret | Stripe Payments | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe Payments | Stripe webhook verification |
| `PLAID_CLIENT_ID` | Secret | Plaid Banking | Plaid client ID |
| `PLAID_SECRET` | Secret | Plaid Banking | Plaid secret key |
| `OWNER_EMAIL` | Plain Text | System Admin | Administrator email address |

### Frontend Variables (VITE_ prefixed)
These variables are used by the frontend build process:

| Variable | Type | Description |
|----------|------|-------------|
| `VITE_API_URL` | Plain Text | API base URL for frontend |
| `VITE_API_VERSION` | Plain Text | API version |
| `VITE_ENABLE_CSRF` | Plain Text | Enable CSRF protection |
| `VITE_ENABLE_CSP` | Plain Text | Enable Content Security Policy |
| `VITE_SENTRY_DSN` | Secret | Sentry error tracking DSN |
| `VITE_GOOGLE_ANALYTICS_ID` | Secret | Google Analytics ID |
| `VITE_MAX_FILE_SIZE` | Plain Text | Maximum file upload size |
| `VITE_ALLOWED_FILE_TYPES` | Plain Text | Allowed file extensions |
| `VITE_SESSION_TIMEOUT` | Plain Text | Session timeout in ms |
| `VITE_JWT_EXPIRES_IN` | Plain Text | JWT expiration time |
| `VITE_REFRESH_TOKEN_EXPIRES_IN` | Plain Text | Refresh token expiration |
| `VITE_ALLOWED_ORIGINS` | Plain Text | CORS allowed origins |
| `VITE_CORS_CREDENTIALS` | Plain Text | Enable CORS credentials |
| `VITE_RATE_LIMIT_WINDOW` | Plain Text | Rate limit window |
| `VITE_RATE_LIMIT_MAX` | Plain Text | Max requests per window |
| `VITE_ENABLE_ANALYTICS` | Plain Text | Enable analytics tracking |
| `VITE_ENABLE_ERROR_REPORTING` | Plain Text | Enable error reporting |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | Plain Text | Enable performance monitoring |
| `VITE_LOG_LEVEL` | Plain Text | Frontend log level |

## Security Requirements

### Secret Variables
The following variables **MUST** be marked as "Secret" in Render:
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `REDIS_PASSWORD` (if using Redis)
- `STRIPE_SECRET_KEY` (if using Stripe)
- `STRIPE_WEBHOOK_SECRET` (if using Stripe)
- `PLAID_CLIENT_ID` (if using Plaid)
- `PLAID_SECRET` (if using Plaid)
- `VITE_SENTRY_DSN` (if using Sentry)
- `VITE_GOOGLE_ANALYTICS_ID` (if using GA)

### Production Validation
The application validates these requirements in production:
- `DATABASE_URL` must be a valid PostgreSQL connection string
- `JWT_SECRET` and `SESSION_SECRET` must be at least 32 characters
- `FRONTEND_URL` must use HTTPS in production
- All required variables must be present or the application will not start

## Environment Files

### `.env.production`
Contains production environment variables. This file should:
- Never be committed to version control
- Be used as a template for Render environment variables
- Include all required variables with proper values

### `.env.example`
Contains example values for development. This file:
- Can be committed to version control
- Should not contain real secrets
- Serves as documentation for available variables

## Database Configuration

### Database Name
The production database name is: `accubooks_prod_Chronaworkflow`

### Connection String Format
```
postgres://username:password@hostname:5432/accubooks_prod_Chronaworkflow
```

## Startup Validation

The application performs the following checks at startup:
1. Validates all required environment variables are present
2. Checks database connection string format
3. Validates secret strength in production
4. Logs configuration (without exposing secrets)

If any validation fails, the application will:
- Log detailed error messages
- Exit with status code 1
- Prevent deployment with missing configuration

## Render Deployment

### Step 1: Add Environment Variables
1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add all required variables
4. Mark secret variables as "Secret"

### Step 2: Verify Configuration
1. Deploy the service
2. Check logs for validation messages
3. Verify `/health` endpoint returns correct response
4. Test authentication and database connectivity

### Step 3: Production Verification
- Ensure `NODE_ENV=production`
- Verify HTTPS URLs are used
- Test all integrated services (Stripe, Plaid, etc.)
- Monitor for any startup errors

## Troubleshooting

### Common Issues
1. **Missing DATABASE_URL**: Application will not start
2. **Weak secrets**: Warning in production logs
3. **HTTP URLs**: Warning for FRONTEND_URL in production
4. **Database connection**: Verify connection string format

### Debug Mode
Set `DEBUG_MODE=true` to enable detailed logging (development only).

## File Locations

- Environment validation: `server/config/env-validation.ts`
- Production environment file: `.env.production`
- Example environment file: `.env.example`
- Database configuration: `server/database/index.ts`, `server/db.ts`, `server/prisma.ts`
