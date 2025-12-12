const fs = require('fs');
const path = require('path');

function validateApiStateManagement() {
  console.log('🔗 Phase 5: API Integration & State Management Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check API configuration and setup
  console.log('🌐 API Configuration Analysis:');
  
  const apiFiles = [
    'src/api/index.ts',
    'src/api/client.ts',
    'src/lib/api.ts',
    'src/services/api.ts',
    'src/utils/api.ts'
  ];
  
  let apiConfigFound = false;
  let axiosConfigured = false;
  let baseUrls = [];
  
  apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for API configuration
        if (content.includes('axios') || content.includes('fetch')) {
          apiConfigFound = true;
          console.log(`  ✅ API configuration found in ${path.basename(file)}`);
          
          // Check for axios usage
          if (content.includes('axios')) {
            axiosConfigured = true;
            console.log('    ✅ Axios configured');
          }
          
          // Check for base URLs
          const baseUrlMatches = content.match(/baseURL|base_url|BASE_URL/g) || [];
          if (baseUrlMatches.length > 0) {
            baseUrls.push(...baseUrlMatches);
            console.log(`    📊 Base URL configurations: ${baseUrlMatches.length}`);
          }
          
          // Check for environment variable usage
          const envVarMatches = content.match(/import\.meta\.env|process\.env/g) || [];
          if (envVarMatches.length > 0) {
            console.log(`    🔧 Environment variables: ${envVarMatches.length}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  if (apiConfigFound && axiosConfigured) {
    score++;
    console.log('  ✅ API configuration is properly set up');
  } else {
    console.log('  ❌ API configuration needs improvement');
    issues.push('API configuration not properly set up');
  }
  
  // 2. Analyze API endpoints and services
  console.log('\n📡 API Endpoints Analysis:');
  
  const serviceFiles = [
    'src/services/auth.service.ts',
    'src/services/user.service.ts',
    'src/services/customer.service.ts',
    'src/services/invoice.service.ts',
    'src/services/report.service.ts',
    'src/api/auth.ts',
    'src/api/customers.ts',
    'src/api/invoices.ts',
    'src/api/reports.ts'
  ];
  
  let apiEndpoints = 0;
  let serviceMethods = [];
  
  serviceFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Count API endpoints
        const endpointMatches = content.match(/\/api\/[a-zA-Z0-9\/\-_]+/g) || [];
        apiEndpoints += endpointMatches.length;
        
        // Check for HTTP methods
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
        httpMethods.forEach(method => {
          if (content.includes(`${method}(`) || content.includes(`.${method}`)) {
            serviceMethods.push(method);
          }
        });
        
        if (endpointMatches.length > 0) {
          console.log(`  ✅ API service: ${path.basename(file)} (${endpointMatches.length} endpoints)`);
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  console.log(`  📊 Total API endpoints: ${apiEndpoints}`);
  console.log(`  🔧 HTTP methods used: ${[...new Set(serviceMethods)].join(', ')}`);
  
  if (apiEndpoints >= 10) {
    score++;
    console.log('  ✅ Sufficient API endpoints defined');
  } else {
    console.log('  ❌ Insufficient API endpoints');
    issues.push('Insufficient API endpoints defined');
  }
  
  // 3. Check state management setup
  console.log('\n🗄️  State Management Analysis:');
  
  const stateManagementFiles = [
    'src/store/index.ts',
    'src/store/store.ts',
    'src/store/auth-store.ts',
    'src/store/user-store.ts',
    'src/contexts/AuthContext.tsx',
    'src/contexts/UserContext.tsx',
    'src/hooks/useAuth.ts',
    'src/hooks/useUser.ts'
  ];
  
  let stateManagementFound = false;
  let contextConfigured = false;
  let storeConfigured = false;
  let hooksCreated = 0;
  
  stateManagementFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for state management patterns
        if (content.includes('createContext') || content.includes('useContext')) {
          contextConfigured = true;
          console.log(`  ✅ React Context found in ${path.basename(file)}`);
        }
        
        if (content.includes('createStore') || content.includes('configureStore') || content.includes('zustand')) {
          storeConfigured = true;
          console.log(`  ✅ State store found in ${path.basename(file)}`);
        }
        
        if (content.includes('useAuth') || content.includes('useUser') || content.includes('useStore')) {
          hooksCreated++;
          console.log(`  🎣 Custom hook in ${path.basename(file)}`);
        }
        
        stateManagementFound = true;
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  console.log(`  📊 Custom hooks created: ${hooksCreated}`);
  
  if (stateManagementFound && (contextConfigured || storeConfigured)) {
    score++;
    console.log('  ✅ State management is properly configured');
  } else {
    console.log('  ❌ State management needs improvement');
    issues.push('State management not properly configured');
  }
  
  // 4. Check data fetching patterns
  console.log('\n🔄 Data Fetching Patterns Analysis:');
  
  const sourceFiles = getSourceFiles('src');
  let dataFetchingPatterns = [];
  let asyncAwaitUsage = 0;
  let promiseHandling = 0;
  let errorHandling = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for data fetching patterns
      if (content.includes('fetch(') || content.includes('axios.') || content.includes('.get(')) {
        dataFetchingPatterns.push(path.basename(file));
      }
      
      // Check for async/await usage
      if (content.includes('async ') || content.includes('await ')) {
        asyncAwaitUsage++;
      }
      
      // Check for promise handling
      if (content.includes('.then(') || content.includes('.catch(') || content.includes('Promise')) {
        promiseHandling++;
      }
      
      // Check for error handling
      if (content.includes('try {') || content.includes('catch(') || content.includes('throw ')) {
        errorHandling++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📊 Files with data fetching: ${dataFetchingPatterns.length}`);
  console.log(`  ⚡ Async/await usage: ${asyncAwaitUsage} files`);
  console.log(`  🔄 Promise handling: ${promiseHandling} files`);
  console.log(`  🛡️  Error handling: ${errorHandling} files`);
  
  if (dataFetchingPatterns.length >= 5 && asyncAwaitUsage >= 3) {
    score++;
    console.log('  ✅ Data fetching patterns are well implemented');
  } else {
    console.log('  ❌ Data fetching patterns need improvement');
    issues.push('Data fetching patterns not well implemented');
  }
  
  // 5. Check API error handling
  console.log('\n🚨 API Error Handling Analysis:');
  
  let errorBoundaries = 0;
  let apiErrorHandling = 0;
  let retryMechanisms = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for error boundaries
      if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
        errorBoundaries++;
      }
      
      // Check for API error handling
      if (content.includes('catch (error)') || content.includes('.catch(') || content.includes('status >= 400')) {
        apiErrorHandling++;
      }
      
      // Check for retry mechanisms
      if (content.includes('retry') || content.includes('retries') || content.includes('exponential')) {
        retryMechanisms++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛡️  Error boundaries: ${errorBoundaries}`);
  console.log(`  🚨 API error handling: ${apiErrorHandling} files`);
  console.log(`  🔄 Retry mechanisms: ${retryMechanisms} files`);
  
  if (apiErrorHandling >= 5 && errorBoundaries >= 1) {
    score++;
    console.log('  ✅ API error handling is well implemented');
  } else {
    console.log('  ❌ API error handling needs improvement');
    issues.push('API error handling not well implemented');
  }
  
  // 6. Check data validation and type safety
  console.log('\n✅ Data Validation and Type Safety Analysis:');
  
  let typeDefinitions = 0;
  let validationSchemas = 0;
  let interfaceUsage = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for TypeScript interfaces/types
      if (content.includes('interface ') || content.includes('type ')) {
        interfaceUsage++;
      }
      
      // Check for validation schemas
      if (content.includes('zod') || content.includes('yup') || content.includes('joi') || content.includes('validate')) {
        validationSchemas++;
      }
      
      // Check for type definitions
      if (content.includes('export type') || content.includes('export interface')) {
        typeDefinitions++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📝 TypeScript interfaces: ${interfaceUsage} files`);
  console.log(`  ✅ Validation schemas: ${validationSchemas} files`);
  console.log(`  🏷️  Type definitions: ${typeDefinitions} files`);
  
  if (interfaceUsage >= 10 && typeDefinitions >= 5) {
    score++;
    console.log('  ✅ Data validation and type safety are well implemented');
  } else {
    console.log('  ❌ Data validation and type safety need improvement');
    issues.push('Data validation and type safety not well implemented');
  }
  
  // 7. Check caching mechanisms
  console.log('\n💾 Caching Mechanisms Analysis:');
  
  let cachingImplemented = 0;
  let localStorageUsage = 0;
  let sessionStorageUsage = 0;
  let queryClientUsage = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for caching patterns
      if (content.includes('cache') || content.includes('Cache')) {
        cachingImplemented++;
      }
      
      // Check for localStorage usage
      if (content.includes('localStorage')) {
        localStorageUsage++;
      }
      
      // Check for sessionStorage usage
      if (content.includes('sessionStorage')) {
        sessionStorageUsage++;
      }
      
      // Check for React Query usage
      if (content.includes('useQuery') || content.includes('QueryClient') || content.includes('@tanstack')) {
        queryClientUsage++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  💾 Caching implemented: ${cachingImplemented} files`);
  console.log(`  📱 localStorage usage: ${localStorageUsage} files`);
  console.log(`  🔄 sessionStorage usage: ${sessionStorageUsage} files`);
  console.log(`  ⚡ React Query usage: ${queryClientUsage} files`);
  
  if (cachingImplemented >= 2 || queryClientUsage >= 1) {
    score++;
    console.log('  ✅ Caching mechanisms are implemented');
  } else {
    console.log('  ⚠️  Consider implementing caching mechanisms');
    issues.push('Caching mechanisms not implemented');
  }
  
  // 8. Check API response handling
  console.log('\n📨 API Response Handling Analysis:');
  
  let responseParsing = 0;
  let dataTransformation = 0;
  let responseValidation = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for response parsing
      if (content.includes('.json()') || content.includes('response.data') || content.includes('data:')) {
        responseParsing++;
      }
      
      // Check for data transformation
      if (content.includes('map(') || content.includes('transform') || content.includes('format')) {
        dataTransformation++;
      }
      
      // Check for response validation
      if (content.includes('validate') && content.includes('response')) {
        responseValidation++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📨 Response parsing: ${responseParsing} files`);
  console.log(`  🔄 Data transformation: ${dataTransformation} files`);
  console.log(`  ✅ Response validation: ${responseValidation} files`);
  
  if (responseParsing >= 5) {
    score++;
    console.log('  ✅ API response handling is well implemented');
  } else {
    console.log('  ❌ API response handling needs improvement');
    issues.push('API response handling not well implemented');
  }
  
  // 9. Check loading and optimistic updates
  console.log('\n⏳ Loading States and Optimistic Updates Analysis:');
  
  let loadingStates = 0;
  let optimisticUpdates = 0;
  let skeletonComponents = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for loading states
      if (content.includes('loading') || content.includes('isLoading') || content.includes('isPending')) {
        loadingStates++;
      }
      
      // Check for optimistic updates
      if (content.includes('optimistic') || content.includes('onMutate') || content.includes('rollback')) {
        optimisticUpdates++;
      }
      
      // Check for skeleton components
      if (content.includes('Skeleton') || content.includes('skeleton')) {
        skeletonComponents++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ⏳ Loading states: ${loadingStates} files`);
  console.log(`  🚀 Optimistic updates: ${optimisticUpdates} files`);
  console.log(`  💀 Skeleton components: ${skeletonComponents} files`);
  
  if (loadingStates >= 5) {
    score++;
    console.log('  ✅ Loading states are well implemented');
  } else {
    console.log('  ❌ Loading states need improvement');
    issues.push('Loading states not well implemented');
  }
  
  // 10. Check API testing
  console.log('\n🧪 API Testing Analysis:');
  
  let apiTests = 0;
  let mockServices = 0;
  let integrationTests = 0;
  
  const testFiles = sourceFiles.filter(file => 
    file.includes('.test.') || file.includes('.spec.')
  );
  
  testFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for API tests
      if (content.includes('fetch') || content.includes('axios') || content.includes('api')) {
        apiTests++;
      }
      
      // Check for mock services
      if (content.includes('mock') || content.includes('vi.mock') || content.includes('jest.mock')) {
        mockServices++;
      }
      
      // Check for integration tests
      if (content.includes('integration') || content.includes('e2e') || content.includes('end-to-end')) {
        integrationTests++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🧪 API tests: ${apiTests} files`);
  console.log(`  🎭 Mock services: ${mockServices} files`);
  console.log(`  🔗 Integration tests: ${integrationTests} files`);
  
  if (apiTests >= 3 && mockServices >= 2) {
    score++;
    console.log('  ✅ API testing is well implemented');
  } else {
    console.log('  ❌ API testing needs improvement');
    issues.push('API testing not well implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 5 Results:');
  console.log(`  🎯 API Integration & State Management Score: ${score}/${maxScore} (${percentage}%)`);
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
  
  console.log(`\n🎯 Phase 5 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 6');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 6');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual API and state management issues'] : []
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
  validateApiStateManagement();
}

module.exports = { validateApiStateManagement };
