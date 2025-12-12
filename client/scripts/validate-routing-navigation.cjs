const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validateRoutingNavigation() {
  console.log('🧭 Phase 4: Routing & Navigation Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check React Router configuration
  console.log('🛣️  React Router Configuration Analysis:');
  
  const routerFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/router/index.tsx',
    'src/routes/index.tsx',
    'src/App.tsx'
  ];
  
  let routerConfigFound = false;
  let routeDefinitions = 0;
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for React Router imports
        const hasRouter = content.includes('react-router-dom') || 
                         content.includes('BrowserRouter') || 
                         content.includes('Routes') || 
                         content.includes('Route');
        
        if (hasRouter) {
          routerConfigFound = true;
          console.log(`  ✅ Router configuration found in ${path.basename(file)}`);
          
          // Count route definitions
          const routeMatches = content.match(/<Route[^>]*>/g) || [];
          routeDefinitions += routeMatches.length;
          
          // Check for essential routing patterns
          const hasBrowserRouter = content.includes('BrowserRouter');
          const hasRoutes = content.includes('<Routes>');
          const hasRouteComponents = content.includes('element=') || content.includes('component=');
          
          console.log(`    📊 Routes defined: ${routeMatches.length}`);
          console.log(`    ${hasBrowserRouter ? '✅' : '❌'} BrowserRouter configured`);
          console.log(`    ${hasRoutes ? '✅' : '❌'} Routes container used`);
          console.log(`    ${hasRouteComponents ? '✅' : '❌'} Route components specified`);
          
          if (!hasBrowserRouter) {
            issues.push('BrowserRouter not configured');
          }
          if (!hasRoutes) {
            issues.push('Routes container not used');
          }
          if (!hasRouteComponents) {
            issues.push('Route components not properly specified');
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  if (routerConfigFound && routeDefinitions >= 5) {
    score++;
    console.log('  ✅ React Router is properly configured');
  } else {
    console.log('  ❌ React Router configuration needs improvement');
    issues.push('React Router not properly configured or insufficient routes');
  }
  
  // 2. Analyze route structure
  console.log('\n📍 Route Structure Analysis:');
  
  const essentialRoutes = [
    '/',
    '/dashboard',
    '/auth/signin',
    '/auth/signup',
    '/settings',
    '/profile',
    '/unauthorized',
    '/404'
  ];
  
  let foundRoutes = [];
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        essentialRoutes.forEach(route => {
          if (content.includes(`path="${route}"`) || content.includes(`path='${route}'`)) {
            foundRoutes.push(route);
          }
        });
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  📊 Essential routes found: ${foundRoutes.length}/${essentialRoutes.length}`);
  
  essentialRoutes.forEach(route => {
    console.log(`    ${foundRoutes.includes(route) ? '✅' : '❌'} ${route}`);
  });
  
  if (foundRoutes.length >= essentialRoutes.length * 0.7) {
    score++;
    console.log('  ✅ Essential route structure is present');
  } else {
    console.log('  ❌ Essential route structure missing');
    issues.push('Missing essential routes');
  }
  
  // 3. Check authentication protection
  console.log('\n🔐 Authentication Protection Analysis:');
  
  let protectedRoutes = 0;
  let authComponents = 0;
  
  if (fs.existsSync('src/components/ProtectedRoute.tsx')) {
    authComponents++;
    console.log('  ✅ ProtectedRoute component found');
  }
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for protected route patterns
        if (content.includes('ProtectedRoute') || content.includes('PrivateRoute')) {
          const protectedMatches = content.match(/<ProtectedRoute[^>]*>/g) || [];
          protectedRoutes += protectedMatches.length;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  🛡️  Protected routes: ${protectedRoutes}`);
  console.log(`  🔐 Auth components: ${authComponents}`);
  
  if (authComponents >= 1 && protectedRoutes >= 3) {
    score++;
    console.log('  ✅ Authentication protection is implemented');
  } else {
    console.log('  ❌ Authentication protection needs improvement');
    issues.push('Insufficient authentication protection');
  }
  
  // 4. Check navigation components
  console.log('\n🧭 Navigation Components Analysis:');
  
  const navigationFiles = [
    'src/components/navigation/PrimaryNavigation.tsx',
    'src/components/navigation/Navigation.tsx',
    'src/components/layout/Navigation.tsx',
    'src/components/layout/Header.tsx',
    'src/components/layout/Navbar.tsx',
    'src/components/Navigation.tsx'
  ];
  
  let navigationComponents = 0;
  let navigationLinks = 0;
  
  navigationFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        navigationComponents++;
        
        // Count navigation links
        const linkMatches = content.match(/<NavLink[^>]*>|<Link[^>]*>/g) || [];
        navigationLinks += linkMatches.length;
        
        console.log(`  ✅ Navigation component: ${path.basename(file)} (${linkMatches.length} links)`);
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${path.basename(file)}`);
      }
    }
  });
  
  console.log(`  📊 Navigation components: ${navigationComponents}`);
  console.log(`  🔗 Navigation links: ${navigationLinks}`);
  
  if (navigationComponents >= 1 && navigationLinks >= 5) {
    score++;
    console.log('  ✅ Navigation components are properly implemented');
  } else {
    console.log('  ❌ Navigation components need improvement');
    issues.push('Insufficient navigation components or links');
  }
  
  // 5. Check for broken routes and 404 handling
  console.log('\n🚫 Broken Routes and 404 Handling Analysis:');
  
  let has404Route = false;
  let hasNotFoundComponent = false;
  
  // Check for 404 route
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('path="*"') || content.includes('path="/*"') || content.includes('/404')) {
          has404Route = true;
          console.log('  ✅ 404 route found');
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  // Check for NotFound component
  const notFoundFiles = [
    'src/components/NotFound.tsx',
    'src/components/404.tsx',
    'src/pages/NotFound.tsx',
    'src/pages/404.tsx'
  ];
  
  notFoundFiles.forEach(file => {
    if (fs.existsSync(file)) {
      hasNotFoundComponent = true;
      console.log(`  ✅ NotFound component found: ${path.basename(file)}`);
    }
  });
  
  if (has404Route && hasNotFoundComponent) {
    score++;
    console.log('  ✅ 404 handling is properly implemented');
  } else {
    console.log('  ❌ 404 handling needs improvement');
    issues.push('Missing 404 route or NotFound component');
  }
  
  // 6. Check for deep linking support
  console.log('\n🔗 Deep Linking Support Analysis:');
  
  let supportsDeepLinking = true;
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for BrowserRouter (required for deep linking)
        if (!content.includes('BrowserRouter')) {
          supportsDeepLinking = false;
        }
        
        // Check for proper route structure
        if (!content.includes('<Routes>') || !content.includes('<Route')) {
          supportsDeepLinking = false;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  ${supportsDeepLinking ? '✅' : '❌'} Deep linking support`);
  
  if (supportsDeepLinking) {
    score++;
    console.log('  ✅ Deep linking is supported');
  } else {
    console.log('  ❌ Deep linking support needs improvement');
    issues.push('Deep linking not properly supported');
  }
  
  // 7. Check navigation accessibility
  console.log('\n♿ Navigation Accessibility Analysis:');
  
  let accessibleNavigation = true;
  let ariaLabels = 0;
  let semanticNav = 0;
  
  navigationFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for ARIA labels
        if (content.includes('aria-label') || content.includes('aria-labelledby')) {
          ariaLabels++;
        }
        
        // Check for semantic navigation elements
        if (content.includes('<nav') || content.includes('<header') || content.includes('role="navigation"')) {
          semanticNav++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  🏷️  ARIA labels: ${ariaLabels} components`);
  console.log(`  📄 Semantic navigation: ${semanticNav} components`);
  
  if (ariaLabels >= 1 && semanticNav >= 1) {
    score++;
    console.log('  ✅ Navigation accessibility is good');
  } else {
    console.log('  ❌ Navigation accessibility needs improvement');
    issues.push('Navigation lacks proper accessibility features');
  }
  
  // 8. Check route-based code splitting
  console.log('\n📦 Route-based Code Splitting Analysis:');
  
  let codeSplitting = false;
  let lazyRoutes = 0;
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for lazy loading patterns
        if (content.includes('React.lazy') || content.includes('lazy(')) {
          codeSplitting = true;
          const lazyMatches = content.match(/React\.lazy\([^)]+\)/g) || [];
          lazyRoutes += lazyMatches.length;
        }
        
        // Check for Suspense
        if (content.includes('Suspense')) {
          codeSplitting = true;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  ⚡ Lazy routes: ${lazyRoutes}`);
  console.log(`  🔄 Code splitting: ${codeSplitting ? '✅' : '❌'}`);
  
  if (codeSplitting && lazyRoutes >= 2) {
    score++;
    console.log('  ✅ Route-based code splitting is implemented');
  } else {
    console.log('  ⚠️  Consider implementing route-based code splitting');
    issues.push('Route-based code splitting not implemented');
  }
  
  // 9. Check route parameters and query strings
  console.log('\n🔍 Route Parameters and Query Strings Analysis:');
  
  let dynamicRoutes = 0;
  let parameterizedRoutes = 0;
  
  routerFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for dynamic routes
        const paramMatches = content.match(/path="[^"]*:[^"]*"/g) || [];
        dynamicRoutes += paramMatches.length;
        
        // Check for parameterized routes
        if (content.includes(':') && content.includes('path=')) {
          parameterizedRoutes++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
  
  console.log(`  🔄 Dynamic routes: ${dynamicRoutes}`);
  console.log(`  📝 Parameterized routes: ${parameterizedRoutes}`);
  
  if (dynamicRoutes >= 2) {
    score++;
    console.log('  ✅ Dynamic routing is implemented');
  } else {
    console.log('  ⚠️  Consider adding dynamic routes');
    issues.push('Dynamic routing not implemented');
  }
  
  // 10. Check navigation state management
  console.log('\n🔄 Navigation State Management Analysis:');
  
  let navigationState = false;
  let useNavigationHooks = 0;
  
  // Check for navigation hooks usage
  const sourceFiles = getSourceFiles('src');
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('useNavigate') || content.includes('useLocation') || content.includes('useParams')) {
        useNavigationHooks++;
        navigationState = true;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🎣 Navigation hooks usage: ${useNavigationHooks} files`);
  
  if (navigationState && useNavigationHooks >= 2) {
    score++;
    console.log('  ✅ Navigation state management is implemented');
  } else {
    console.log('  ❌ Navigation state management needs improvement');
    issues.push('Navigation state management not properly implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 4 Results:');
  console.log(`  🎯 Routing & Navigation Score: ${score}/${maxScore} (${percentage}%)`);
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
  
  console.log(`\n🎯 Phase 4 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 5');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 5');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual routing issues'] : []
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
  validateRoutingNavigation();
}

module.exports = { validateRoutingNavigation };
