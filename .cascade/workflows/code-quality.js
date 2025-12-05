#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ESLint } = require('eslint');
const { configs } = require('@typescript-eslint/parser');

class CodeQualityWorkflow {
  constructor() {
    this.config = {
      rootDir: process.cwd(),
      clientDir: path.join(process.cwd(), 'client'),
      serverDir: path.join(process.cwd(), 'server'),
      minTestCoverage: 80,
      maxWarnings: 0,
      eslintConfig: {
        overrideConfig: {
          extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
          parser: '@typescript-eslint/parser',
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            project: './tsconfig.json'
          },
          rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'no-console': 'warn',
            'no-unused-vars': 'warn'
          }
        },
        useEslintrc: true
      }
    };
    
    this.results = {
      typeCheck: { passed: false, output: '' },
      linting: { passed: false, warningCount: 0, errorCount: 0, output: [] },
      tests: { passed: false, coverage: 0, output: '' },
      security: { passed: false, issues: [], output: '' },
      build: { passed: false, output: '' }
    };
  }

  async run() {
    console.log('🚀 Starting Code Quality Workflow\n');
    
    try {
      // Run type checking
      await this.runTypeCheck();
      
      // Run linter
      await this.runLinter();
      
      // Run tests
      await this.runTests();
      
      // Run security audit
      await this.runSecurityAudit();
      
      // Run build
      await this.runBuild();
      
      // Generate report
      await this.generateReport();
      
      // Exit with appropriate code
      const allPassed = Object.values(this.results).every(result => result.passed);
      process.exit(allPassed ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Workflow failed:', error);
      process.exit(1);
    }
  }

  async runTypeCheck() {
    console.log('🔍 Running TypeScript type checking...');
    
    try {
      const output = execSync('npx tsc --noEmit', { 
        cwd: this.config.rootDir,
        encoding: 'utf-8'
      });
      
      this.results.typeCheck = {
        passed: true,
        output: '✅ Type checking completed successfully'
      };
      
      console.log(this.results.typeCheck.output);
    } catch (error) {
      this.results.typeCheck = {
        passed: false,
        output: error.stdout?.toString() || error.message
      };
      
      console.error('❌ Type checking failed');
      console.error(this.results.typeCheck.output);
      throw new Error('Type checking failed');
    }
  }

  async runLinter() {
    console.log('🧹 Running ESLint...');
    
    try {
      const eslint = new ESLint(this.config.eslintConfig);
      const results = await eslint.lintFiles(['**/*.{ts,tsx,js,jsx}']);
      
      const formatter = await eslint.loadFormatter('stylish');
      const resultText = formatter.format(results);
      
      if (resultText) {
        console.log(resultText);
      }
      
      const errorCount = results.reduce((sum, file) => sum + file.errorCount, 0);
      const warningCount = results.reduce((sum, file) => sum + file.warningCount, 0);
      
      this.results.linting = {
        passed: errorCount === 0,
        errorCount,
        warningCount,
        output: results
      };
      
      if (errorCount > 0) {
        console.error(`❌ ESLint found ${errorCount} errors and ${warningCount} warnings`);
        if (!process.env.CI) {
          console.log('\n💡 Run `npm run lint:fix` to automatically fix some issues.');
        }
        throw new Error('Linting failed');
      } else if (warningCount > 0) {
        console.log(`⚠️  ESLint found ${warningCount} warnings`);
      } else {
        console.log('✅ ESLint passed with no issues');
      }
      
    } catch (error) {
      console.error('❌ ESLint encountered an error:', error.message);
      throw error;
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      // Run unit tests
      const testOutput = execSync('npm test -- --coverage', { 
        cwd: this.config.rootDir,
        encoding: 'utf-8'
      });
      
      // Extract coverage information
      const coverageMatch = testOutput.match(/Statements\s*\|\s*(\d+\.\d+)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
      
      this.results.tests = {
        passed: true,
        coverage,
        output: testOutput
      };
      
      console.log(`✅ Tests passed with ${coverage}% coverage`);
      
      if (coverage < this.config.minTestCoverage) {
        console.error(`❌ Test coverage (${coverage}%) is below required threshold (${this.config.minTestCoverage}%)`);
        this.results.tests.passed = false;
        throw new Error('Test coverage below threshold');
      }
      
    } catch (error) {
      this.results.tests = {
        passed: false,
        coverage: 0,
        output: error.stdout?.toString() || error.message
      };
      
      console.error('❌ Tests failed');
      console.error(this.results.tests.output);
      throw new Error('Tests failed');
    }
  }

  async runSecurityAudit() {
    console.log('🔒 Running security audit...');
    
    try {
      const auditOutput = execSync('npm audit --json', { 
        cwd: this.config.rootDir,
        encoding: 'utf-8'
      });
      
      const auditResults = JSON.parse(auditOutput);
      const vulnerabilities = auditResults.vulnerabilities || {};
      const critical = vulnerabilities.critical || 0;
      const high = vulnerabilities.high || 0;
      
      this.results.security = {
        passed: critical === 0 && high === 0,
        issues: auditResults.vulnerabilities,
        output: auditOutput
      };
      
      if (critical > 0 || high > 0) {
        console.error(`❌ Security audit found ${critical} critical and ${high} high severity vulnerabilities`);
        console.error('Run `npm audit` for details');
        throw new Error('Security vulnerabilities found');
      } else {
        console.log('✅ No critical or high severity vulnerabilities found');
      }
      
    } catch (error) {
      this.results.security = {
        passed: false,
        issues: [],
        output: error.stdout?.toString() || error.message
      };
      
      console.error('❌ Security audit failed');
      throw error;
    }
  }

  async runBuild() {
    console.log('🏗️  Building project...');
    
    try {
      // Build client
      if (fs.existsSync(this.config.clientDir)) {
        console.log('Building client...');
        execSync('npm run build', { 
          cwd: this.config.clientDir,
          stdio: 'inherit'
        });
      }
      
      // Build server
      if (fs.existsSync(this.config.serverDir)) {
        console.log('Building server...');
        execSync('npm run build', { 
          cwd: this.config.serverDir,
          stdio: 'inherit'
        });
      }
      
      this.results.build = {
        passed: true,
        output: 'Build completed successfully'
      };
      
      console.log('✅ Build completed successfully');
      
    } catch (error) {
      this.results.build = {
        passed: false,
        output: error.stdout?.toString() || error.message
      };
      
      console.error('❌ Build failed');
      console.error(this.results.build.output);
      throw new Error('Build failed');
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        typeCheck: this.results.typeCheck.passed ? '✅ Passed' : '❌ Failed',
        linting: this.results.linting.passed ? '✅ Passed' : '❌ Failed',
        tests: this.results.tests.passed ? `✅ Passed (${this.results.tests.coverage}% coverage)` : '❌ Failed',
        security: this.results.security.passed ? '✅ Passed' : '❌ Failed',
        build: this.results.build.passed ? '✅ Passed' : '❌ Failed',
        overall: Object.values(this.results).every(r => r.passed) ? '✅ All checks passed' : '❌ Some checks failed'
      }
    };
    
    // Save report to file
    const reportPath = path.join(this.config.rootDir, 'quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Quality report generated: ${reportPath}`);
    
    // Print summary
    console.log('\n📋 Quality Check Summary:');
    console.log('------------------------');
    console.log(`Type Checking: ${report.summary.typeCheck}`);
    console.log(`Linting: ${report.summary.linting}${!this.results.linting.passed ? ` (${this.results.linting.errorCount} errors, ${this.results.linting.warningCount} warnings)` : ''}`);
    console.log(`Tests: ${report.summary.tests}`);
    console.log(`Security: ${report.summary.security}`);
    console.log(`Build: ${report.summary.build}`);
    console.log('------------------------');
    console.log(`Overall: ${report.summary.overall}`);
  }
}

// Run the workflow
const workflow = new CodeQualityWorkflow();
workflow.run().catch(console.error);
