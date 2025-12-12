const fs = require('fs');
const path = require('path');

function validatePerformanceOptimization() {
  console.log('⚡ Phase 7: Performance & Optimization Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check bundle size and optimization
  console.log('📦 Bundle Size Analysis:');
  
  const buildFiles = [
    'dist/index.html',
    'dist/assets/index.js',
    'dist/assets/index.css',
    'build/static/js/*.js',
    'build/static/css/*.css'
  ];
  
  let bundleSize = 0;
  let mainBundleFound = false;
  let codeSplittingFound = false;
  let minificationFound = false;
  
  // Check for build configuration
  const viteConfig = fs.existsSync('vite.config.ts') ? fs.readFileSync('vite.config.ts', 'utf8') : '';
  const packageJson = fs.existsSync('package.json') ? JSON.parse(fs.readFileSync('package.json', 'utf8')) : {};
  
  // Check for optimization plugins
  if (viteConfig.includes('rollupOptions') || viteConfig.includes('manualChunks')) {
    codeSplittingFound = true;
    console.log('  ✅ Code splitting configured');
  }
  
  if (viteConfig.includes('minify') || packageJson.build?.minify) {
    minificationFound = true;
    console.log('  ✅ Minification configured');
  }
  
  if (viteConfig.includes('terser') || viteConfig.includes('esbuild')) {
    console.log('  ✅ Advanced optimization configured');
  }
  
  // Check for lazy loading patterns
  const sourceFiles = getSourceFiles('src');
  let lazyImports = 0;
  let dynamicImports = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('React.lazy') || content.includes('lazy(')) {
        lazyImports++;
      }
      
      if (content.includes('import(') || content.includes('dynamic import')) {
        dynamicImports++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🔄 Lazy imports: ${lazyImports} files`);
  console.log(`  ⚡ Dynamic imports: ${dynamicImports} files`);
  
  if (codeSplittingFound && lazyImports >= 3) {
    score++;
    console.log('  ✅ Bundle optimization is well implemented');
  } else {
    console.log('  ❌ Bundle optimization needs improvement');
    issues.push('Bundle optimization not well implemented');
  }
  
  // 2. Analyze component performance
  console.log('\n🧩 Component Performance Analysis:');
  
  let memoizedComponents = 0;
  let useCallbackUsage = 0;
  let useMemoUsage = 0;
  let optimizedRenders = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('React.memo') || content.includes('memo(')) {
        memoizedComponents++;
      }
      
      if (content.includes('useCallback')) {
        useCallbackUsage++;
      }
      
      if (content.includes('useMemo')) {
        useMemoUsage++;
      }
      
      if (content.includes('shouldComponentUpdate') || content.includes('PureComponent')) {
        optimizedRenders++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🧠 Memoized components: ${memoizedComponents} files`);
  console.log(`  🎣 useCallback usage: ${useCallbackUsage} files`);
  console.log(`  💭 useMemo usage: ${useMemoUsage} files`);
  console.log(`  ⚡ Optimized renders: ${optimizedRenders} files`);
  
  if (memoizedComponents >= 5 && useCallbackUsage >= 3) {
    score++;
    console.log('  ✅ Component performance is well optimized');
  } else {
    console.log('  ❌ Component performance needs improvement');
    issues.push('Component performance not well optimized');
  }
  
  // 3. Check asset optimization
  console.log('\n🖼️  Asset Optimization Analysis:');
  
  let imageOptimization = 0;
  let fontOptimization = 0;
  let assetCompression = 0;
  let cdnUsage = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('webp') || content.includes('avif') || content.includes('optimized')) {
        imageOptimization++;
      }
      
      if (content.includes('font-display') || content.includes('preload')) {
        fontOptimization++;
      }
      
      if (content.includes('compression') || content.includes('gzip') || content.includes('brotli')) {
        assetCompression++;
      }
      
      if (content.includes('cdn') || content.includes('cloudflare') || content.includes('jsdelivr')) {
        cdnUsage++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🖼️  Image optimization: ${imageOptimization} files`);
  console.log(`  🔤 Font optimization: ${fontOptimization} files`);
  console.log(`  📦 Asset compression: ${assetCompression} files`);
  console.log(`  🌐 CDN usage: ${cdnUsage} files`);
  
  if (imageOptimization >= 2 || assetCompression >= 1) {
    score++;
    console.log('  ✅ Asset optimization is well implemented');
  } else {
    console.log('  ❌ Asset optimization needs improvement');
    issues.push('Asset optimization not well implemented');
  }
  
  // 4. Check caching strategies
  console.log('\n💾 Caching Strategies Analysis:');
  
  let browserCaching = 0;
  let serviceWorker = 0;
  let localStorageUsage = 0;
  let sessionStorageUsage = 0;
  let apiCaching = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('Cache-Control') || content.includes('ETag') || content.includes('Last-Modified')) {
        browserCaching++;
      }
      
      if (content.includes('serviceWorker') || content.includes('sw.js') || content.includes('manifest.json')) {
        serviceWorker++;
      }
      
      if (content.includes('localStorage')) {
        localStorageUsage++;
      }
      
      if (content.includes('sessionStorage')) {
        sessionStorageUsage++;
      }
      
      if (content.includes('useQuery') || content.includes('staleTime') || content.includes('cacheTime')) {
        apiCaching++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🌐 Browser caching: ${browserCaching} files`);
  console.log(`  🔧 Service Worker: ${serviceWorker} files`);
  console.log(`  💾 localStorage usage: ${localStorageUsage} files`);
  console.log(`  🔄 sessionStorage usage: ${sessionStorageUsage} files`);
  console.log(`  ⚡ API caching: ${apiCaching} files`);
  
  if (apiCaching >= 2 || localStorageUsage >= 5) {
    score++;
    console.log('  ✅ Caching strategies are well implemented');
  } else {
    console.log('  ❌ Caching strategies need improvement');
    issues.push('Caching strategies not well implemented');
  }
  
  // 5. Check network optimization
  console.log('\n🌐 Network Optimization Analysis:');
  
  let requestOptimization = 0;
  let compressionEnabled = 0;
  let prefetching = 0;
  let connectionPooling = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('debounce') || content.includes('throttle') || content.includes('batch')) {
        requestOptimization++;
      }
      
      if (content.includes('gzip') || content.includes('deflate') || content.includes('br')) {
        compressionEnabled++;
      }
      
      if (content.includes('prefetch') || content.includes('preload') || content.includes('dns-prefetch')) {
        prefetching++;
      }
      
      if (content.includes('keep-alive') || content.includes('connection')) {
        connectionPooling++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ⚡ Request optimization: ${requestOptimization} files`);
  console.log(`  📦 Compression enabled: ${compressionEnabled} files`);
  console.log(`  🔍 Prefetching: ${prefetching} files`);
  console.log(`  🔗 Connection pooling: ${connectionPooling} files`);
  
  if (requestOptimization >= 2 || compressionEnabled >= 1) {
    score++;
    console.log('  ✅ Network optimization is well implemented');
  } else {
    console.log('  ❌ Network optimization needs improvement');
    issues.push('Network optimization not well implemented');
  }
  
  // 6. Check rendering performance
  console.log('\n🎨 Rendering Performance Analysis:');
  
  let virtualScrolling = 0;
  let lazyLoading = 0;
  let suspenseUsage = 0;
  let concurrentRendering = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('virtual') || content.includes('react-window') || content.includes('react-virtualized')) {
        virtualScrolling++;
      }
      
      if (content.includes('IntersectionObserver') || content.includes('lazy')) {
        lazyLoading++;
      }
      
      if (content.includes('Suspense') || content.includes('React.Suspense')) {
        suspenseUsage++;
      }
      
      if (content.includes('startTransition') || content.includes('useTransition')) {
        concurrentRendering++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📜 Virtual scrolling: ${virtualScrolling} files`);
  console.log(`  ⏳ Lazy loading: ${lazyLoading} files`);
  console.log(`  ⏸️  Suspense usage: ${suspenseUsage} files`);
  console.log(`  🔄 Concurrent rendering: ${concurrentRendering} files`);
  
  if (lazyLoading >= 3 && suspenseUsage >= 2) {
    score++;
    console.log('  ✅ Rendering performance is well optimized');
  } else {
    console.log('  ❌ Rendering performance needs improvement');
    issues.push('Rendering performance not well optimized');
  }
  
  // 7. Check memory management
  console.log('\n🧠 Memory Management Analysis:');
  
  let memoryCleanup = 0;
  let eventListenerCleanup = 0;
  let intervalCleanup = 0;
  let weakReferences = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('cleanup') || content.includes('unmount') || content.includes('destroy')) {
        memoryCleanup++;
      }
      
      if (content.includes('removeEventListener') || content.includes('abort')) {
        eventListenerCleanup++;
      }
      
      if (content.includes('clearInterval') || content.includes('clearTimeout')) {
        intervalCleanup++;
      }
      
      if (content.includes('WeakMap') || content.includes('WeakSet') || content.includes('WeakRef')) {
        weakReferences++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🧹 Memory cleanup: ${memoryCleanup} files`);
  console.log(`  🎧 Event listener cleanup: ${eventListenerCleanup} files`);
  console.log(`  ⏰ Interval cleanup: ${intervalCleanup} files`);
  console.log(`  💪 Weak references: ${weakReferences} files`);
  
  if (memoryCleanup >= 5 && eventListenerCleanup >= 3) {
    score++;
    console.log('  ✅ Memory management is well implemented');
  } else {
    console.log('  ❌ Memory management needs improvement');
    issues.push('Memory management not well implemented');
  }
  
  // 8. Check performance monitoring
  console.log('\n📊 Performance Monitoring Analysis:');
  
  let performanceMetrics = 0;
  let errorTracking = 0;
  let userTiming = 0;
  let coreWebVitals = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('performance') || content.includes('measure') || content.includes('mark')) {
        performanceMetrics++;
      }
      
      if (content.includes('error') && content.includes('tracking') || content.includes('sentry')) {
        errorTracking++;
      }
      
      if (content.includes('userTiming') || content.includes('performance.mark')) {
        userTiming++;
      }
      
      if (content.includes('LCP') || content.includes('FID') || content.includes('CLS') || content.includes('web-vitals')) {
        coreWebVitals++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📈 Performance metrics: ${performanceMetrics} files`);
  console.log(`  🚨 Error tracking: ${errorTracking} files`);
  console.log(`  ⏱️  User timing: ${userTiming} files`);
  console.log(`  🎯 Core Web Vitals: ${coreWebVitals} files`);
  
  if (performanceMetrics >= 2 || errorTracking >= 1) {
    score++;
    console.log('  ✅ Performance monitoring is well implemented');
  } else {
    console.log('  ❌ Performance monitoring needs improvement');
    issues.push('Performance monitoring not well implemented');
  }
  
  // 9. Check SEO and accessibility performance
  console.log('\n🔍 SEO & Accessibility Performance Analysis:');
  
  let metaTags = 0;
  let structuredData = 0;
  let accessibilityOptimizations = 0;
  let ssrOrSSG = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('meta') || content.includes('title') || content.includes('description')) {
        metaTags++;
      }
      
      if (content.includes('json-ld') || content.includes('structured') || content.includes('schema')) {
        structuredData++;
      }
      
      if (content.includes('aria') || content.includes('role') || content.includes('alt')) {
        accessibilityOptimizations++;
      }
      
      if (content.includes('SSR') || content.includes('SSG') || content.includes('server')) {
        ssrOrSSG++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🏷️  Meta tags: ${metaTags} files`);
  console.log(`  📊 Structured data: ${structuredData} files`);
  console.log(`  ♿ Accessibility optimizations: ${accessibilityOptimizations} files`);
  console.log(`  🖥️  SSR/SSG: ${ssrOrSSG} files`);
  
  if (metaTags >= 5 && accessibilityOptimizations >= 10) {
    score++;
    console.log('  ✅ SEO & accessibility performance is well optimized');
  } else {
    console.log('  ❌ SEO & accessibility performance needs improvement');
    issues.push('SEO & accessibility performance not well optimized');
  }
  
  // 10. Check development and build performance
  console.log('\n🛠️  Development & Build Performance Analysis:');
  
  let buildOptimization = 0;
  let devServerOptimization = 0;
  let hotReload = 0;
  let incrementalBuild = 0;
  
  // Check build configuration
  if (viteConfig.includes('build.rollupOptions')) {
    buildOptimization++;
  }
  
  if (viteConfig.includes('server.hmr')) {
    hotReload++;
  }
  
  if (viteConfig.includes('optimizeDeps')) {
    devServerOptimization++;
  }
  
  if (packageJson.scripts?.build?.includes('incremental') || viteConfig.includes('watch')) {
    incrementalBuild++;
  }
  
  console.log(`  🔨 Build optimization: ${buildOptimization} configurations`);
  console.log(`  🖥️  Dev server optimization: ${devServerOptimization} configurations`);
  console.log(`  🔥 Hot reload: ${hotReload} configurations`);
  console.log(`  ⚡ Incremental build: ${incrementalBuild} configurations`);
  
  if (buildOptimization >= 1 && devServerOptimization >= 1) {
    score++;
    console.log('  ✅ Development & build performance is well optimized');
  } else {
    console.log('  ❌ Development & build performance needs improvement');
    issues.push('Development & build performance not well optimized');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 7 Results:');
  console.log(`  🎯 Performance & Optimization Score: ${score}/${maxScore} (${percentage}%)`);
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
  
  console.log(`\n🎯 Phase 7 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 8');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 8');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual performance optimization issues'] : []
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
  validatePerformanceOptimization();
}

module.exports = { validatePerformanceOptimization };
