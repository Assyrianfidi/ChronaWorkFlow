// Enhanced security configuration for comprehensive protection
export const ENHANCED_SECURITY_CONFIG = {
  // Comprehensive Content Security Policy
  CSP: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://api.accubooks.com"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": [],
  },

  // Comprehensive Security Headers
  HEADERS: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.accubooks.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    "Access-Control-Allow-Origin": "https://accubooks.com",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  },

  // Enhanced CSRF Protection
  CSRF: {
    enabled: true,
    tokenName: "X-CSRF-Token",
    cookieName: "csrf-token",
    cookieOptions: {
      secure: true,
      sameSite: "strict",
      httpOnly: false,
      path: "/",
    },
  },

  // Enhanced Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Enhanced Authentication
  AUTH: {
    jwtExpiresIn: "1h",
    refreshTokenExpiresIn: "7d",
    bcryptRounds: 12,
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Enhanced Data Protection
  DATA_PROTECTION: {
    encryption: {
      algorithm: "AES-256-GCM",
      keyLength: 32,
      ivLength: 16,
    },
    masking: {
      email: true,
      phone: true,
      ssn: true,
      creditCard: true,
      bankAccount: true,
    },
    retention: {
      userAccounts: "until_deletion",
      transactions: "7_years",
      analytics: "24_months",
      logs: "1_year",
      auditLogs: "7_years",
    },
  },

  // Enhanced Input Validation
  VALIDATION: {
    maxStringLength: 1000,
    allowedHtmlTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "div",
    ],
    allowedAttributes: ["class", "id", "href", "target", "alt", "title"],
    sanitizeInputs: true,
    validateOutputs: true,
    preventXSS: true,
    preventSQLInjection: true,
  },

  // Enhanced File Upload Security
  FILE_UPLOAD: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
    ],
    scanForMalware: true,
    quarantineSuspicious: true,
    validateFileContent: true,
    sanitizeFileName: true,
  },

  // Enhanced Logging and Monitoring
  LOGGING: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
    logToFile: process.env.NODE_ENV === "production",
    logToConsole: process.env.NODE_ENV !== "production",
    sanitizeLogs: true,
    excludeSensitiveData: true,
    auditLogRetention: "7_years",
    securityEventLogging: true,
    performanceMonitoring: true,
  },

  // Enhanced CORS Configuration
  CORS: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://accubooks.com", "https://www.accubooks.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
    ],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // Enhanced Session Security
  SESSION: {
    timeout: 60 * 60 * 1000, // 1 hour
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    rolling: true,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
  },

  // Enhanced API Security
  API: {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    validateStatus: true,
    sanitizeRequests: true,
    sanitizeResponses: true,
    rateLimitPerUser: true,
    requestValidation: true,
    responseValidation: true,
  },

  // Enhanced Monitoring and Alerting
  MONITORING: {
    enableSecurityMonitoring: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableUserBehaviorTracking: false,
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 2000, // 2 seconds
      failedLoginAttempts: 5,
      suspiciousActivity: 10,
    },
  },
};

// Environment-specific enhanced security settings
export const getEnhancedSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    ...ENHANCED_SECURITY_CONFIG,
    LOGGING: {
      ...ENHANCED_SECURITY_CONFIG.LOGGING,
      level: isProduction ? "error" : "debug",
      logToFile: isProduction,
      logToConsole: isDevelopment,
    },
    SESSION: {
      ...ENHANCED_SECURITY_CONFIG.SESSION,
      secure: isProduction,
    },
    CORS: {
      ...ENHANCED_SECURITY_CONFIG.CORS,
      origin: isProduction
        ? ["https://accubooks.com", "https://www.accubooks.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    },
    MONITORING: {
      ...ENHANCED_SECURITY_CONFIG.MONITORING,
      enableUserBehaviorTracking: isDevelopment,
    },
  };
};

export default ENHANCED_SECURITY_CONFIG;
