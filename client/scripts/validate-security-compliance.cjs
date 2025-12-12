const fs = require('fs');
const path = require('path');

function validateSecurityCompliance() {
  console.log('🔒 Phase 8: Security & Compliance Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check for XSS vulnerabilities
  console.log('🛡️  XSS Protection Analysis:');
  
  const sourceFiles = getSourceFiles('src');
  let xssProtection = 0;
  let inputSanitization = 0;
  let contentSecurityPolicy = 0;
  let dangerousMethods = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for XSS protection measures
      if (content.includes('dangerouslySetInnerHTML')) {
        dangerousMethods++;
      }
      
      if (content.includes('sanitize') || content.includes('DOMPurify') || content.includes('xss')) {
        xssProtection++;
      }
      
      if (content.includes('textContent') || content.includes('innerText')) {
        inputSanitization++;
      }
      
      if (content.includes('Content-Security-Policy') || content.includes('CSP')) {
        contentSecurityPolicy++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛡️  XSS protection: ${xssProtection} files`);
  console.log(`  🧹 Input sanitization: ${inputSanitization} files`);
  console.log(`  📋 Content Security Policy: ${contentSecurityPolicy} files`);
  console.log(`  ⚠️  Dangerous methods: ${dangerousMethods} files`);
  
  if (dangerousMethods === 0 && (xssProtection >= 2 || inputSanitization >= 5)) {
    score++;
    console.log('  ✅ XSS protection is well implemented');
  } else {
    console.log('  ❌ XSS protection needs improvement');
    if (dangerousMethods > 0) {
      issues.push('Potentially dangerous methods found (dangerouslySetInnerHTML)');
    }
    if (xssProtection < 2) {
      issues.push('Insufficient XSS protection measures');
    }
  }
  
  // 2. Check for CSRF protection
  console.log('\n🔄 CSRF Protection Analysis:');
  
  let csrfTokens = 0;
  let sameSiteCookies = 0;
  let originChecks = 0;
  let antiCsrfMiddleware = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('csrf') || content.includes('CSRF')) {
        csrfTokens++;
      }
      
      if (content.includes('SameSite') || content.includes('sameSite')) {
        sameSiteCookies++;
      }
      
      if (content.includes('Origin') || content.includes('Referer')) {
        originChecks++;
      }
      
      if (content.includes('anti-csrf') || content.includes('csrfProtection')) {
        antiCsrfMiddleware++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🎫 CSRF tokens: ${csrfTokens} files`);
  console.log(`  🍪 SameSite cookies: ${sameSiteCookies} files`);
  console.log(`  🔍 Origin checks: ${originChecks} files`);
  console.log(`  🛡️  Anti-CSRF middleware: ${antiCsrfMiddleware} files`);
  
  if (csrfTokens >= 1 || sameSiteCookies >= 1) {
    score++;
    console.log('  ✅ CSRF protection is implemented');
  } else {
    console.log('  ❌ CSRF protection needs improvement');
    issues.push('CSRF protection not properly implemented');
  }
  
  // 3. Check for hardcoded secrets
  console.log('\n🔐 Hardcoded Secrets Analysis:');
  
  let apiKeys = 0;
  let passwords = 0;
  let tokens = 0;
  let secrets = 0;
  let envVariables = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hardcoded secrets patterns
      if (content.includes('API_KEY') || content.includes('api_key') || content.includes('apikey')) {
        if (!content.includes('import.meta.env') && !content.includes('process.env')) {
          apiKeys++;
        }
      }
      
      if (content.includes('password') && content.includes('=')) {
        if (!content.includes('env') && !content.includes('Password')) {
          passwords++;
        }
      }
      
      if (content.includes('token') && content.includes('=')) {
        if (!content.includes('env') && !content.includes('Token')) {
          tokens++;
        }
      }
      
      if (content.includes('secret') && content.includes('=')) {
        if (!content.includes('env') && !content.includes('Secret')) {
          secrets++;
        }
      }
      
      if (content.includes('import.meta.env') || content.includes('process.env')) {
        envVariables++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔑 API keys: ${apiKeys} potential hardcoded values`);
  console.log(`  🔒 Passwords: ${passwords} potential hardcoded values`);
  console.log(`  🎫 Tokens: ${tokens} potential hardcoded values`);
  console.log(`  🔐 Secrets: ${secrets} potential hardcoded values`);
  console.log(`  🌍 Environment variables: ${envVariables} files`);
  
  if (apiKeys === 0 && passwords === 0 && tokens === 0 && secrets === 0 && envVariables >= 5) {
    score++;
    console.log('  ✅ No hardcoded secrets found');
  } else {
    console.log('  ❌ Potential hardcoded secrets detected');
    if (apiKeys > 0) issues.push('Potential hardcoded API keys found');
    if (passwords > 0) issues.push('Potential hardcoded passwords found');
    if (tokens > 0) issues.push('Potential hardcoded tokens found');
    if (secrets > 0) issues.push('Potential hardcoded secrets found');
  }
  
  // 4. Check HTTPS usage
  console.log('\n🌐 HTTPS Usage Analysis:');
  
  let httpsUrls = 0;
  let httpUrls = 0;
  let mixedContent = 0;
  let secureCookies = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for HTTP vs HTTPS URLs
      const httpsMatches = content.match(/https:\/\/[^\s"']+/g) || [];
      const httpMatches = content.match(/http:\/\/[^\s"']+/g) || [];
      
      httpsUrls += httpsMatches.length;
      httpUrls += httpMatches.length;
      
      // Check for secure cookies
      if (content.includes('Secure') || content.includes('secure')) {
        secureCookies++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔒 HTTPS URLs: ${httpsUrls}`);
  console.log(`  🌐 HTTP URLs: ${httpUrls}`);
  console.log(`  🍪 Secure cookies: ${secureCookies} files`);
  
  if (httpUrls === 0 && httpsUrls >= 3) {
    score++;
    console.log('  ✅ HTTPS is properly used');
  } else {
    console.log('  ❌ HTTPS usage needs improvement');
    if (httpUrls > 0) {
      issues.push('Non-HTTPS URLs found');
    }
    if (httpsUrls < 3) {
      issues.push('Insufficient HTTPS usage');
    }
  }
  
  // 5. Check sensitive data exposure
  console.log('\n🔍 Sensitive Data Exposure Analysis:');
  
  let piiData = 0;
  let consoleLogging = 0;
  let errorDetails = 0;
  let dataMasking = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for PII data exposure
      if (content.includes('ssn') || content.includes('socialSecurity') || content.includes('creditCard')) {
        if (!content.includes('mask') && !content.includes('redact')) {
          piiData++;
        }
      }
      
      if (content.includes('console.log') || content.includes('console.error')) {
        consoleLogging++;
      }
      
      if (content.includes('stack') || content.includes('error.details')) {
        errorDetails++;
      }
      
      if (content.includes('mask') || content.includes('redact') || content.includes('sanitize')) {
        dataMasking++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🆔 PII data exposure: ${piiData} potential issues`);
  console.log(`  📝 Console logging: ${consoleLogging} files`);
  console.log(`  🚨 Error details exposure: ${errorDetails} files`);
  console.log(`  🎭 Data masking: ${dataMasking} files`);
  
  if (piiData === 0 && consoleLogging <= 10 && dataMasking >= 2) {
    score++;
    console.log('  ✅ Sensitive data is properly protected');
  } else {
    console.log('  ❌ Sensitive data protection needs improvement');
    if (piiData > 0) issues.push('Potential PII data exposure');
    if (consoleLogging > 10) issues.push('Excessive console logging found');
    if (dataMasking < 2) issues.push('Insufficient data masking');
  }
  
  // 6. Check authentication and authorization
  console.log('\n🔑 Authentication & Authorization Analysis:');
  
  let authMiddleware = 0;
  let jwtTokens = 0;
  let roleBasedAccess = 0;
  let sessionManagement = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('auth') || content.includes('Auth')) {
        authMiddleware++;
      }
      
      if (content.includes('jwt') || content.includes('JWT')) {
        jwtTokens++;
      }
      
      if (content.includes('role') && content.includes('access')) {
        roleBasedAccess++;
      }
      
      if (content.includes('session') || content.includes('Session')) {
        sessionManagement++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛡️  Authentication middleware: ${authMiddleware} files`);
  console.log(`  🎫 JWT tokens: ${jwtTokens} files`);
  console.log(`  👥 Role-based access: ${roleBasedAccess} files`);
  console.log(`  🔄 Session management: ${sessionManagement} files`);
  
  if (authMiddleware >= 5 && jwtTokens >= 2) {
    score++;
    console.log('  ✅ Authentication is well implemented');
  } else {
    console.log('  ❌ Authentication needs improvement');
    if (authMiddleware < 5) issues.push('Insufficient authentication middleware');
    if (jwtTokens < 2) issues.push('JWT token implementation needed');
  }
  
  // 7. Check input validation
  console.log('\n✅ Input Validation Analysis:');
  
  let validationSchemas = 0;
  let typeChecking = 0;
  let inputSanitizers = 0;
  let sqlInjectionProtection = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('validation') || content.includes('schema')) {
        validationSchemas++;
      }
      
      if (content.includes('typeof') || content.includes('instanceof')) {
        typeChecking++;
      }
      
      if (content.includes('sanitize') || content.includes('escape')) {
        inputSanitizers++;
      }
      
      if (content.includes('parameterized') || content.includes('prepared') || content.includes('escape')) {
        sqlInjectionProtection++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📋 Validation schemas: ${validationSchemas} files`);
  console.log(`  🔍 Type checking: ${typeChecking} files`);
  console.log(`  🧹 Input sanitizers: ${inputSanitizers} files`);
  console.log(`  🗄️  SQL injection protection: ${sqlInjectionProtection} files`);
  
  if (validationSchemas >= 5 && typeChecking >= 10) {
    score++;
    console.log('  ✅ Input validation is well implemented');
  } else {
    console.log('  ❌ Input validation needs improvement');
    if (validationSchemas < 5) issues.push('Insufficient validation schemas');
    if (typeChecking < 10) issues.push('Insufficient type checking');
  }
  
  // 8. Check security headers
  console.log('\n📋 Security Headers Analysis:');
  
  let securityHeaders = 0;
  let corsConfig = 0;
  let rateLimiting = 0;
  let helmetUsage = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('X-Frame-Options') || content.includes('X-Content-Type-Options') || 
          content.includes('X-XSS-Protection') || content.includes('Strict-Transport-Security')) {
        securityHeaders++;
      }
      
      if (content.includes('cors') || content.includes('CORS')) {
        corsConfig++;
      }
      
      if (content.includes('rateLimit') || content.includes('rate-limit')) {
        rateLimiting++;
      }
      
      if (content.includes('helmet') || content.includes('Helmet')) {
        helmetUsage++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛡️  Security headers: ${securityHeaders} files`);
  console.log(`  🌐 CORS configuration: ${corsConfig} files`);
  console.log(`  ⏱️  Rate limiting: ${rateLimiting} files`);
  console.log(`  🪖 Helmet usage: ${helmetUsage} files`);
  
  if (securityHeaders >= 2 || helmetUsage >= 1) {
    score++;
    console.log('  ✅ Security headers are implemented');
  } else {
    console.log('  ❌ Security headers need improvement');
    issues.push('Security headers not properly implemented');
  }
  
  // 9. Check dependency security
  console.log('\n📦 Dependency Security Analysis:');
  
  let packageLockFound = false;
  let auditScripts = 0;
  let outdatedDeps = 0;
  let securityScripts = 0;
  
  if (fs.existsSync('package-lock.json')) {
    packageLockFound = true;
  }
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts?.audit) {
      auditScripts++;
    }
    
    if (packageJson.scripts?.security || packageJson.scripts?.['security-check']) {
      securityScripts++;
    }
    
    if (packageJson.scripts?.outdated) {
      outdatedDeps++;
    }
  }
  
  console.log(`  🔒 Package lock found: ${packageLockFound ? 'Yes' : 'No'}`);
  console.log(`  🔍 Audit scripts: ${auditScripts}`);
  console.log(`  📅 Outdated dependency scripts: ${outdatedDeps}`);
  console.log(`  🛡️  Security scripts: ${securityScripts}`);
  
  if (packageLockFound && auditScripts >= 1) {
    score++;
    console.log('  ✅ Dependency security is managed');
  } else {
    console.log('  ❌ Dependency security needs improvement');
    if (!packageLockFound) issues.push('Package lock file not found');
    if (auditScripts < 1) issues.push('Security audit script not found');
  }
  
  // 10. Check compliance and privacy
  console.log('\n📋 Compliance & Privacy Analysis:');
  
  let gdprCompliance = 0;
  let privacyPolicy = 0;
  let dataRetention = 0;
  let cookieConsent = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('gdpr') || content.includes('GDPR') || content.includes('privacy')) {
        gdprCompliance++;
      }
      
      if (content.includes('privacy-policy') || content.includes('PrivacyPolicy')) {
        privacyPolicy++;
      }
      
      if (content.includes('retention') || content.includes('data-retention')) {
        dataRetention++;
      }
      
      if (content.includes('cookie') && content.includes('consent')) {
        cookieConsent++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🇪🇺 GDPR compliance: ${gdprCompliance} files`);
  console.log(`  📄 Privacy policy: ${privacyPolicy} files`);
  console.log(`  📅 Data retention: ${dataRetention} files`);
  console.log(`  🍪 Cookie consent: ${cookieConsent} files`);
  
  if (gdprCompliance >= 1 || privacyPolicy >= 1) {
    score++;
    console.log('  ✅ Compliance measures are implemented');
  } else {
    console.log('  ❌ Compliance measures need improvement');
    issues.push('Privacy and compliance measures not implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 8 Results:');
  console.log(`  🎯 Security & Compliance Score: ${score}/${maxScore} (${percentage}%)`);
  console.log(`  🔧 Fixes Available: ${fixes.length}`);
  console.log(`  ⚠️  Issues Found: ${issues.length}`);
  
  if (fixes.length > 0) {
    console.log('\n✅ Automatic Fixes Available:');
    fixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Manual Issues Requiring Attention:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Phase completion determination
  const isPhaseComplete = percentage >= 85 && issues.length <= 5;
  
  console.log(`\n🎯 Phase 8 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 9');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 9');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual security and compliance issues'] : []
  };
}

// Helper function to get all source files
function getSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

if (require.main === module) {
  validateSecurityCompliance();
}

module.exports = { validateSecurityCompliance };
