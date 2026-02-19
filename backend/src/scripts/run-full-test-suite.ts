/**
 * Complete Test Suite Runner
 * Runs all backend tests: unit, integration, E2E, security
 * 
 * Usage: tsx src/scripts/run-full-test-suite.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestSuiteResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  status: 'PASS' | 'FAIL';
}

const results: TestSuiteResult[] = [];

function runTestSuite(name: string, command: string): TestSuiteResult {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Running: ${name}`);
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'inherit',
    });

    const duration = Date.now() - startTime;

    // Parse Jest output (simplified)
    return {
      suite: name,
      passed: 0, // Would parse from output
      failed: 0,
      skipped: 0,
      duration,
      status: 'PASS',
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      suite: name,
      passed: 0,
      failed: 1,
      skipped: 0,
      duration,
      status: 'FAIL',
    };
  }
}

function main(): void {
  console.log('🧪 AccuBooks Complete Test Suite');
  console.log('='.repeat(80) + '\n');

  // 1. Unit Tests
  results.push(runTestSuite('Unit Tests', 'npm run test:unit'));

  // 2. Integration Tests
  results.push(runTestSuite('Integration Tests', 'npm run test:integration'));

  // 3. Tenant Isolation Tests
  results.push(runTestSuite('Tenant Isolation Tests', 'npm test -- tenant-isolation'));

  // 4. Security Tests
  results.push(runTestSuite('Security Tests', 'npm test -- security'));

  // 5. E2E Tests (if implemented)
  if (fs.existsSync(path.join(process.cwd(), 'src', '__tests__', 'e2e'))) {
    results.push(runTestSuite('E2E Tests', 'npm run test:e2e'));
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE SUMMARY');
  console.log('='.repeat(80) + '\n');

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${icon} ${result.suite} - ${duration}s`);
  });

  const totalPassed = results.filter((r: any) => r.status === 'PASS').length;
  const totalFailed = results.filter((r: any) => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum: any, r: any) => sum + r.duration, 0) / 1000;

  console.log('\n' + '='.repeat(80));
  console.log(`Total Suites: ${results.length}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log('='.repeat(80) + '\n');

  if (totalFailed > 0) {
    console.log('❌ Some test suites failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('✅ All test suites passed!');
    process.exit(0);
  }
}

main();
