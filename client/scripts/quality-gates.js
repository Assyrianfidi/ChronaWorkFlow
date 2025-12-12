// Quality gates configuration for testing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Quality thresholds
const QUALITY_THRESHOLDS = {
  coverage: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  },
  tests: {
    minTests: 50,
    maxTestDuration: 5000, // 5 seconds
    maxFlakyTests: 0
  },
  lint: {
    maxErrors: 0,
    maxWarnings: 10
  },
  performance: {
    maxBundleSize: 1024 * 1024, // 1MB
    maxLoadTime: 3000 // 3 seconds
  }
};

// Check test coverage
function checkCoverage() {
  console.log('🔍 Checking test coverage...');
  
  try {
    const coverageReport = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    const { total } = coverageReport;
    
    const results = {
      statements: total.statements.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      lines: total.lines.pct
    };
    
    let passed = true;
    
    for (const [metric, value] of Object.entries(results)) {
      const threshold = QUALITY_THRESHOLDS.coverage[metric];
      if (value < threshold) {
        console.error(`❌ ${metric} coverage ${value}% is below threshold ${threshold}%`);
        passed = false;
      } else {
        console.log(`✅ ${metric} coverage ${value}% meets threshold ${threshold}%`);
      }
    }
    
    return passed;
  } catch (error) {
    console.error('❌ Could not read coverage report:', error.message);
    return false;
  }
}

// Check test count
function checkTestCount() {
  console.log('🔍 Checking test count...');
  
  try {
    const testResults = JSON.parse(fs.readFileSync('coverage/test-results.json', 'utf8'));
    const testCount = testResults.numTotalTests;
    
    if (testCount < QUALITY_THRESHOLDS.tests.minTests) {
      console.error(`❌ Test count ${testCount} is below minimum ${QUALITY_THRESHOLDS.tests.minTests}`);
      return false;
    }
    
    console.log(`✅ Test count ${testCount} meets minimum ${QUALITY_THRESHOLDS.tests.minTests}`);
    return true;
  } catch (error) {
    console.error('❌ Could not read test results:', error.message);
    return false;
  }
}

// Check lint results
function checkLintResults() {
  console.log('🔍 Checking lint results...');
  
  try {
    const lintResults = JSON.parse(execSync('npm run lint -- --format=json', { encoding: 'utf8' }));
    const errorCount = lintResults.reduce((sum, file) => sum + file.errorCount, 0);
    const warningCount = lintResults.reduce((sum, file) => sum + file.warningCount, 0);
    
    if (errorCount > QUALITY_THRESHOLDS.lint.maxErrors) {
      console.error(`❌ Lint errors ${errorCount} exceed maximum ${QUALITY_THRESHOLDS.lint.maxErrors}`);
      return false;
    }
    
    if (warningCount > QUALITY_THRESHOLDS.lint.maxWarnings) {
      console.error(`❌ Lint warnings ${warningCount} exceed maximum ${QUALITY_THRESHOLDS.lint.maxWarnings}`);
      return false;
    }
    
    console.log(`✅ Lint results pass: ${errorCount} errors, ${warningCount} warnings`);
    return true;
  } catch (error) {
    console.error('❌ Could not run lint check:', error.message);
    return false;
  }
}

// Check bundle size
function checkBundleSize() {
  console.log('🔍 Checking bundle size...');
  
  try {
    const distPath = 'dist/static/js';
    const files = fs.readdirSync(distPath);
    let totalSize = 0;
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const stats = fs.statSync(path.join(distPath, file));
        totalSize += stats.size;
      }
    }
    
    if (totalSize > QUALITY_THRESHOLDS.performance.maxBundleSize) {
      console.error(`❌ Bundle size ${totalSize} bytes exceeds maximum ${QUALITY_THRESHOLDS.performance.maxBundleSize} bytes`);
      return false;
    }
    
    console.log(`✅ Bundle size ${totalSize} bytes meets maximum ${QUALITY_THRESHOLDS.performance.maxBundleSize} bytes`);
    return true;
  } catch (error) {
    console.error('❌ Could not check bundle size:', error.message);
    return false;
  }
}

// Run all quality gates
function runQualityGates() {
  console.log('🚪 Running Quality Gates...
');
  
  const results = {
    coverage: checkCoverage(),
    testCount: checkTestCount(),
    lint: checkLintResults(),
    bundleSize: checkBundleSize()
  };
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('
📊 Quality Gates Results:');
  for (const [gate, passed] of Object.entries(results)) {
    console.log(`  ${gate}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log(`
🎯 Overall: ${allPassed ? '✅ ALL QUALITY GATES PASSED' : '❌ SOME QUALITY GATES FAILED'}`);
  
  if (!allPassed) {
    console.log('
📝 Fix the failing quality gates before proceeding with deployment.');
    process.exit(1);
  }
  
  console.log('
🚀 Ready for deployment!');
}

// Export functions
module.exports = {
  QUALITY_THRESHOLDS,
  checkCoverage,
  checkTestCount,
  checkLintResults,
  checkBundleSize,
  runQualityGates
};

// Run quality gates if called directly
if (require.main === module) {
  runQualityGates();
}