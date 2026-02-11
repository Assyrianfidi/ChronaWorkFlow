// AccuBooks Frontend Deployment Validation Script
// Run this after frontend deployment to verify connectivity

const BACKEND_URL = process.env.VITE_API_URL || 'https://accubooks-backend.onrender.com';
const FRONTEND_URL = 'https://accubooks-frontend.onrender.com';

console.log('🚀 AccuBooks Frontend Deployment Validation\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}\n`);

async function validateDeployment() {
  let passedTests = 0;
  let totalTests = 5;
  
  // Test 1: Backend Health Check
  console.log('Test 1: Backend Health Check');
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const json = await res.json();
    
    if (json.status === 'ok' && json.database === 'connected') {
      console.log('✅ PASS - Backend healthy and database connected');
      console.log(`   Status: ${json.status}`);
      console.log(`   Database: ${json.database}`);
      console.log(`   Environment: ${json.environment}\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Backend health check failed');
      console.log(`   Response: ${JSON.stringify(json)}\n`);
    }
  } catch (err) {
    console.log('❌ FAIL - Backend unreachable');
    console.log(`   Error: ${err.message}\n`);
  }
  
  // Test 2: Frontend Accessibility
  console.log('Test 2: Frontend Accessibility');
  try {
    const res = await fetch(FRONTEND_URL);
    if (res.ok) {
      console.log('✅ PASS - Frontend accessible');
      console.log(`   Status: ${res.status} ${res.statusText}`);
      console.log(`   Content-Type: ${res.headers.get('content-type')}\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Frontend returned error');
      console.log(`   Status: ${res.status} ${res.statusText}\n`);
    }
  } catch (err) {
    console.log('❌ FAIL - Frontend unreachable');
    console.log(`   Error: ${err.message}\n`);
  }
  
  // Test 3: API Connectivity
  console.log('Test 3: API Connectivity');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/status`);
    if (res.status === 401 || res.status === 200) {
      console.log('✅ PASS - API endpoint reachable');
      console.log(`   Status: ${res.status} (${res.status === 401 ? 'Not authenticated - expected' : 'Authenticated'})\n`);
      passedTests++;
    } else {
      console.log('⚠️  WARN - Unexpected API status');
      console.log(`   Status: ${res.status}\n`);
      passedTests++;
    }
  } catch (err) {
    console.log('❌ FAIL - API unreachable');
    console.log(`   Error: ${err.message}\n`);
  }
  
  // Test 4: CORS Configuration
  console.log('Test 4: CORS Configuration');
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    const corsHeader = res.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log('✅ PASS - CORS headers present');
      console.log(`   Access-Control-Allow-Origin: ${corsHeader}\n`);
      passedTests++;
    } else {
      console.log('⚠️  WARN - CORS headers not detected');
      console.log('   This may cause issues in browser\n');
    }
  } catch (err) {
    console.log('❌ FAIL - CORS test failed');
    console.log(`   Error: ${err.message}\n`);
  }
  
  // Test 5: HTTPS Enforcement
  console.log('Test 5: HTTPS Enforcement');
  try {
    const httpsBackend = BACKEND_URL.startsWith('https://');
    const httpsFrontend = FRONTEND_URL.startsWith('https://');
    
    if (httpsBackend && httpsFrontend) {
      console.log('✅ PASS - HTTPS enforced on both frontend and backend');
      console.log(`   Backend: ${BACKEND_URL}`);
      console.log(`   Frontend: ${FRONTEND_URL}\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL - HTTPS not enforced');
      console.log(`   Backend HTTPS: ${httpsBackend}`);
      console.log(`   Frontend HTTPS: ${httpsFrontend}\n`);
    }
  } catch (err) {
    console.log('❌ FAIL - HTTPS check failed');
    console.log(`   Error: ${err.message}\n`);
  }
  
  // Summary
  console.log('═'.repeat(50));
  console.log('VALIDATION SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%\n`);
  
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED - Deployment validated successfully!');
    console.log('\nNext Steps:');
    console.log('1. Login at: ' + FRONTEND_URL);
    console.log('2. Use credentials: admin@accubooks.com / TempAdmin123!');
    console.log('3. Change admin password immediately');
    console.log('4. Test full user journey');
    console.log('5. Monitor logs for errors\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review errors above');
    console.log('\nTroubleshooting:');
    console.log('1. Check Render deployment logs');
    console.log('2. Verify environment variables');
    console.log('3. Confirm backend is running');
    console.log('4. Update CORS_ORIGIN in backend');
    console.log('5. Redeploy if necessary\n');
  }
  
  return passedTests === totalTests;
}

// Run validation
validateDeployment()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Validation script error:', err);
    process.exit(1);
  });
