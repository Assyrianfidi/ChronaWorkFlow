// Comprehensive security utilities and components index

// Security utilities
export { 
  sanitizeHTML, 
  sanitizeInput, 
  escapeHtml,
  generateCSRFToken,
  validateCSRFToken,
  maskEmail,
  maskPhone,
  maskSSN,
  maskCreditCard,
  isValidURL,
  sanitizeFileName,
  securityHeaders,
  cspHeaders,
  rateLimiter
} from '@/security/utils';

// Security configuration
export { 
  SECURITY_CONFIG,
  getSecurityConfig 
} from '@/config/security';

export { 
  ENHANCED_SECURITY_CONFIG,
  getEnhancedSecurityConfig 
} from '@/config/enhanced-security';

// Environment configuration
export {
  config,
  isDevelopment,
  isProduction,
  isTest,
  securityConfig,
  apiConfig,
  features,
  fileConfig,
  logConfig
} from '@/config/env';

// Secure logging
export {
  logger,
  log
} from '@/utils/logger';

// Secure API client
export {
  apiClient,
  secureApi,
  rateLimitedApi,
  requestQueue
} from '@/api/secure-client';

// Security components
export {
  SecureHTML,
  SecureInput,
  SecureForm,
  SecureLink,
  SecureImage
} from '@/components/security';

export {
  CookieConsent
} from '@/components/security/CookieConsent';

// Security middleware
export {
  rateLimitMiddleware,
  csrfMiddleware,
  securityHeadersMiddleware,
  inputValidationMiddleware,
  authMiddleware,
  corsMiddleware,
  securityMiddleware
} from '@/security/middleware';

// Security types
export type { EnvConfig } from '@/config/env';
export type { LogEntry } from '@/utils/logger';

// Security constants
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'", "data:"],
  'connect-src': ["'self'", "https://api.accubooks.com"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

export default {
  // Utilities
  sanitizeHTML,
  sanitizeInput,
  escapeHtml,
  generateCSRFToken,
  validateCSRFToken,
  maskEmail,
  maskPhone,
  maskSSN,
  maskCreditCard,
  isValidURL,
  sanitizeFileName,
  
  // Configuration
  SECURITY_CONFIG,
  ENHANCED_SECURITY_CONFIG,
  config,
  securityConfig,
  
  // Logging
  logger,
  log,
  
  // API
  apiClient,
  secureApi,
  rateLimitedApi,
  
  // Components
  SecureHTML,
  SecureInput,
  SecureForm,
  SecureLink,
  SecureImage,
  CookieConsent,
  
  // Middleware
  securityMiddleware,
  
  // Constants
  SECURITY_HEADERS,
  CSP_DIRECTIVES
};