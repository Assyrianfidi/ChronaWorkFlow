const fs = require('fs');
const path = require('path');

function validateTestingQA() {
  console.log('🧪 Phase 9: Testing & QA Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check unit test setup and coverage
  console.log('🔬 Unit Test Analysis:');
  
  const testFiles = getTestFiles('src');
  let unitTests = 0;
  let testCoverage = 0;
  let testFrameworks = 0;
  let testUtilities = 0;
  
  // Check for test configuration files
  const jestConfig = fs.existsSync('jest.config.js') || fs.existsSync('jest.config.ts') || fs.existsSync('package.json');
  const vitestConfig = fs.existsSync('vitest.config.ts') || fs.existsSync('vite.config.ts');
  const testingLibrary = fs.existsSync('package.json') ? 
    fs.readFileSync('package.json', 'utf8').includes('@testing-library') : false;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (file.includes('.test.') || file.includes('.spec.')) {
        unitTests++;
      }
      
      if (content.includes('describe') || content.includes('it') || content.includes('test')) {
        testCoverage++;
      }
      
      if (content.includes('jest') || content.includes('vitest') || content.includes('mocha')) {
        testFrameworks++;
      }
      
      if (content.includes('render') || content.includes('screen') || content.includes('fireEvent')) {
        testUtilities++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📄 Test files found: ${testFiles.length}`);
  console.log(`  🔬 Unit tests: ${unitTests}`);
  console.log(`  📊 Test coverage: ${testCoverage} files`);
  console.log(`  🛠️  Test frameworks: ${testFrameworks}`);
  console.log(`  🧪 Test utilities: ${testUtilities}`);
  console.log(`  ⚙️  Jest config: ${jestConfig ? 'Yes' : 'No'}`);
  console.log(`  ⚡ Vitest config: ${vitestConfig ? 'Yes' : 'No'}`);
  console.log(`  📚 Testing Library: ${testingLibrary ? 'Yes' : 'No'}`);
  
  if (unitTests >= 20 && testCoverage >= 15 && testingLibrary) {
    score++;
    console.log('  ✅ Unit testing is well implemented');
  } else {
    console.log('  ❌ Unit testing needs improvement');
    issues.push('Unit testing not well implemented');
  }
  
  // 2. Check integration testing
  console.log('\n🔗 Integration Testing Analysis:');
  
  let integrationTests = 0;
  let apiTests = 0;
  let componentIntegration = 0;
  let e2eTests = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('integration') || content.includes('api')) {
        integrationTests++;
      }
      
      if (content.includes('axios') || content.includes('fetch') || content.includes('mock')) {
        apiTests++;
      }
      
      if (content.includes('mount') || content.includes('userEvent') || content.includes('waitFor')) {
        componentIntegration++;
      }
      
      if (content.includes('cy.') || content.includes('playwright') || content.includes('puppeteer')) {
        e2eTests++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔗 Integration tests: ${integrationTests}`);
  console.log(`  🌐 API tests: ${apiTests}`);
  console.log(`  🧩 Component integration: ${componentIntegration}`);
  console.log(`  🎭 E2E tests: ${e2eTests}`);
  
  if (integrationTests >= 5 && apiTests >= 3) {
    score++;
    console.log('  ✅ Integration testing is well implemented');
  } else {
    console.log('  ❌ Integration testing needs improvement');
    issues.push('Integration testing not well implemented');
  }
  
  // 3. Check test utilities and helpers
  console.log('\n🛠️  Test Utilities Analysis:');
  
  let testHelpers = 0;
  let mockData = 0;
  let testFixtures = 0;
  let customMatchers = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('helper') || content.includes('util')) {
        testHelpers++;
      }
      
      if (content.includes('mockData') || content.includes('fixture') || content.includes('factory')) {
        mockData++;
      }
      
      if (content.includes('beforeAll') || content.includes('afterAll') || content.includes('setup')) {
        testFixtures++;
      }
      
      if (content.includes('expect.extend') || content.includes('matcher')) {
        customMatchers++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛠️  Test helpers: ${testHelpers}`);
  console.log(`  🎭 Mock data: ${mockData}`);
  console.log(`  ⚙️  Test fixtures: ${testFixtures}`);
  console.log(`  🎯 Custom matchers: ${customMatchers}`);
  
  if (testHelpers >= 3 && mockData >= 2) {
    score++;
    console.log('  ✅ Test utilities are well implemented');
  } else {
    console.log('  ❌ Test utilities need improvement');
    issues.push('Test utilities not well implemented');
  }
  
  // 4. Check test coverage configuration
  console.log('\n📊 Test Coverage Analysis:');
  
  let coverageConfig = 0;
  let coverageReports = 0;
  let coverageThresholds = 0;
  let coverageTools = 0;
  
  // Check package.json for coverage scripts
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts?.coverage || packageJson.scripts?.['test:coverage']) {
      coverageConfig++;
    }
    
    if (packageJson.jest?.coverageReporters || packageJson.jest?.collectCoverage) {
      coverageReports++;
    }
    
    if (packageJson.jest?.coverageThreshold) {
      coverageThresholds++;
    }
    
    if (packageJson.devDependencies?.['nyc'] || packageJson.devDependencies?.['c8']) {
      coverageTools++;
    }
  }
  
  console.log(`  ⚙️  Coverage config: ${coverageConfig}`);
  console.log(`  📄 Coverage reports: ${coverageReports}`);
  console.log(`  🎯 Coverage thresholds: ${coverageThresholds}`);
  console.log(`  🛠️  Coverage tools: ${coverageTools}`);
  
  if (coverageConfig >= 1 && coverageReports >= 1) {
    score++;
    console.log('  ✅ Test coverage is well configured');
  } else {
    console.log('  ❌ Test coverage needs improvement');
    issues.push('Test coverage not well configured');
  }
  
  // 5. Check CI/CD testing integration
  console.log('\n🔄 CI/CD Testing Analysis:');
  
  let githubActions = 0;
  let ciScripts = 0;
  let testAutomation = 0;
  let qualityGates = 0;
  
  // Check for CI/CD files
  if (fs.existsSync('.github/workflows')) {
    const workflows = fs.readdirSync('.github/workflows');
    githubActions = workflows.filter(file => file.includes('.yml') || file.includes('.yaml')).length;
  }
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts?.['test:ci'] || packageJson.scripts?.['ci:test']) {
      ciScripts++;
    }
    
    if (packageJson.scripts?.['test:watch'] || packageJson.scripts?.['test:run']) {
      testAutomation++;
    }
  }
  
  console.log(`  🔄 GitHub Actions: ${githubActions}`);
  console.log(`  🚀 CI scripts: ${ciScripts}`);
  console.log(`  🤖 Test automation: ${testAutomation}`);
  console.log(`  🚪 Quality gates: ${qualityGates}`);
  
  if (githubActions >= 1 || ciScripts >= 1) {
    score++;
    console.log('  ✅ CI/CD testing is implemented');
  } else {
    console.log('  ❌ CI/CD testing needs improvement');
    issues.push('CI/CD testing not implemented');
  }
  
  // 6. Check accessibility testing
  console.log('\n♿ Accessibility Testing Analysis:');
  
  let a11yTests = 0;
  let a11yTools = 0;
  let a11yRules = 0;
  let a11yCoverage = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('accessibility') || content.includes('a11y') || content.includes('axe')) {
        a11yTests++;
      }
      
      if (content.includes('toBeInTheDocument') || content.includes('toHaveClass') || content.includes('toBeDisabled')) {
        a11yTools++;
      }
      
      if (content.includes('role') || content.includes('aria') || content.includes('tabIndex')) {
        a11yRules++;
      }
      
      if (content.includes('keyboard') || content.includes('focus') || content.includes('screenReader')) {
        a11yCoverage++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ♿ Accessibility tests: ${a11yTests}`);
  console.log(`  🛠️  A11y tools: ${a11yTools}`);
  console.log(`  📋 A11y rules: ${a11yRules}`);
  console.log(`  🎯 A11y coverage: ${a11yCoverage}`);
  
  if (a11yTests >= 3 && a11yTools >= 5) {
    score++;
    console.log('  ✅ Accessibility testing is well implemented');
  } else {
    console.log('  ❌ Accessibility testing needs improvement');
    issues.push('Accessibility testing not well implemented');
  }
  
  // 7. Check performance testing
  console.log('\n⚡ Performance Testing Analysis:');
  
  let perfTests = 0;
  let loadTests = 0;
  let memoryTests = 0;
  let perfMetrics = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('performance') || content.includes('perf')) {
        perfTests++;
      }
      
      if (content.includes('load') || content.includes('stress')) {
        loadTests++;
      }
      
      if (content.includes('memory') || content.includes('leak')) {
        memoryTests++;
      }
      
      if (content.includes('timing') || content.includes('measure') || content.includes('benchmark')) {
        perfMetrics++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ⚡ Performance tests: ${perfTests}`);
  console.log(`  🏋️  Load tests: ${loadTests}`);
  console.log(`  🧠 Memory tests: ${memoryTests}`);
  console.log(`  📊 Performance metrics: ${perfMetrics}`);
  
  if (perfTests >= 2 || perfMetrics >= 2) {
    score++;
    console.log('  ✅ Performance testing is implemented');
  } else {
    console.log('  ❌ Performance testing needs improvement');
    issues.push('Performance testing not implemented');
  }
  
  // 8. Check security testing
  console.log('\n🔒 Security Testing Analysis:');
  
  let securityTests = 0;
  let vulnerabilityTests = 0;
  let authTests = 0;
  let dataProtectionTests = 0;
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('security') || content.includes('auth')) {
        securityTests++;
      }
      
      if (content.includes('vulnerability') || content.includes('xss') || content.includes('csrf')) {
        vulnerabilityTests++;
      }
      
      if (content.includes('login') || content.includes('permission') || content.includes('role')) {
        authTests++;
      }
      
      if (content.includes('encryption') || content.includes('mask') || content.includes('sanitiz')) {
        dataProtectionTests++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔒 Security tests: ${securityTests}`);
  console.log(`  🛡️  Vulnerability tests: ${vulnerabilityTests}`);
  console.log(`  🔑 Authentication tests: ${authTests}`);
  console.log(`  🛡️  Data protection tests: ${dataProtectionTests}`);
  
  if (securityTests >= 3 && authTests >= 2) {
    score++;
    console.log('  ✅ Security testing is well implemented');
  } else {
    console.log('  ❌ Security testing needs improvement');
    issues.push('Security testing not well implemented');
  }
  
  // 9. Check test documentation
  console.log('\n📚 Test Documentation Analysis:');
  
  let testDocs = 0;
  let testGuides = 0;
  let testExamples = 0;
  let testStandards = 0;
  
  // Check for documentation files
  const docFiles = [
    'README.md',
    'TESTING.md',
    'CONTRIBUTING.md',
    'docs/testing.md',
    'docs/test-guide.md'
  ];
  
  docFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('test') || content.includes('Test')) {
        testDocs++;
      }
      
      if (content.includes('guide') || content.includes('how to')) {
        testGuides++;
      }
      
      if (content.includes('example') || content.includes('sample')) {
        testExamples++;
      }
      
      if (content.includes('standard') || content.includes('convention')) {
        testStandards++;
      }
    }
  });
  
  console.log(`  📚 Test documentation: ${testDocs}`);
  console.log(`  📖 Test guides: ${testGuides}`);
  console.log(`  💡 Test examples: ${testExamples}`);
  console.log(`  📋 Test standards: ${testStandards}`);
  
  if (testDocs >= 2 || testGuides >= 1) {
    score++;
    console.log('  ✅ Test documentation is well implemented');
  } else {
    console.log('  ❌ Test documentation needs improvement');
    issues.push('Test documentation not well implemented');
  }
  
  // 10. Check test execution and reporting
  console.log('\n📊 Test Execution & Reporting Analysis:');
  
  let testScripts = 0;
  let reportingTools = 0;
  let testReports = 0;
  let qualityMetrics = 0;
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts.test || scripts['test:unit'] || scripts['test:integration']) {
      testScripts++;
    }
    
    if (scripts['test:coverage'] || scripts.coverage) {
      reportingTools++;
    }
    
    if (scripts['test:report'] || scripts['test:ci']) {
      testReports++;
    }
    
    if (packageJson.devDependencies?.['jest-html-reporters'] || 
        packageJson.devDependencies?.['@jest/test-result-processor']) {
      qualityMetrics++;
    }
  }
  
  console.log(`  🧪 Test scripts: ${testScripts}`);
  console.log(`  📊 Reporting tools: ${reportingTools}`);
  console.log(`  📄 Test reports: ${testReports}`);
  console.log(`  📈 Quality metrics: ${qualityMetrics}`);
  
  if (testScripts >= 2 && reportingTools >= 1) {
    score++;
    console.log('  ✅ Test execution and reporting is well implemented');
  } else {
    console.log('  ❌ Test execution and reporting needs improvement');
    issues.push('Test execution and reporting not well implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 9 Results:');
  console.log(`  🎯 Testing & QA Score: ${score}/${maxScore} (${percentage}%)`);
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
  
  console.log(`\n🎯 Phase 9 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 10');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 10');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual testing and QA issues'] : []
  };
}

// Helper function to get all test files
function getTestFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (
          item.endsWith('.test.ts') || 
          item.endsWith('.test.tsx') || 
          item.endsWith('.spec.ts') || 
          item.endsWith('.spec.tsx') ||
          item.includes('test') ||
          item.includes('spec')
        )) {
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
  validateTestingQA();
}

module.exports = { validateTestingQA };
