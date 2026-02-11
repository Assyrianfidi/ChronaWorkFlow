#!/usr/bin/env node

/**
 * AccuBooks Full Deployment Validation Script
 * Validates both frontend and backend deployment
 * Run after completing Render deployment
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://accubooks-backend.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://accubooks-frontend.onrender.com';

console.log('\n🚀 AccuBooks Full Deployment Validation\n');
console.log('═'.repeat(60));
console.log(`Backend URL:  ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('═'.repeat(60));
console.log('');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

async function runTest(name, testFn) {
  process.stdout.write(`${name}... `);
  try {
    const result = await testFn();
    if (result.status === 'pass') {
      console.log('✅ PASS');
      if (result.details) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }
      results.passed++;
      results.tests.push({ name, status: 'pass', details: result.details });
    } else if (result.status === 'warn') {
      console.log('⚠️  WARN');
      if (result.details) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }
      results.warnings++;
      results.tests.push({ name, status: 'warn', details: result.details });
    } else {
      console.log('❌ FAIL');
      if (result.details) {
        result.details.forEach(detail => console.log(`   ${detail}`));
      }
      results.failed++;
      results.tests.push({ name, status: 'fail', details: result.details });
    }
  } catch (err) {
    console.log('❌ ERROR');
    console.log(`   ${err.message}`);
    results.failed++;
    results.tests.push({ name, status: 'error', error: err.message });
  }
  console.log('');
}

// Test 1: Backend Health
async function testBackendHealth() {
  const res = await fetch(`${BACKEND_URL}/health`);
  const data = await res.json();
  
  if (data.status === 'ok' && data.database === 'connected') {
    return {
      status: 'pass',
      details: [
        `Status: ${data.status}`,
        `Database: ${data.database}`,
        `Environment: ${data.environment || 'production'}`
      ]
    };
  }
  return {
    status: 'fail',
    details: [`Response: ${JSON.stringify(data)}`]
  };
}

// Test 2: Backend API Health
async function testBackendAPI() {
  const res = await fetch(`${BACKEND_URL}/api/health`);
  const data = await res.json();
  
  if (res.ok) {
    return {
      status: 'pass',
      details: [
        `Status: ${res.status} ${res.statusText}`,
        `Response: ${JSON.stringify(data)}`
      ]
    };
  }
  return {
    status: 'fail',
    details: [`Status: ${res.status} ${res.statusText}`]
  };
}

// Test 3: Frontend Accessibility
async function testFrontendAccessibility() {
  const res = await fetch(FRONTEND_URL);
  
  if (res.ok) {
    const contentType = res.headers.get('content-type');
    return {
      status: 'pass',
      details: [
        `Status: ${res.status} ${res.statusText}`,
        `Content-Type: ${contentType}`
      ]
    };
  }
  return {
    status: 'fail',
    details: [`Status: ${res.status} ${res.statusText}`]
  };
}

// Test 4: HTTPS Enforcement
async function testHTTPS() {
  const backendHTTPS = BACKEND_URL.startsWith('https://');
  const frontendHTTPS = FRONTEND_URL.startsWith('https://');
  
  if (backendHTTPS && frontendHTTPS) {
    return {
      status: 'pass',
      details: [
        'Backend: HTTPS ✓',
        'Frontend: HTTPS ✓'
      ]
    };
  }
  return {
    status: 'fail',
    details: [
      `Backend HTTPS: ${backendHTTPS ? '✓' : '✗'}`,
      `Frontend HTTPS: ${frontendHTTPS ? '✓' : '✗'}`
    ]
  };
}

// Test 5: CORS Configuration
async function testCORS() {
  const res = await fetch(`${BACKEND_URL}/api/health`, {
    headers: {
      'Origin': FRONTEND_URL
    }
  });
  
  const corsHeader = res.headers.get('access-control-allow-origin');
  
  if (corsHeader) {
    return {
      status: 'pass',
      details: [
        `Access-Control-Allow-Origin: ${corsHeader}`,
        `Credentials: ${res.headers.get('access-control-allow-credentials') || 'not set'}`
      ]
    };
  }
  return {
    status: 'warn',
    details: ['CORS headers not detected - may cause browser issues']
  };
}

// Test 6: API Endpoint Reachability
async function testAPIEndpoint() {
  const res = await fetch(`${BACKEND_URL}/api/auth/status`);
  
  // 401 is expected for unauthenticated requests
  if (res.status === 401 || res.status === 200) {
    return {
      status: 'pass',
      details: [
        `Status: ${res.status} ${res.statusText}`,
        res.status === 401 ? 'Not authenticated (expected)' : 'Authenticated'
      ]
    };
  }
  return {
    status: 'warn',
    details: [`Unexpected status: ${res.status}`]
  };
}

// Test 7: Database Connection
async function testDatabaseConnection() {
  const res = await fetch(`${BACKEND_URL}/health`);
  const data = await res.json();
  
  if (data.database === 'connected') {
    return {
      status: 'pass',
      details: ['Database connection verified']
    };
  }
  return {
    status: 'fail',
    details: [`Database status: ${data.database || 'unknown'}`]
  };
}

// Test 8: Response Times
async function testResponseTimes() {
  const start = Date.now();
  await fetch(`${BACKEND_URL}/health`);
  const backendTime = Date.now() - start;
  
  const start2 = Date.now();
  await fetch(FRONTEND_URL);
  const frontendTime = Date.now() - start2;
  
  const details = [
    `Backend: ${backendTime}ms`,
    `Frontend: ${frontendTime}ms`
  ];
  
  if (backendTime < 1000 && frontendTime < 3000) {
    return { status: 'pass', details };
  } else if (backendTime < 2000 && frontendTime < 5000) {
    return { status: 'warn', details: [...details, 'Response times acceptable but could be improved'] };
  }
  return { status: 'fail', details: [...details, 'Response times too slow'] };
}

// Main validation
async function validate() {
  console.log('Running deployment validation tests...\n');
  
  await runTest('Test 1: Backend Health Check', testBackendHealth);
  await runTest('Test 2: Backend API Health', testBackendAPI);
  await runTest('Test 3: Frontend Accessibility', testFrontendAccessibility);
  await runTest('Test 4: HTTPS Enforcement', testHTTPS);
  await runTest('Test 5: CORS Configuration', testCORS);
  await runTest('Test 6: API Endpoint Reachability', testAPIEndpoint);
  await runTest('Test 7: Database Connection', testDatabaseConnection);
  await runTest('Test 8: Response Times', testResponseTimes);
  
  // Summary
  console.log('═'.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed:   ${results.passed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`❌ Failed:   ${results.failed}`);
  console.log(`📊 Total:    ${results.passed + results.warnings + results.failed}`);
  console.log('═'.repeat(60));
  console.log('');
  
  const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (results.failed === 0) {
    console.log('✅ ALL CRITICAL TESTS PASSED!\n');
    console.log('🎉 AccuBooks is fully deployed and operational!\n');
    console.log('Next Steps:');
    console.log('1. Login at: ' + FRONTEND_URL);
    console.log('2. Credentials: admin@accubooks.com / TempAdmin123!');
    console.log('3. ⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY');
    console.log('4. Test full user journey');
    console.log('5. Monitor logs for any errors');
    console.log('6. Set up monitoring and alerts\n');
    
    return true;
  } else {
    console.log('⚠️  DEPLOYMENT VALIDATION FAILED\n');
    console.log('Failed Tests:');
    results.tests
      .filter(t => t.status === 'fail' || t.status === 'error')
      .forEach(t => {
        console.log(`  ❌ ${t.name}`);
        if (t.error) console.log(`     Error: ${t.error}`);
        if (t.details) t.details.forEach(d => console.log(`     ${d}`));
      });
    console.log('\nTroubleshooting:');
    console.log('1. Check Render deployment logs');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Ensure backend CORS_ORIGIN matches frontend URL');
    console.log('4. Confirm database connection in backend');
    console.log('5. Redeploy if necessary\n');
    
    return false;
  }
}

// Run validation
validate()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ Validation script error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
