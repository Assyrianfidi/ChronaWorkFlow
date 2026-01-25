# AccuBooks Environment Variable Activation Plan
# Step-by-step service restoration with verification checkpoints

# =============================================================================
# ACTIVATION PRINCIPLES
# =============================================================================

# • Each step is independently verifiable
# • Failed step does not break previous functionality
# • Service-blocking variables are activated first
# • Feature variables are activated gradually
# • Each step includes rollback instructions

# =============================================================================
# STEP 1: DATABASE CONNECTION
# =============================================================================

# Variables to Add:
# - DATABASE_URL

# Action:
# 1. Add DATABASE_URL to Render Environment
# 2. Deploy service
# 3. Check logs for database connection success/failure

# Expected Success Indicators:
# ✅ Log: "Database connected successfully"
# ✅ Health endpoint: {"status":"ok","service":"accubooks","env":"production"}
# ✅ No database connection errors in logs

# Failure Indicators:
# ❌ Log: "Database connection failed"
# ❌ Health endpoint: Error 500 or timeout
# ❌ Server exits or restarts repeatedly

# Rollback:
# - Remove DATABASE_URL
# - Redeploy (server returns to minimal mode)

# Verification Command:
# curl https://your-app.onrender.com/health

# =============================================================================
# STEP 2: AUTHENTICATION SYSTEM
# =============================================================================

# Variables to Add:
# - JWT_SECRET
# - SESSION_SECRET

# Action:
# 1. Add JWT_SECRET and SESSION_SECRET to Render Environment
# 2. Deploy service
# 3. Test authentication endpoints

# Expected Success Indicators:
# ✅ Log: "Authentication middleware initialized"
# ✅ Health endpoint: Still responding normally
# ✅ Auth endpoints return 401 (unauthorized) instead of 500 (server error)

# Failure Indicators:
# ❌ Log: "JWT secret not configured"
# ❌ Auth endpoints return 500 errors
# ❌ Server fails to start

# Rollback:
# - Remove JWT_SECRET and SESSION_SECRET
# - Redeploy (server continues without auth)

# Verification Commands:
# curl https://your-app.onrender.com/health
# curl https://your-app.onrender.com/api/auth/login (should return 401, not 500)

# =============================================================================
# STEP 3: FRONTEND CORS CONFIGURATION
# =============================================================================

# Variables to Add:
# - FRONTEND_URL

# Action:
# 1. Add FRONTEND_URL to Render Environment
# 2. Deploy service
# 3. Test CORS preflight requests

# Expected Success Indicators:
# ✅ Log: "CORS configured for FRONTEND_URL"
# ✅ Health endpoint: Still responding normally
# ✅ CORS preflight requests succeed from frontend

# Failure Indicators:
# ❌ Browser console: CORS errors
# ❌ Frontend cannot make API requests
# ❌ CORS preflight returns 403/500

# Rollback:
# - Remove FRONTEND_URL
# - Redeploy (CORS falls back to permissive mode)

# Verification Commands:
# curl -H "Origin: https://your-frontend.com" \
#      -H "Access-Control-Request-Method: POST" \
#      -H "Access-Control-Request-Headers: X-Requested-With" \
#      -X OPTIONS \
#      https://your-app.onrender.com/api/test

# =============================================================================
# STEP 4: REDIS CACHING (Optional Enhancement)
# =============================================================================

# Variables to Add:
# - REDIS_HOST
# - REDIS_PORT

# Action:
# 1. Add REDIS_HOST and REDIS_PORT to Render Environment
# 2. Deploy service
# 3. Check Redis connection logs

# Expected Success Indicators:
# ✅ Log: "Redis connected successfully"
# ✅ Health endpoint: Still responding normally
# ✅ Caching features work (if tested)

# Failure Indicators:
# ❌ Log: "Redis connection failed, falling back to memory"
# ✅ Server continues normally (graceful degradation)

# Rollback:
# - Remove REDIS_HOST and REDIS_PORT
# - Redeploy (falls back to memory caching)

# Verification Commands:
# curl https://your-app.onrender.com/health
# Check logs for Redis connection status

# =============================================================================
# STEP 5: STRIPE PAYMENT PROCESSING
# =============================================================================

# Variables to Add:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET

# Action:
# 1. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Render Environment
# 2. Deploy service
# 3. Test Stripe initialization

# Expected Success Indicators:
# ✅ Log: "Stripe client initialized"
# ✅ Health endpoint: Still responding normally
# ✅ Payment endpoints respond (may return 403 if not configured)

# Failure Indicators:
# ❌ Log: "Stripe initialization failed"
# ✅ Server continues normally (payments disabled)

# Rollback:
# - Remove STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
# - Redeploy (payments disabled, server continues)

# Verification Commands:
# curl https://your-app.onrender.com/health
# curl https://your-app.onrender.com/api/payments/create (should not return 500)

# =============================================================================
# STEP 6: PLAID BANKING INTEGRATION
# =============================================================================

# Variables to Add:
# - PLAID_CLIENT_ID
# - PLAID_SECRET

# Action:
# 1. Add PLAID_CLIENT_ID and PLAID_SECRET to Render Environment
# 2. Deploy service
# 3. Test Plaid initialization

# Expected Success Indicators:
# ✅ Log: "Plaid client initialized"
# ✅ Health endpoint: Still responding normally
# ✅ Banking endpoints respond (may return 403 if not configured)

# Failure Indicators:
# ❌ Log: "Plaid initialization failed"
# ✅ Server continues normally (banking disabled)

# Rollback:
# - Remove PLAID_CLIENT_ID and PLAID_SECRET
# - Redeploy (banking disabled, server continues)

# Verification Commands:
# curl https://your-app.onrender.com/health
# curl https://your-app.onrender.com/api/plaid/link (should not return 500)

# =============================================================================
# STEP 7: NOTIFICATION SYSTEM
# =============================================================================

# Variables to Add:
# - OWNER_EMAIL

# Action:
# 1. Add OWNER_EMAIL to Render Environment
# 2. Deploy service
# 3. Test notification configuration

# Expected Success Indicators:
# ✅ Log: "Notification system configured"
# ✅ Health endpoint: Still responding normally
# ✅ Email notifications can be sent (if SMTP configured)

# Failure Indicators:
# ❌ Log: "Email configuration incomplete"
# ✅ Server continues normally (notifications disabled)

# Rollback:
# - Remove OWNER_EMAIL
# - Redeploy (notifications disabled, server continues)

# Verification Commands:
# curl https://your-app.onrender.com/health

# =============================================================================
# CRITICAL SUCCESS CRITERIA
# =============================================================================

# After EACH step, verify:
# 1. Health endpoint responds: https://your-app.onrender.com/health
# 2. Server logs show successful startup
# 3. No crash loops or restarts
# 4. Previous functionality remains intact

# STOP IMMEDIATELY IF:
# - Health endpoint stops responding
# - Server enters crash loop
# - Previous functionality breaks
# - Error logs indicate service-blocking failures

# =============================================================================
# FINAL VALIDATION
# =============================================================================

# After all steps complete:
# ✅ All environment variables configured
# ✅ All services initialized successfully
# ✅ Health endpoint responds correctly
# ✅ No error logs or warnings
# ✅ Full feature set available

# Final Health Check Response:
# {"status":"ok","service":"accubooks","env":"production"}

# System Status: PRODUCTION READY
