// Security configuration for AccuBooks
export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'font-src': ["'self'", "data:"],
    'connect-src': ["'self'", "https://api.accubooks.com"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },
  
  // Security Headers
  HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  },
  
  // CSRF Protection
  CSRF: {
    enabled: true,
    tokenName: 'X-CSRF-Token',
    cookieName: 'csrf-token',
    cookieOptions: {
      secure: true,
      sameSite: 'strict',
      httpOnly: false
    }
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Authentication
  AUTH: {
    jwtSecret: process.env.VITE_JWT_SECRET,
    jwtExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    bcryptRounds: 12
  },
  
  // Data Protection
  DATA_PROTECTION: {
    encryption: {
      algorithm: 'AES-256-GCM',
      keyLength: 32
    },
    masking: {
      email: true,
      phone: true,
      ssn: true,
      creditCard: true
    },
    retention: {
      userAccounts: 'until_deletion',
      transactions: '7_years',
      analytics: '24_months',
      logs: '1_year'
    }
  },
  
  // Input Validation
  VALIDATION: {
    maxStringLength: 1000,
    allowedHtmlTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    allowedAttributes: ['class', 'id'],
    sanitizeInputs: true,
    validateOutputs: true
  },
  
  // File Upload Security
  FILE_UPLOAD: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ],
    scanForMalware: true,
    quarantineSuspicious: true
  },
  
  // Logging and Monitoring
  LOGGING: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    logToFile: process.env.NODE_ENV === 'production',
    logToConsole: process.env.NODE_ENV !== 'production',
    sanitizeLogs: true,
    excludeSensitiveData: true,
    auditLogRetention: '1_year'
  },
  
  // CORS Configuration
  CORS: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://accubooks.com', 'https://www.accubooks.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400
  },
  
  // Session Security
  SESSION: {
    timeout: 60 * 60 * 1000, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    rolling: true
  },
  
  // API Security
  API: {
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    validateStatus: true,
    sanitizeRequests: true,
    sanitizeResponses: true
  }
};

// Environment-specific security settings
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    ...SECURITY_CONFIG,
    LOGGING: {
      ...SECURITY_CONFIG.LOGGING,
      level: isProduction ? 'error' : 'debug',
      logToFile: isProduction,
      logToConsole: isDevelopment
    },
    SESSION: {
      ...SECURITY_CONFIG.SESSION,
      secure: isProduction
    },
    CORS: {
      ...SECURITY_CONFIG.CORS,
      origin: isProduction 
        ? ['https://accubooks.com', 'https://www.accubooks.com']
        : ['http://localhost:3000', 'http://localhost:5173']
    }
  };
};

export default SECURITY_CONFIG;