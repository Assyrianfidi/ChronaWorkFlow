# Render Deployment Environment Configuration
# AccuBooks Production Environment Setup

# =============================================================================
# RENDER ENVIRONMENT VARIABLES SETUP
# =============================================================================

# STEP 1: Navigate to your AccuBooks service on Render
# Dashboard → Services → AccuBooks → Environment

# =============================================================================
# REQUIRED SERVICE-BLOCKING VARIABLES (must be set for server to start)
# =============================================================================

# DATABASE_URL
# Render Field: DATABASE_URL
# Type: Secret
# Build vs Runtime: Runtime
# Sync: Yes (from PostgreSQL service)
# Instructions: 
# 1. Go to your PostgreSQL service on Render
# 2. Click "Connect" → "Internal Connection"
# 3. Copy the connection string
# 4. Paste into AccuBooks Environment as DATABASE_URL
# 5. Mark as "Secret"

# JWT_SECRET
# Render Field: JWT_SECRET
# Type: Secret
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Generate secure secret: openssl rand -base64 32
# 2. Paste into Environment as JWT_SECRET
# 3. Mark as "Secret"

# SESSION_SECRET
# Render Field: SESSION_SECRET
# Type: Secret
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Generate secure secret: openssl rand -base64 32
# 2. Paste into Environment as SESSION_SECRET
# 3. Mark as "Secret"

# FRONTEND_URL
# Render Field: FRONTEND_URL
# Type: Plain Text
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Enter your frontend URL: https://your-app.onrender.com
# 2. Do NOT mark as Secret

# NODE_ENV
# Render Field: NODE_ENV
# Type: Plain Text
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Set value to: production
# 2. Do NOT mark as Secret
# 3. CRITICAL: Must be exactly "production"

# =============================================================================
# OPTIONAL FEATURE VARIABLES (can be added gradually)
# =============================================================================

# REDIS_HOST + REDIS_PORT
# Render Field: REDIS_HOST, REDIS_PORT
# Type: Plain Text
# Build vs Runtime: Runtime
# Sync: Yes (from Redis service)
# Instructions:
# 1. Create Redis service on Render (if needed)
# 2. Go to Redis service → "Connect" → "Internal Connection"
# 3. Extract host and port from connection string
# 4. Set REDIS_HOST and REDIS_PORT separately

# STRIPE_SECRET_KEY
# Render Field: STRIPE_SECRET_KEY
# Type: Secret
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Get from Stripe Dashboard → Developers → API keys
# 2. Use test key for staging, live key for production
# 3. Mark as "Secret"

# STRIPE_WEBHOOK_SECRET
# Render Field: STRIPE_WEBHOOK_SECRET
# Type: Secret
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Create webhook endpoint in Stripe
# 2. Get webhook secret from Stripe webhook settings
# 3. Mark as "Secret"

# PLAID_CLIENT_ID + PLAID_SECRET
# Render Field: PLAID_CLIENT_ID, PLAID_SECRET
# Type: Secret
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Get from Plaid Dashboard → Team Settings → API keys
# 2. Mark both as "Secret"

# OWNER_EMAIL
# Render Field: OWNER_EMAIL
# Type: Plain Text
# Build vs Runtime: Runtime
# Sync: No
# Instructions:
# 1. Set to admin email address
# 2. Do NOT mark as Secret

# =============================================================================
# RENDER SERVICE CONFIGURATION
# =============================================================================

# Service Type: Web Service
# Runtime: Node 20
# Build Command: npm run build
# Start Command: npm start
# Health Check Path: /health

# =============================================================================
# DEPLOYMENT SEQUENCE
# =============================================================================

# Phase 1: CORE SERVICES (server must start)
# 1. Set NODE_ENV=production
# 2. Set DATABASE_URL (from PostgreSQL service)
# 3. Set JWT_SECRET (generate new secret)
# 4. Set SESSION_SECRET (generate new secret)
# 5. Set FRONTEND_URL (your frontend URL)
# 6. Deploy and verify server starts

# Phase 2: ENHANCEMENT SERVICES (gradual addition)
# 7. Add REDIS_HOST + REDIS_PORT (optional)
# 8. Add STRIPE_SECRET_KEY (payments)
# 9. Add STRIPE_WEBHOOK_SECRET (webhooks)
# 10. Add PLAID_CLIENT_ID + PLAID_SECRET (banking)
# 11. Add OWNER_EMAIL (notifications)

# =============================================================================
# RENDER-SPECIFIC NOTES
# =============================================================================

# • Render automatically provides PORT environment variable
# • Use Render's internal service connections for DATABASE_URL and REDIS
# • Mark all secrets as "Secret" in Render environment
# • Render injects secrets at runtime, not build time
# • Use Render's "Auto-Deploy" for git-based deployments
# • Health check path must be /health for Render monitoring

# =============================================================================
# ENVIRONMENT VALIDATION
# =============================================================================

# After setting variables:
# 1. Deploy service
# 2. Check logs: "AccuBooks server running on http://0.0.0.0:5000"
# 3. Test health: curl https://your-app.onrender.com/health
# 4. Verify response: {"status":"ok","service":"accubooks","env":"production"}
# 5. Check for missing variable warnings in logs
