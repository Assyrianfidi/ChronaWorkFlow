/**
 * ============================================================================
 * BOOT FAILURE ENFORCEMENT TEST
 * ============================================================================
 * 
 * Verifies that boot validation ACTUALLY blocks server startup when:
 * - Multiple Prisma clients exist
 * - Versioned service files present
 * - Middleware files missing
 * - Production security requirements not met
 * 
 * This is NOT a mock test - it creates actual violations and attempts startup.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '..');

const testResults = {
  tests: [],
  passed: 0,
  failed: 0,
};

/**
 * Run server and check if it exits with error
 */
async function attemptServerStart(testName, expectedToFail = true) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log(`   Expected: ${expectedToFail ? 'FAIL (exit with error)' : 'SUCCESS (start normally)'}`);
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['--loader', 'tsx', 'server.ts'], {
      cwd: backendRoot,
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe',
    });
    
    let output = '';
    let errorOutput = '';
    let exitedWithError = false;
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    serverProcess.on('exit', (code) => {
      exitedWithError = code !== 0;
      
      const actualResult = exitedWithError ? 'FAILED TO START' : 'STARTED SUCCESSFULLY';
      const testPassed = exitedWithError === expectedToFail;
      
      console.log(`   Actual: ${actualResult} (exit code: ${code})`);
      console.log(`   Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!testPassed) {
        console.log(`\n   Output:\n${output}`);
        console.log(`\n   Errors:\n${errorOutput}`);
      }
      
      testResults.tests.push({
        name: testName,
        expectedToFail,
        actuallyFailed: exitedWithError,
        passed: testPassed,
        exitCode: code,
      });
      
      if (testPassed) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      
      resolve(testPassed);
    });
    
    // Kill after 5 seconds if still running
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill();
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * Test 1: Create duplicate Prisma client
 */
async function testDuplicatePrismaClient() {
  const duplicateFile = path.join(backendRoot, 'src/lib/prisma.ts');
  const duplicateContent = `
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
`;
  
  try {
    fs.mkdirSync(path.dirname(duplicateFile), { recursive: true });
    fs.writeFileSync(duplicateFile, duplicateContent);
    
    const passed = await attemptServerStart('Duplicate Prisma Client Detection', true);
    
    // Cleanup
    fs.unlinkSync(duplicateFile);
    
    return passed;
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Create versioned service file
 */
async function testVersionedServiceFile() {
  const versionedFile = path.join(backendRoot, 'src/services/test.service.v4.ts');
  const versionedContent = `
export class TestServiceV4 {
  test() { return 'v4'; }
}
`;
  
  try {
    fs.writeFileSync(versionedFile, versionedContent);
    
    const passed = await attemptServerStart('Versioned Service File Detection', true);
    
    // Cleanup
    fs.unlinkSync(versionedFile);
    
    return passed;
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Remove tenant middleware (temporarily)
 */
async function testMissingTenantMiddleware() {
  const middlewareFile = path.join(backendRoot, 'src/middleware/tenant-context.middleware.ts');
  const backupFile = middlewareFile + '.test-backup';
  
  try {
    // Backup original
    fs.renameSync(middlewareFile, backupFile);
    
    const passed = await attemptServerStart('Missing Tenant Middleware Detection', true);
    
    // Restore
    fs.renameSync(backupFile, middlewareFile);
    
    return passed;
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    // Ensure restore happens
    if (fs.existsSync(backupFile)) {
      fs.renameSync(backupFile, middlewareFile);
    }
    return false;
  }
}

/**
 * Test 4: Production security validation (short JWT secret)
 */
async function testProductionSecurity() {
  console.log(`\n🧪 Test: Production Security Validation (Short JWT Secret)`);
  console.log(`   Expected: FAIL (exit with error)`);
  
  const serverProcess = spawn('node', ['--loader', 'tsx', 'server.ts'], {
    cwd: backendRoot,
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      JWT_SECRET: 'short', // Too short
      DATABASE_URL: 'postgresql://localhost/test',
      REDIS_HOST: 'redis.production.com',
    },
    stdio: 'pipe',
  });
  
  return new Promise((resolve) => {
    let exitedWithError = false;
    
    serverProcess.on('exit', (code) => {
      exitedWithError = code !== 0;
      const testPassed = exitedWithError;
      
      console.log(`   Actual: ${exitedWithError ? 'FAILED TO START' : 'STARTED SUCCESSFULLY'} (exit code: ${code})`);
      console.log(`   Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
      
      testResults.tests.push({
        name: 'Production Security Validation',
        expectedToFail: true,
        actuallyFailed: exitedWithError,
        passed: testPassed,
        exitCode: code,
      });
      
      if (testPassed) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      
      resolve(testPassed);
    });
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill();
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * Test 5: Normal startup (should succeed)
 */
async function testNormalStartup() {
  return await attemptServerStart('Normal Startup (No Violations)', false);
}

/**
 * Main test execution
 */
async function runBootFailureTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔥 BOOT FAILURE ENFORCEMENT TEST SUITE`);
  console.log('='.repeat(80));
  console.log(`\nThis test suite verifies that boot validation ACTUALLY blocks invalid startup.`);
  console.log(`Each test creates a real violation and attempts to start the server.\n`);
  
  try {
    // Run all tests
    await testDuplicatePrismaClient();
    await testVersionedServiceFile();
    await testMissingTenantMiddleware();
    await testProductionSecurity();
    await testNormalStartup();
    
    // Final report
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 BOOT FAILURE TEST RESULTS`);
    console.log('='.repeat(80));
    console.log(`\nTotal Tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`\nPass Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    
    console.log(`\nDetailed Results:`);
    testResults.tests.forEach((test, i) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${i + 1}. ${status} ${test.name}`);
      console.log(`     Expected: ${test.expectedToFail ? 'Fail' : 'Success'} | Actual: ${test.actuallyFailed ? 'Failed' : 'Started'}`);
    });
    
    // Save results
    fs.writeFileSync(
      path.join(backendRoot, 'BOOT_FAILURE_TEST_RESULTS.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log(`\n💾 Results saved to: BOOT_FAILURE_TEST_RESULTS.json`);
    
    const allPassed = testResults.failed === 0;
    console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log(`\n🎉 Boot validation is ENFORCING structural integrity correctly!`);
    } else {
      console.log(`\n⚠️  Boot validation has gaps - server can start with violations!`);
    }
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error(`\n❌ Test suite failed:`, error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBootFailureTests().catch(console.error);
}

export { runBootFailureTests, testResults };
