# AccuBooks Service Dependency Mapping
# Analysis of environment variable usage by subsystem

# =============================================================================
# DATABASE SUBSYSTEM
# =============================================================================

# DATABASE_URL
# Subsystem: PostgreSQL + Drizzle ORM
# Usage Phase: BOOT (database connection pool created at startup)
# Service Impact: SERVICE-BLOCKING - Server fails to start without DB connection
# Failure Mode: Throws database connection error, process exits
# Dependencies: None (first service to initialize)
# Health Check: Database connectivity test during startup

# =============================================================================
# AUTHENTICATION SUBSYSTEM  
# =============================================================================

# JWT_SECRET
# Subsystem: JWT token middleware (jsonwebtoken library)
# Usage Phase: BOOT (middleware initialized with secret)
# Service Impact: SERVICE-BLOCKING - All protected routes fail
# Failure Mode: Token verification fails, 401 errors on all API calls
# Dependencies: Express app initialization
# Health Check: JWT token generation/verification test

# SESSION_SECRET
# Subsystem: Express-session middleware
# Usage Phase: BOOT (session middleware configured)
# Service Impact: SERVICE-BLOCKING - Session-based auth breaks
# Failure Mode: Cookie signing fails, session corruption possible
# Dependencies: Express app initialization
# Health Check: Session creation test

# =============================================================================
# REDIS SUBSYSTEM
# =============================================================================

# REDIS_HOST + REDIS_PORT
# Subsystem: Redis client (ioredis/redis library)
# Usage Phase: RUNTIME (lazy-loaded when cache accessed)
# Service Impact: FEATURE-DISABLED - Graceful degradation to memory storage
# Failure Mode: Connection timeout, fallback to in-memory sessions
# Dependencies: None (independent service)
# Health Check: Redis ping test (non-blocking)

# =============================================================================
# PAYMENT PROCESSING (STRIPE)
# =============================================================================

# STRIPE_SECRET_KEY
# Subsystem: Stripe API client (stripe library)
# Usage Phase: RUNTIME (lazy-loaded when payment endpoints called)
# Service Impact: FEATURE-DISABLED - Payment features unavailable
# Failure Mode: Stripe initialization fails, payment endpoints return 503
# Dependencies: None (independent service)
# Health Check: Stripe API balance check (non-blocking)

# STRIPE_WEBHOOK_SECRET
# Subsystem: Stripe webhook verification
# Usage Phase: RUNTIME (when webhook endpoints receive requests)
# Service Impact: FEATURE-DISABLED - Webhooks rejected
# Failure Mode: Webhook signature verification fails, events ignored
# Dependencies: STRIPE_SECRET_KEY
# Health Check: Webhook signature test (non-blocking)

# =============================================================================
# BANKING INTEGRATION (PLAID)
# =============================================================================

# PLAID_CLIENT_ID + PLAID_SECRET
# Subsystem: Plaid API client (plaid library)
# Usage Phase: RUNTIME (lazy-loaded when banking features used)
# Service Impact: FEATURE-DISABLED - Bank linking unavailable
# Failure Mode: Plaid client initialization fails, banking endpoints return 503
# Dependencies: None (independent service)
# Health Check: Plaid API test call (non-blocking)

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# FRONTEND_URL
# Subsystem: CORS middleware + Email links + Redirects
# Usage Phase: BOOT (CORS configured at startup)
# Service Impact: CORS-ISSUES - Frontend cannot communicate with API
# Failure Mode: CORS blocks cross-origin requests, broken user interface
# Dependencies: Express app initialization
# Health Check: CORS preflight test

# OWNER_EMAIL
# Subsystem: Notification system + Error reporting
# Usage Phase: RUNTIME (when notifications sent)
# Service Impact: WARNING - System notifications fail
# Failure Mode: Email sending fails, error reports not delivered
# Dependencies: SMTP configuration
# Health Check: Email delivery test (non-blocking)

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

# NODE_ENV
# Subsystem: Global application behavior
# Usage Phase: BOOT (sets global Node.js environment)
# Service Impact: SERVICE-BLOCKING - Wrong behavior mode
# Failure Mode: Development mode in production, security/performance issues
# Dependencies: None (first setting applied)
# Health Check: Environment verification

# =============================================================================
# STARTUP DEPENDENCY ORDER
# =============================================================================

# BOOT PHASE (must succeed for server to start):
# 1. NODE_ENV (global setting)
# 2. DATABASE_URL (database connection)
# 3. JWT_SECRET + SESSION_SECRET (auth middleware)
# 4. FRONTEND_URL (CORS configuration)

# RUNTIME PHASE (lazy-loaded, can fail gracefully):
# 1. REDIS_HOST + REDIS_PORT (caching - fallback available)
# 2. STRIPE_SECRET_KEY (payments - feature disabled)
# 3. STRIPE_WEBHOOK_SECRET (webhooks - feature disabled)
# 4. PLAID_CLIENT_ID + PLAID_SECRET (banking - feature disabled)
# 5. OWNER_EMAIL (notifications - warning logged)

# =============================================================================
# FAILURE HANDLING STRATEGY
# =============================================================================

# SERVICE-BLOCKING: Server fails to start, immediate fix required
#   - DATABASE_URL, JWT_SECRET, SESSION_SECRET, FRONTEND_URL, NODE_ENV

# FEATURE-DISABLED: Server starts, feature unavailable
#   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PLAID_CLIENT_ID, PLAID_SECRET

# WARNING: Server starts, feature degraded
#   - REDIS_HOST, REDIS_PORT (falls back to memory)
#   - OWNER_EMAIL (notifications fail)

# CORS-ISSUES: Server starts, frontend cannot connect
#   - FRONTEND_URL
