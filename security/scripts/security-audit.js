// Security Audit Script
// This script performs a comprehensive security audit of the AccuBooks application

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const packageJson = require('../../package.json');

class SecurityAudit {
  constructor() {
    this.rootDir = process.cwd();
    this.reportDir = path.join(this.rootDir, 'security', 'audit-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportFile = path.join(this.reportDir, `security-audit-${this.timestamp}.md`);
    this.findings = [];
    this.severityLevels = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4
    };
  }

  // Initialize the audit
  async init() {
    console.log('🔍 Initializing security audit...');
    
    // Create report directory if it doesn't exist
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    
    // Start the report
    this.report = `# Security Audit Report\n\n`;
    this.report += `**Project**: ${packageJson.name || 'AccuBooks'}\n`;
    this.report += `**Version**: ${packageJson.version || '1.0.0'}\n`;
    this.report += `**Audit Date**: ${new Date().toISOString()}\n\n`;
    
    return true;
  }

  // Add a finding to the report
  addFinding(severity, title, description, file, line, recommendation) {
    this.findings.push({
      severity,
      title,
      description,
      file: file ? path.relative(this.rootDir, file) : null,
      line,
      recommendation
    });
  }

  // Check for known vulnerabilities in dependencies
  async checkDependencies() {
    console.log('🔍 Checking dependencies for known vulnerabilities...');
    
    try {
      const npmAudit = JSON.parse(execSync('npm audit --json', { encoding: 'utf-8' }));
      
      if (npmAudit.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries(npmAudit.vulnerabilities)) {
          this.addFinding(
            vuln.severity,
            `Vulnerable Dependency: ${pkg}@${vuln.via[0].name || vuln.via[0].title}`,
            `${vuln.via[0].title}\n${vuln.via[0].url || ''}`,
            'package.json',
            null,
            `Run 'npm audit fix' to fix automatically or update to a non-vulnerable version.`
          );
        }
      }
    } catch (error) {
      this.addFinding(
        'high',
        'Failed to check dependencies',
        'Could not run npm audit to check for vulnerable dependencies.',
        'package.json',
        null,
        'Make sure npm is installed and you have an internet connection.'
      );
    }
  }

  // Check for exposed secrets in the codebase
  async checkForSecrets() {
    console.log('🔍 Scanning for exposed secrets...');
    
    // This is a simplified version - in a real scenario, you'd use a library like detect-secrets
    const secretPatterns = [
      { name: 'AWS Key', pattern: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
      { name: 'API Key', pattern: /[aA][pP][iI][-_]?[kK]ey\s*[=:]\s*["'][a-zA-Z0-9_\-]{20,}["']/ },
      { name: 'Password in code', pattern: /[pP]assword\s*[=:]\s*["'][^"']+["']/ },
      { name: 'Secret Key', pattern: /[sS]ecret[_-]?[kK]ey\s*[=:]\s*["'][^"']+["']/ },
      { name: 'Database URL', pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/ }
    ];
    
    // Scan files for secrets
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        // Skip node_modules and other directories
        if (file.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build'].includes(file.name)) {
            scanDir(fullPath);
          }
          continue;
        }
        
        // Only check certain file types
        if (!/\.(js|jsx|ts|tsx|json|env|sh|py|rb|java|php|go|cs|swift|kt|kts)$/i.test(file.name)) {
          continue;
        }
        
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          for (const { name, pattern } of secretPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              this.addFinding(
                'critical',
                `Exposed ${name} found`,
                `A potential ${name.toLowerCase()} was found in the codebase.`,
                fullPath,
                content.substring(0, content.indexOf(matches[0])).split('\n').length,
                'Remove the hardcoded secret and use environment variables or a secure secret management solution.'
              );
            }
          }
        } catch (error) {
          // Skip files that can't be read (binary, etc.)
          continue;
        }
      }
    };
    
    scanDir(this.rootDir);
  }

  // Check for security-related HTTP headers
  async checkHttpHeaders() {
    console.log('🔍 Checking HTTP security headers...');
    
    // This would typically be done by testing the running application
    // For now, we'll just check if the security middleware is in place
    const securityMiddlewarePath = path.join(this.rootDir, 'security', 'middleware', 'security-headers.js');
    
    if (!fs.existsSync(securityMiddlewarePath)) {
      this.addFinding(
        'high',
        'Security middleware not found',
        'The security headers middleware is not set up in the application.',
        null,
        null,
        'Implement security middleware to set secure HTTP headers.'
      );
    }
  }

  // Check for authentication and authorization issues
  async checkAuth() {
    console.log('🔍 Checking authentication and authorization...');
    
    // Check for hardcoded credentials
    const authFiles = [
      path.join(this.rootDir, 'src', 'auth.js'),
      path.join(this.rootDir, 'src', 'middleware', 'auth.js'),
      path.join(this.rootDir, 'src', 'utils', 'auth.js')
    ];
    
    for (const file of authFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for hardcoded JWT secrets
        if (content.includes('jwtSecret') && !content.includes('process.env.JWT_SECRET')) {
          this.addFinding(
            'critical',
            'Hardcoded JWT secret',
            'A JWT secret is hardcoded in the authentication file.',
            file,
            content.split('\n').findIndex(line => line.includes('jwtSecret')) + 1,
            'Move the JWT secret to an environment variable.'
          );
        }
        
        // Check for weak password hashing
        if (content.includes('createHash') && !content.includes('bcrypt') && !content.includes('argon2')) {
          this.addFinding(
            'high',
            'Insecure password hashing',
            'Passwords are being hashed with an insecure algorithm.',
            file,
            content.split('\n').findIndex(line => line.includes('createHash')) + 1,
            'Use a secure password hashing algorithm like bcrypt or Argon2.'
          );
        }
      }
    }
  }

  // Check for CORS misconfigurations
  async checkCors() {
    console.log('🔍 Checking CORS configuration...');
    
    // Look for CORS configuration in the codebase
    const corsFiles = [
      path.join(this.rootDir, 'src', 'app.js'),
      path.join(this.rootDir, 'src', 'server.js'),
      path.join(this.rootDir, 'src', 'index.js')
    ];
    
    for (const file of corsFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for overly permissive CORS
        if (content.includes('cors({ origin: true })') || 
            content.includes('cors({ origin: "*" })') ||
            content.includes('cors({ origin: "*" })')) {
          this.addFinding(
            'high',
            'Overly permissive CORS configuration',
            'The CORS configuration allows requests from any origin.',
            file,
            content.split('\n').findIndex(line => line.includes('cors({')),
            'Restrict CORS to only allow specific trusted origins.'
          );
        }
      }
    }
  }

  // Generate the final report
  async generateReport() {
    console.log('📝 Generating security audit report...');
    
    // Sort findings by severity
    this.findings.sort((a, b) => {
      return this.severityLevels[a.severity] - this.severityLevels[b.severity];
    });
    
    // Add findings to the report
    this.report += '## Summary\n\n';
    this.report += `- **Critical**: ${this.findings.filter(f => f.severity === 'critical').length}\n`;
    this.report += `- **High**: ${this.findings.filter(f => f.severity === 'high').length}\n`;
    this.report += `- **Medium**: ${this.findings.filter(f => f.severity === 'medium').length}\n`;
    this.report += `- **Low**: ${this.findings.filter(f => f.severity === 'low').length}\n`;
    this.report += `- **Info**: ${this.findings.filter(f => f.severity === 'info').length}\n\n`;
    
    // Add detailed findings
    this.report += '## Findings\n\n';
    
    let currentSeverity = null;
    for (const finding of this.findings) {
      if (finding.severity !== currentSeverity) {
        currentSeverity = finding.severity;
        this.report += `### ${currentSeverity.charAt(0).toUpperCase() + currentSeverity.slice(1)} Severity\n\n`;
      }
      
      this.report += `#### ${finding.title}\n`;
      this.report += `- **File**: ${finding.file || 'N/A'}`;
      if (finding.line) this.report += `:${finding.line}`;
      this.report += '\n';
      this.report += `- **Description**: ${finding.description}\n`;
      this.report += `- **Recommendation**: ${finding.recommendation}\n\n`;
    }
    
    // Add recommendations
    this.report += '## Recommendations\n\n';
    this.report += '1. **Immediate Action Required**:\n   - Address all critical and high severity findings as soon as possible.\n   - Rotate all exposed secrets and API keys.\n\n';
    this.report += '2. **Short-term Improvements**:\n   - Update all dependencies to their latest secure versions.\n   - Implement proper input validation and output encoding.\n   - Ensure proper authentication and authorization checks are in place.\n\n';
    this.report += '3. **Long-term Security Strategy**:\n   - Implement automated security testing in your CI/CD pipeline.\n   - Conduct regular security training for developers.\n   - Perform penetration testing at least annually.\n\n';
    
    // Write the report to a file
    fs.writeFileSync(this.reportFile, this.report);
    
    console.log(`✅ Security audit completed. Report saved to: ${this.reportFile}`);
    console.log(`\n📊 Summary of findings:`);
    console.log(`- Critical: ${this.findings.filter(f => f.severity === 'critical').length}`);
    console.log(`- High: ${this.findings.filter(f => f.severity === 'high').length}`);
    console.log(`- Medium: ${this.findings.filter(f => f.severity === 'medium').length}`);
    console.log(`- Low: ${this.findings.filter(f => f.severity === 'low').length}`);
    console.log(`- Info: ${this.findings.filter(f => f.severity === 'info').length}\n`);
  }

  // Run all security checks
  async run() {
    await this.init();
    
    console.log('🚀 Starting security audit...\n');
    
    // Run all security checks
    await this.checkDependencies();
    await this.checkForSecrets();
    await this.checkHttpHeaders();
    await this.checkAuth();
    await this.checkCors();
    
    // Generate the final report
    await this.generateReport();
  }
}

// Run the audit if this file is executed directly
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.run().catch(error => {
    console.error('❌ Error during security audit:', error);
    process.exit(1);
  });
}

module.exports = SecurityAudit;
