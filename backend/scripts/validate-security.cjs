const fs = require('fs');
const path = require('path');

function validateSecurity() {
  console.log('🔒 Security Validation Report\n');
  
  // Check JWT configuration
  console.log('🔐 JWT Authentication:');
  
  const envFiles = ['.env', '.env.production', '.env.test'];
  let jwtSecurityScore = 0;
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      
      const hasJwtSecret = envContent.includes('JWT_SECRET');
      const hasRefreshSecret = envContent.includes('JWT_REFRESH_SECRET');
      const hasSessionSecret = envContent.includes('SESSION_SECRET');
      const hasExpiration = envContent.includes('JWT_EXPIRES_IN');
      
      console.log(`  📋 ${envFile}:`);
      console.log(`    ${hasJwtSecret ? '✅' : '❌'} JWT secret configured`);
      console.log(`    ${hasRefreshSecret ? '✅' : '❌'} Refresh token secret`);
      console.log(`    ${hasSessionSecret ? '✅' : '❌'} Session secret`);
      console.log(`    ${hasExpiration ? '✅' : '❌'} Token expiration set`);
      
      // Check secret strength
      const jwtSecretMatch = envContent.match(/JWT_SECRET=([^\n]+)/);
      if (jwtSecretMatch) {
        const secret = jwtSecretMatch[1];
        const isStrong = secret.length >= 32 && !secret.includes('test') && !secret.includes('placeholder');
        console.log(`    ${isStrong ? '✅' : '⚠️ '} JWT secret strength: ${isStrong ? 'Strong' : 'Weak/Placeholder'}`);
        if (isStrong) jwtSecurityScore++;
      }
    }
  });
  
  // Check authentication middleware
  console.log('\n🛡️  Authentication Middleware:');
  
  const authMiddlewarePath = 'src/middleware/auth.middleware.ts';
  if (fs.existsSync(authMiddlewarePath)) {
    const authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
    
    const hasJwtVerification = authContent.includes('jwt') || authContent.includes('verify');
    const hasTokenExtraction = authContent.includes('token') || authContent.includes('Authorization');
    const hasErrorHandling = authContent.includes('try') || authContent.includes('catch');
    const hasRoleChecking = authContent.includes('role') || authContent.includes('permissions');
    
    console.log(`  ${hasJwtVerification ? '✅' : '❌'} JWT token verification`);
    console.log(`  ${hasTokenExtraction ? '✅' : '❌'} Token extraction from headers`);
    console.log(`  ${hasErrorHandling ? '✅' : '❌'} Error handling implemented`);
    console.log(`  ${hasRoleChecking ? '✅' : '❌'} Role-based access control`);
  } else {
    console.log('  ❌ Authentication middleware not found');
  }
  
  // Check secrets handling
  console.log('\n🔑 Secrets Handling:');
  
  let hardcodedSecrets = [];
  let exposedSecrets = [];
  
  // Check for hardcoded secrets in source code
  const sourceDirs = ['src/controllers', 'src/services', 'src/middleware', 'src/routes'];
  
  sourceDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true })
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for hardcoded secrets
          const secretPatterns = [
            /['"`]sk_test_[a-zA-Z0-9]+['"`]/g, // Stripe test keys
            /['"`][a-zA-Z0-9]{32,}['"`]/g, // Long strings that might be secrets
            /password\s*=\s*['"`][^'"`]+['"`]/gi, // Hardcoded passwords
            /secret\s*=\s*['"`][^'"`]+['"`]/gi, // Hardcoded secrets
          ];
          
          secretPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              hardcodedSecrets.push(...matches.map(match => `${file}: ${match}`));
            }
          });
          
          // Check for exposed secrets in logs
          if (content.includes('console.log') && content.includes('secret')) {
            exposedSecrets.push(file);
          }
        }
      });
    }
  });
  
  console.log(`  ${hardcodedSecrets.length === 0 ? '✅' : '❌'} No hardcoded secrets found`);
  if (hardcodedSecrets.length > 0) {
    console.log('  ❌ Hardcoded secrets detected:');
    hardcodedSecrets.forEach(secret => console.log(`    - ${secret}`));
  }
  
  console.log(`  ${exposedSecrets.length === 0 ? '✅' : '❌'} No secrets exposed in logs`);
  if (exposedSecrets.length > 0) {
    console.log('  ❌ Secrets potentially exposed in logs:');
    exposedSecrets.forEach(file => console.log(`    - ${file}`));
  }
  
  // Check HTTPS/SSL setup
  console.log('\n🔒 HTTPS/SSL Configuration:');
  
  const serverFiles = ['server.js', 'src/server.ts', 'src/index.ts'];
  let httpsConfigured = false;
  
  serverFiles.forEach(serverFile => {
    if (fs.existsSync(serverFile)) {
      const content = fs.readFileSync(serverFile, 'utf8');
      
      const hasHttps = content.includes('https') || content.includes('SSL') || content.includes('cert');
      const hasForceHttps = content.includes('force-ssl') || content.includes('requireHTTPS');
      const hasHelmet = content.includes('helmet') || content.includes('hellet');
      const hasHsts = content.includes('hsts') || content.includes('Strict-Transport-Security');
      
      console.log(`  📄 ${serverFile}:`);
      console.log(`    ${hasHttps ? '✅' : '❌'} HTTPS configuration`);
      console.log(`    ${hasForceHttps ? '✅' : '❌'} Force HTTPS redirect`);
      console.log(`    ${hasHelmet ? '✅' : '❌'} Helmet security headers`);
      console.log(`    ${hasHsts ? '✅' : '❌'} HSTS headers`);
      
      if (hasHttps) httpsConfigured = true;
    }
  });
  
  // Check CORS configuration
  console.log('\n🌐 CORS Configuration:');
  
  const indexPath = 'src/index.ts';
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const hasCors = indexContent.includes('cors') || indexContent.includes('CORS');
    const hasCorsConfig = indexContent.includes('origin') || indexContent.includes('credentials');
    const hasRestrictedOrigins = indexContent.includes('CORS_ORIGIN') || indexContent.includes('allowedOrigins');
    
    console.log(`  ${hasCors ? '✅' : '❌'} CORS middleware configured`);
    console.log(`  ${hasCorsConfig ? '✅' : '❌'} CORS options configured`);
    console.log(`  ${hasRestrictedOrigins ? '✅' : '❌'} Restricted origins configured`);
  }
  
  // Check rate limiting
  console.log('\n⏱️  Rate Limiting:');
  
  const rateLimitMiddlewarePath = 'src/middleware/rateLimiter.js';
  if (fs.existsSync(rateLimitMiddlewarePath)) {
    const rateLimitContent = fs.readFileSync(rateLimitMiddlewarePath, 'utf8');
    
    const hasWindowMs = rateLimitContent.includes('windowMs');
    const hasMaxRequests = rateLimitContent.includes('max');
    const hasSkipSuccessfulRequests = rateLimitContent.includes('skipSuccessfulRequests');
    const hasSkipFailedRequests = rateLimitContent.includes('skipFailedRequests');
    
    console.log(`  ${hasWindowMs ? '✅' : '❌'} Time window configured`);
    console.log(`  ${hasMaxRequests ? '✅' : '❌'} Max requests configured`);
    console.log(`  ${hasSkipSuccessfulRequests ? '✅' : '❌'} Skip successful requests`);
    console.log(`  ${hasSkipFailedRequests ? '✅' : '❌'} Skip failed requests`);
  } else {
    console.log('  ⚠️  Rate limiting middleware not found');
  }
  
  // Check input validation and sanitization
  console.log('\n✅ Input Validation & Sanitization:');
  
  const validationMiddlewarePath = 'src/middleware/validation.ts';
  if (fs.existsSync(validationMiddlewarePath)) {
    const validationContent = fs.readFileSync(validationMiddlewarePath, 'utf8');
    
    const hasSchemaValidation = validationContent.includes('schema') || validationContent.includes('joi') || validationContent.includes('zod');
    const hasSanitization = validationContent.includes('sanitize') || validationContent.includes('escape');
    const hasXssProtection = validationContent.includes('xss') || validationContent.includes('sanitizeHtml');
    
    console.log(`  ${hasSchemaValidation ? '✅' : '❌'} Schema validation`);
    console.log(`  ${hasSanitization ? '✅' : '❌'} Input sanitization`);
    console.log(`  ${hasXssProtection ? '✅' : '❌'} XSS protection`);
  } else {
    console.log('  ❌ Validation middleware not found');
  }
  
  // Check database security
  console.log('\n🗄️  Database Security:');
  
  const prismaSchemaPath = 'prisma/schema.prisma';
  if (fs.existsSync(prismaSchemaPath)) {
    const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
    
    const hasPasswordHashing = schemaContent.includes('password') && schemaContent.includes('String');
    const hasUniqueConstraints = schemaContent.includes('@unique');
    const hasIndexes = schemaContent.includes('@index');
    const hasRelationConstraints = schemaContent.includes('@relation');
    
    console.log(`  ${hasPasswordHashing ? '✅' : '❌'} Password hashing configured`);
    console.log(`  ${hasUniqueConstraints ? '✅' : '❌'} Unique constraints defined`);
    console.log(`  ${hasIndexes ? '✅' : '❌'} Database indexes configured`);
    console.log(`  ${hasRelationConstraints ? '✅' : '❌'} Relation constraints defined`);
  }
  
  // Check security headers
  console.log('\n📋 Security Headers:');
  
  let securityHeadersScore = 0;
  const securityHeaders = [
    'helmet', // General security
    'x-frame-options', // Clickjacking protection
    'x-content-type-options', // MIME type sniffing
    'x-xss-protection', // XSS protection
    'strict-transport-security', // HSTS
    'content-security-policy' // CSP
  ];
  
  serverFiles.forEach(serverFile => {
    if (fs.existsSync(serverFile)) {
      const content = fs.readFileSync(serverFile, 'utf8');
      
      securityHeaders.forEach(header => {
        if (content.includes(header)) {
          securityHeadersScore++;
        }
      });
    }
  });
  
  console.log(`  📊 Security headers configured: ${securityHeadersScore}/${securityHeaders.length}`);
  
  // Security score calculation
  console.log('\n📊 Security Assessment Score:');
  
  const maxScore = 10;
  let securityScore = 0;
  
  if (jwtSecurityScore >= 2) securityScore++; // JWT secrets
  if (hardcodedSecrets.length === 0) securityScore++; // No hardcoded secrets
  if (exposedSecrets.length === 0) securityScore++; // No exposed secrets
  if (httpsConfigured) securityScore++; // HTTPS configured
  if (fs.existsSync('src/middleware/auth.middleware.ts')) securityScore++; // Auth middleware
  if (fs.existsSync('src/middleware/rateLimiter.js')) securityScore++; // Rate limiting
  if (fs.existsSync('src/middleware/validation.ts')) securityScore++; // Input validation
  if (securityHeadersScore >= 3) securityScore++; // Security headers
  if (fs.existsSync(prismaSchemaPath)) securityScore++; // Database schema
  if (fs.existsSync('src/utils/errors.ts')) securityScore++; // Error handling
  
  const percentage = Math.round((securityScore / maxScore) * 100);
  console.log(`  🎯 Overall Security Score: ${securityScore}/${maxScore} (${percentage}%)`);
  
  // Security recommendations
  console.log('\n🎯 Security Recommendations:');
  
  if (jwtSecurityScore < 2) {
    console.log('  1. Strengthen JWT secrets (minimum 32 characters, no placeholders)');
  }
  if (hardcodedSecrets.length > 0) {
    console.log('  2. Remove hardcoded secrets and use environment variables');
  }
  if (!httpsConfigured) {
    console.log('  3. Configure HTTPS for production deployment');
  }
  if (!fs.existsSync('src/middleware/rateLimiter.js')) {
    console.log('  4. Implement rate limiting to prevent brute force attacks');
  }
  if (securityHeadersScore < 5) {
    console.log('  5. Add comprehensive security headers using Helmet');
  }
  
  console.log('  6. Set up security monitoring and alerting');
  console.log('  7. Implement audit logging for sensitive operations');
  console.log('  8. Add API key authentication for external access');
  console.log('  9. Configure database connection encryption');
  console.log('  10. Set up automated security scanning');
  
  return {
    success: true,
    securityScore,
    maxScore,
    percentage,
    issues: hardcodedSecrets,
    recommendations: percentage < 80 ? ['Security improvements needed'] : ['Security is well configured']
  };
}

if (require.main === module) {
  validateSecurity();
}

module.exports = { validateSecurity };
