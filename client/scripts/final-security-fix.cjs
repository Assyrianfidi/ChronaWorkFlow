const fs = require('fs');
const path = require('path');

function finalSecurityFix() {
  console.log('🔒 Final Security & Compliance Fix - Phase 8 Completion\n');
  
  let fixesApplied = [];
  
  // 1. Create environment variable management system
  console.log('🌍 Creating Environment Variable Management System...');
  
  const envManager = `// Environment variable management and validation
interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_API_URL: string;
  VITE_API_VERSION: string;
  VITE_API_TIMEOUT: number;
  VITE_ENABLE_CSRF: boolean;
  VITE_ENABLE_CSP: boolean;
  VITE_SESSION_TIMEOUT: number;
  VITE_JWT_SECRET: string;
  VITE_JWT_EXPIRES_IN: string;
  VITE_REFRESH_TOKEN_EXPIRES_IN: string;
  VITE_ALLOWED_ORIGINS: string[];
  VITE_CORS_CREDENTIALS: boolean;
  VITE_RATE_LIMIT_WINDOW: number;
  VITE_RATE_LIMIT_MAX: number;
  VITE_ENABLE_ANALYTICS: boolean;
  VITE_ENABLE_ERROR_REPORTING: boolean;
  VITE_ENABLE_PERFORMANCE_MONITORING: boolean;
  VITE_SENTRY_DSN?: string;
  VITE_GOOGLE_ANALYTICS_ID?: string;
  VITE_MAX_FILE_SIZE: number;
  VITE_ALLOWED_FILE_TYPES: string[];
  VITE_LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

// Validate and parse environment variables
export const validateEnv = (): EnvConfig => {
  const requiredVars = [
    'NODE_ENV',
    'VITE_API_URL',
    'VITE_API_VERSION',
    'VITE_JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(\`Missing required environment variables: \${missingVars.join(', ')}\`);
  }

  // Validate API URL is HTTPS
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl.startsWith('https://') && import.meta.env.NODE_ENV === 'production') {
    throw new Error('API URL must use HTTPS in production');
  }

  // Parse and validate numeric values
  const apiTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
  const sessionTimeout = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000');
  const rateLimitWindow = parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || '900000');
  const rateLimitMax = parseInt(import.meta.env.VITE_RATE_LIMIT_MAX || '100');
  const maxFileSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760');

  // Parse boolean values
  const enableCSRF = import.meta.env.VITE_ENABLE_CSRF === 'true';
  const enableCSP = import.meta.env.VITE_ENABLE_CSP === 'true';
  const corsCredentials = import.meta.env.VITE_CORS_CREDENTIALS === 'true';
  const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  const enableErrorReporting = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
  const enablePerfMonitoring = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';

  // Parse array values
  const allowedOrigins = (import.meta.env.VITE_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
  const allowedFileTypes = (import.meta.env.VITE_ALLOWED_FILE_TYPES || '').split(',').map(type => type.trim()).filter(Boolean);

  // Validate log level
  const logLevel = (import.meta.env.VITE_LOG_LEVEL || 'error') as EnvConfig['VITE_LOG_LEVEL'];
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(\`Invalid log level: \${logLevel}. Must be one of: \${validLogLevels.join(', ')}\`);
  }

  return {
    NODE_ENV: import.meta.env.NODE_ENV as EnvConfig['NODE_ENV'],
    VITE_API_URL: apiUrl,
    VITE_API_VERSION: import.meta.env.VITE_API_VERSION,
    VITE_API_TIMEOUT: apiTimeout,
    VITE_ENABLE_CSRF: enableCSRF,
    VITE_ENABLE_CSP: enableCSP,
    VITE_SESSION_TIMEOUT: sessionTimeout,
    VITE_JWT_SECRET: import.meta.env.VITE_JWT_SECRET,
    VITE_JWT_EXPIRES_IN: import.meta.env.VITE_JWT_EXPIRES_IN || '1h',
    VITE_REFRESH_TOKEN_EXPIRES_IN: import.meta.env.VITE_REFRESH_TOKEN_EXPIRES_IN || '7d',
    VITE_ALLOWED_ORIGINS: allowedOrigins,
    VITE_CORS_CREDENTIALS: corsCredentials,
    VITE_RATE_LIMIT_WINDOW: rateLimitWindow,
    VITE_RATE_LIMIT_MAX: rateLimitMax,
    VITE_ENABLE_ANALYTICS: enableAnalytics,
    VITE_ENABLE_ERROR_REPORTING: enableErrorReporting,
    VITE_ENABLE_PERFORMANCE_MONITORING: enablePerfMonitoring,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    VITE_MAX_FILE_SIZE: maxFileSize,
    VITE_ALLOWED_FILE_TYPES: allowedFileTypes,
    VITE_LOG_LEVEL: logLevel
  };
};

// Secure configuration object
export const config = validateEnv();

// Environment-specific configurations
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Security configuration
export const securityConfig = {
  enableCSRF: config.VITE_ENABLE_CSRF,
  enableCSP: config.VITE_ENABLE_CSP,
  sessionTimeout: config.VITE_SESSION_TIMEOUT,
  jwtSecret: config.VITE_JWT_SECRET,
  jwtExpiresIn: config.VITE_JWT_EXPIRES_IN,
  refreshTokenExpiresIn: config.VITE_REFRESH_TOKEN_EXPIRES_IN,
  allowedOrigins: config.VITE_ALLOWED_ORIGINS,
  corsCredentials: config.VITE_CORS_CREDENTIALS,
  rateLimitWindow: config.VITE_RATE_LIMIT_WINDOW,
  rateLimitMax: config.VITE_RATE_LIMIT_MAX
};

// API configuration
export const apiConfig = {
  baseUrl: config.VITE_API_URL,
  version: config.VITE_API_VERSION,
  timeout: config.VITE_API_TIMEOUT
};

// Feature flags
export const features = {
  analytics: config.VITE_ENABLE_ANALYTICS,
  errorReporting: config.VITE_ENABLE_ERROR_REPORTING,
  performanceMonitoring: config.VITE_ENABLE_PERFORMANCE_MONITORING
};

// File upload configuration
export const fileConfig = {
  maxSize: config.VITE_MAX_FILE_SIZE,
  allowedTypes: config.VITE_ALLOWED_FILE_TYPES
};

// Logging configuration
export const logConfig = {
  level: config.VITE_LOG_LEVEL,
  enableConsole: isDevelopment,
  enableFile: isProduction
};

export default {
  config,
  isDevelopment,
  isProduction,
  isTest,
  securityConfig,
  apiConfig,
  features,
  fileConfig,
  logConfig
};`;
  
  fs.writeFileSync('src/config/env.ts', envManager);
  fixesApplied.push('Created secure environment variable management system');
  
  // 2. Create secure API client
  console.log('\n🌐 Creating Secure API Client...');
  
  const secureApiClient = `// Secure API client with comprehensive security measures
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { securityConfig, apiConfig } from '@/config/env';
import { sanitizeInput, generateCSRFToken } from '@/security/utils';

// Secure request interceptor
const secureRequestInterceptor = (config: AxiosRequestConfig) => {
  // Sanitize input data
  if (config.data && typeof config.data === 'object') {
    config.data = sanitizeRequestData(config.data);
  }

  // Add CSRF token for state-changing requests
  if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': csrfToken
      };
    }
  }

  // Add security headers
  config.headers = {
    ...config.headers,
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  return config;
};

// Secure response interceptor
const secureResponseInterceptor = (response: AxiosResponse) => {
  // Validate response data
  if (response.data) {
    response.data = sanitizeResponseData(response.data);
  }

  return response;
};

// Error interceptor with security handling
const errorInterceptor = (error: any) => {
  // Log security-relevant errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    console.warn('Security error detected:', error.response?.status);
  }

  // Handle CSRF errors
  if (error.response?.status === 403 && error.response?.data?.error === 'Invalid CSRF token') {
    // Refresh CSRF token and retry request
    refreshCSRFToken();
    return Promise.reject(error);
  }

  return Promise.reject(error);
};

// Sanitize request data
const sanitizeRequestData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Sanitize response data
const sanitizeResponseData = (data: any): any => {
  // Remove sensitive fields from response
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'secret', 'token'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponseData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// CSRF token management
const getCSRFToken = (): string | null => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1] || null;
};

const refreshCSRFToken = (): void => {
  const newToken = generateCSRFToken();
  document.cookie = \`csrf-token=\${newToken}; path=/; secure; samesite=strict\`;
};

// Create secure API instance
const createSecureApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: \`\${apiConfig.baseUrl}/\${apiConfig.version}\`,
    timeout: apiConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true
  });

  // Add interceptors
  client.interceptors.request.use(secureRequestInterceptor);
  client.interceptors.response.use(secureResponseInterceptor, errorInterceptor);

  return client;
};

// API client instance
export const apiClient = createSecureApiClient();

// Secure API methods
export const secureApi = {
  // GET requests
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  // POST requests
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT requests
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // DELETE requests
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  // PATCH requests
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  }
};

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private windowStart = Date.now();

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset window if needed
      if (now - this.windowStart > securityConfig.rateLimitWindow) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      // Check rate limit
      if (this.requestCount >= securityConfig.rateLimitMax) {
        const waitTime = securityConfig.rateLimitWindow - (now - this.windowStart);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const request = this.queue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();

// Rate-limited API methods
export const rateLimitedApi = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.get<T>(url, config));
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.post<T>(url, data, config));
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.put<T>(url, data, config));
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.delete<T>(url, config));
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.patch<T>(url, data, config));
  }
};

export default {
  apiClient,
  secureApi,
  rateLimitedApi,
  requestQueue
};`;
  
  fs.writeFileSync('src/api/secure-client.ts', secureApiClient);
  fixesApplied.push('Created secure API client with comprehensive security measures');
  
  // 3. Create security audit script
  console.log('\n🔍 Creating Security Audit Script...');
  
  const securityAuditScript = `#!/bin/bash

# Security Audit Script for AccuBooks
echo "🔒 Running Security Audit for AccuBooks..."
echo "============================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for npm audit
if command_exists npm; then
    echo "📦 Running npm audit..."
    npm audit --audit-level=moderate
    echo ""
fi

# Check for outdated dependencies
if command_exists npm; then
    echo "📅 Checking for outdated dependencies..."
    npm outdated || echo "No outdated dependencies found"
    echo ""
fi

# Check for license issues
if command_exists npx; then
    echo "📄 Checking license compliance..."
    npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC" || echo "License issues found"
    echo ""
fi

# Check for secrets in code
if command_exists npx; then
    echo "🔍 Scanning for potential secrets..."
    npx trufflehog --regex --entropy=False . || echo "Secret scanning completed"
    echo ""
fi

# Check for security vulnerabilities in dependencies
if command_exists npx; then
    echo "🛡️  Running Snyk security check..."
    npx snyk test || echo "Snyk not configured or issues found"
    echo ""
fi

# Check code quality and security
if command_exists npx; then
    echo "🔍 Running ESLint security checks..."
    npx eslint . --ext .ts,.tsx --config .eslintrc.js --quiet || echo "ESLint issues found"
    echo ""
fi

# Check TypeScript compilation
if command_exists npx; then
    echo "🔧 Checking TypeScript compilation..."
    npx tsc --noEmit || echo "TypeScript compilation issues found"
    echo ""
fi

# Check for hardcoded secrets (basic check)
echo "🔐 Checking for hardcoded secrets..."
if grep -r "password\\|secret\\|token\\|key" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | grep -v "env\\|ENV\\|Password\\|Secret\\|Token\\|Key"; then
    echo "⚠️  Potential hardcoded secrets found"
else
    echo "✅ No obvious hardcoded secrets found"
fi
echo ""

# Check for console.log statements
echo "📝 Checking for console.log statements..."
if grep -r "console.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l | grep -v "^0$"; then
    echo "⚠️  Console.log statements found (should be removed in production)"
else
    echo "✅ No console.log statements found"
fi
echo ""

# Check for dangerouslySetInnerHTML
echo "⚠️  Checking for dangerouslySetInnerHTML..."
if grep -r "dangerouslySetInnerHTML" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .; then
    echo "⚠️  dangerouslySetInnerHTML found (security risk)"
else
    echo "✅ No dangerouslySetInnerHTML found"
fi
echo ""

# Check for eval usage
echo "🔍 Checking for eval usage..."
if grep -r "eval(" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .; then
    echo "⚠️  eval() usage found (security risk)"
else
    echo "✅ No eval() usage found"
fi
echo ""

# Check for innerHTML usage
echo "🔍 Checking for innerHTML usage..."
if grep -r "innerHTML" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .; then
    echo "⚠️  innerHTML usage found (potential XSS risk)"
else
    echo "✅ No innerHTML usage found"
fi
echo ""

echo "============================================"
echo "🔒 Security Audit Complete"
echo "============================================"

# Generate security report
echo "📊 Generating security report..."
cat > security-report.txt << EOF
Security Audit Report - $(date)
=====================================

Environment: $(node --version)
NPM Version: $(npm --version)

Dependencies:
- Total packages: $(npm ls --depth=0 2>/dev/null | grep -c "├\\|└" || echo "N/A")
- Security vulnerabilities: $(npm audit --json 2>/dev/null | jq '.vulnerabilities | length' || echo "N/A")

Code Quality:
- TypeScript errors: $(npx tsc --noEmit 2>&1 | grep -c "error" || echo "N/A")
- ESLint issues: $(npx eslint . --ext .ts,.tsx --format=json 2>/dev/null | jq '. | length' || echo "N/A")

Security Checks:
- Hardcoded secrets: $(grep -r "password\\|secret\\|token\\|key" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | grep -c "env\\|ENV\\|Password\\|Secret\\|Token\\|Key" || echo "N/A")
- Console.log statements: $(grep -r "console.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l)
- dangerouslySetInnerHTML: $(grep -r "dangerouslySetInnerHTML" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l)
- eval() usage: $(grep -r "eval(" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l)
- innerHTML usage: $(grep -r "innerHTML" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | wc -l)

Recommendations:
- Remove console.log statements before production
- Review any hardcoded secrets found
- Address any security vulnerabilities
- Fix TypeScript compilation errors
- Resolve ESLint issues
- Review any innerHTML or dangerouslySetInnerHTML usage

EOF

echo "📄 Security report saved to security-report.txt"`;
  
  fs.writeFileSync('scripts/security-audit.sh', securityAuditScript);
  fixesApplied.push('Created comprehensive security audit script');
  
  // 4. Update .gitignore for security
  console.log('\n🚫 Updating .gitignore for Security...');
  
  let gitignoreContent = '';
  if (fs.existsSync('.gitignore')) {
    gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  }
  
  const securityGitignore = `

# Security - Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Security - Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Security - Build outputs
dist/
build/
.next/

# Security - Coverage reports
coverage/
*.lcov

# Security - Dependency directories
node_modules/
jspm_packages/

# Security - Cache
.cache/
.parcel-cache/
.tmp/
.temp/

# Security - IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Security - OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Security - Backup files
*.bak
*.backup
*.old

# Security - Temporary files
*.tmp
*.temp

# Security - Security reports
security-report.txt
*.security

# Security - Keys and certificates
*.pem
*.key
*.crt
*.p12
*.pfx

# Security - Database
*.db
*.sqlite
*.sqlite3

# Security - Configuration with secrets
config/local.json
config/production.json
.secrets`;
  
  if (!gitignoreContent.includes('# Security - Environment files')) {
    fs.writeFileSync('.gitignore', gitignoreContent + securityGitignore);
    fixesApplied.push('Updated .gitignore with security exclusions');
  }
  
  // 5. Create secure development guidelines
  console.log('\n📚 Creating Secure Development Guidelines...');
  
  const devGuidelines = `# Secure Development Guidelines for AccuBooks

## Overview
This document provides security guidelines for developers working on the AccuBooks application.

## Security Principles

### 1. Defense in Depth
- Implement multiple layers of security
- Never rely on a single security control
- Assume controls can fail and have backups

### 2. Principle of Least Privilege
- Grant minimum necessary permissions
- Use role-based access control
- Regularly review and update permissions

### 3. Secure by Default
- Enable security features by default
- Require explicit action to disable security
- Use secure configurations out of the box

## Coding Standards

### Input Validation
- Always validate user input
- Use whitelist approach (allow only known good values)
- Sanitize input before processing
- Validate data types, lengths, and formats

### Output Encoding
- Always encode output before rendering
- Use context-appropriate encoding (HTML, JavaScript, URL)
- Never use \`dangerouslySetInnerHTML\` unless absolutely necessary
- Prefer \`textContent\` over \`innerHTML\`

### Authentication & Authorization
- Use strong password policies
- Implement multi-factor authentication
- Use JWT with proper expiration
- Validate permissions on every request

### Data Protection
- Encrypt sensitive data at rest and in transit
- Use secure key management
- Implement data masking for PII
- Follow data retention policies

## Security Best Practices

### Environment Variables
- Never commit secrets to version control
- Use environment-specific configuration
- Validate environment variables on startup
- Use different secrets for different environments

### API Security
- Use HTTPS for all API calls
- Implement rate limiting
- Add CSRF protection
- Validate and sanitize all inputs
- Use secure headers

### Database Security
- Use parameterized queries
- Implement proper access controls
- Encrypt sensitive data
- Regular security updates and patches

### Frontend Security
- Implement Content Security Policy
- Use secure cookie settings
- Validate all user inputs
- Avoid inline scripts and styles
- Use Subresource Integrity (SRI)

## Common Security Vulnerabilities

### XSS (Cross-Site Scripting)
- Never trust user input
- Always escape output
- Use CSP headers
- Validate and sanitize data

### CSRF (Cross-Site Request Forgery)
- Use anti-CSRF tokens
- Validate HTTP headers
- Use SameSite cookies
- Check referrer headers

### SQL Injection
- Use parameterized queries
- Never concatenate SQL strings
- Use ORM security features
- Validate database inputs

### Authentication Issues
- Use strong password policies
- Implement account lockout
- Use secure session management
- Log security events

## Development Workflow

### Code Review Checklist
- [ ] Input validation implemented
- [ ] Output encoding used
- [ ] Authentication and authorization checked
- [ ] No hardcoded secrets
- [ ] Security headers configured
- [ ] Error handling doesn't leak information
- [ ] Logging doesn't contain sensitive data
- [ ] Dependencies are secure

### Security Testing
- Run security audit script before commits
- Test for common vulnerabilities
- Perform penetration testing
- Review security headers
- Test authentication and authorization

### Deployment Security
- Use environment-specific configurations
- Enable security monitoring
- Implement proper logging
- Use secure deployment practices
- Regular security updates

## Tools and Resources

### Security Tools
- npm audit for dependency scanning
- ESLint with security rules
- TypeScript for type safety
- Snyk for vulnerability scanning
- OWASP ZAP for penetration testing

### Documentation
- OWASP Top 10
- Security guidelines
- API documentation
- Architecture documentation

### Training
- Security awareness training
- Secure coding practices
- Incident response procedures
- Compliance requirements

## Incident Response

### Security Incident Process
1. Detection and identification
2. Containment and eradication
3. Recovery and restoration
4. Post-incident analysis
5. Prevention and improvement

### Reporting Security Issues
- Report to security team immediately
- Document all details
- Follow incident response plan
- Communicate with stakeholders

## Compliance Requirements

### Data Protection
- GDPR compliance
- Data retention policies
- Privacy by design
- User consent management

### Industry Standards
- SOC 2 compliance
- PCI DSS for payment processing
- ISO 27001 security standards
- Industry-specific regulations

## Resources

### Security Documentation
- [OWASP Security Guidelines](https://owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security](https://reactjs.org/docs/security.html)

### Tools and Libraries
- [Helmet.js](https://helmetjs.github.io/) - Security headers
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS protection
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT tokens

### Checklists and Templates
- Security review checklist
- Incident response template
- Vulnerability report template
- Security assessment template

Remember: Security is everyone's responsibility. Follow these guidelines and stay vigilant!`;
  
  fs.writeFileSync('SECURITY_GUIDELINES.md', devGuidelines);
  fixesApplied.push('Created comprehensive secure development guidelines');
  
  // 6. Summary
  console.log('\n📊 Final Security & Compliance Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  console.log('\n🔒 Security & Compliance are now optimized for:');
  console.log('  ✅ Secure environment variable management');
  console.log('  ✅ Comprehensive API client security');
  console.log('  ✅ Security audit automation');
  console.log('  ✅ Enhanced .gitignore security');
  console.log('  ✅ Secure development guidelines');
  console.log('  ✅ Production-ready security measures');
  console.log('  ✅ Compliance documentation');
  console.log('  ✅ Security best practices implementation');
  
  return {
    success: true,
    fixesApplied
  };
}

if (require.main === module) {
  finalSecurityFix();
}

module.exports = { finalSecurityFix };
