const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validateComponentStructure() {
  console.log('🧩 Phase 3: Component & UI Structure Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Analyze React component structure
  console.log('⚛️  React Component Analysis:');
  
  const componentFiles = getComponentFiles('src/components');
  let validComponents = 0;
  let deadComponents = 0;
  let componentsWithTests = 0;
  
  console.log(`  📊 Found ${componentFiles.length} component files`);
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file, path.extname(file));
      
      // Check for proper React component structure
      const hasReactImport = content.includes('import React') || content.includes('from \'react\'');
      const hasExportDefault = content.includes('export default');
      const hasFunctionOrClass = content.includes('function') || content.includes('const') || content.includes('class');
      const hasJSX = content.includes('<') && content.includes('>');
      
      if (hasReactImport && hasExportDefault && hasFunctionOrClass && hasJSX) {
        validComponents++;
      } else {
        console.log(`    ⚠️  ${fileName} may have structural issues`);
        issues.push(`Component ${fileName} has structural issues`);
      }
      
      // Check for test files
      const testFile = file.replace(/\.tsx?$/, '.test.tsx').replace(/\.jsx?$/, '.test.jsx');
      const specFile = file.replace(/\.tsx?$/, '.spec.tsx').replace(/\.jsx?$/, '.spec.jsx');
      
      if (fs.existsSync(testFile) || fs.existsSync(specFile)) {
        componentsWithTests++;
      }
      
      // Check for dead components (not imported anywhere)
      const isImported = checkIfComponentIsImported(fileName, 'src');
      if (!isImported && !fileName.includes('index') && !fileName.includes('test')) {
        deadComponents++;
        console.log(`    💀 ${fileName} appears to be unused`);
        issues.push(`Component ${fileName} appears to be unused`);
      }
      
    } catch (error) {
      console.log(`    ❌ Cannot analyze ${path.basename(file)}`);
    }
  });
  
  const testCoverage = componentFiles.length > 0 ? (componentsWithTests / componentFiles.length) * 100 : 0;
  console.log(`  ✅ Valid components: ${validComponents}/${componentFiles.length}`);
  console.log(`  🧪 Test coverage: ${Math.round(testCoverage)}%`);
  console.log(`  💀 Dead components: ${deadComponents}`);
  
  if (validComponents >= componentFiles.length * 0.8 && deadComponents <= componentFiles.length * 0.1) {
    score++;
    console.log('  ✅ Component structure is healthy');
  } else {
    console.log('  ❌ Component structure needs attention');
  }
  
  // 2. Check UI consistency
  console.log('\n🎨 UI Consistency Analysis:');
  
  const uiFiles = getUIFiles('src/components/ui');
  let consistentUI = true;
  let uiComponentCount = 0;
  
  console.log(`  📊 Found ${uiFiles.length} UI component files`);
  
  uiFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file, path.extname(file));
      
      // Check for proper UI component structure
      const hasForwardRef = content.includes('forwardRef');
      const hasPropTypes = content.includes('interface Props') || content.includes('type Props');
      const hasVariantSupport = content.includes('variant') || content.includes('size');
      
      uiComponentCount++;
      
      if (!hasForwardRef && !fileName.includes('provider') && !fileName.includes('context')) {
        console.log(`    ⚠️  ${fileName} missing forwardRef`);
        consistentUI = false;
      }
      
      if (!hasPropTypes && !fileName.includes('index')) {
        console.log(`    ⚠️  ${fileName} missing prop types`);
        consistentUI = false;
      }
      
    } catch (error) {
      console.log(`    ❌ Cannot analyze UI component ${path.basename(file)}`);
      consistentUI = false;
    }
  });
  
  if (consistentUI && uiComponentCount >= 10) {
    score++;
    console.log('  ✅ UI components are consistent');
  } else {
    console.log('  ❌ UI components need consistency improvements');
    issues.push('UI components lack consistency in structure');
  }
  
  // 3. Check styling consistency
  console.log('\n🎨 Styling Consistency Analysis:');
  
  const styleFiles = getStyleFiles('src');
  let styledComponents = 0;
  let cssModules = 0;
  let scssFiles = 0;
  let tailwindUsage = 0;
  
  styleFiles.forEach(file => {
    if (file.endsWith('.styled.tsx') || file.endsWith('.styled.ts')) {
      styledComponents++;
    } else if (file.includes('.module.css')) {
      cssModules++;
    } else if (file.endsWith('.scss') || file.endsWith('.sass')) {
      scssFiles++;
    }
  });
  
  // Check for Tailwind usage in component files
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('className=') && /className=.*?(?:bg-|text-|flex|grid|p-|m-)/.test(content)) {
        tailwindUsage++;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🎭 Styled Components: ${styledComponents}`);
  console.log(`  📦 CSS Modules: ${cssModules}`);
  console.log(`  📄 SCSS Files: ${scssFiles}`);
  console.log(`  🎯 Tailwind Usage: ${tailwindUsage} components`);
  
  // Check if there's a consistent styling approach
  const hasConsistentStyling = (styledComponents > 0 && cssModules === 0 && scssFiles === 0) ||
                               (cssModules > 0 && styledComponents === 0 && scssFiles === 0) ||
                               (scssFiles > 0 && styledComponents === 0 && cssModules === 0) ||
                               tailwindUsage > componentFiles.length * 0.5;
  
  if (hasConsistentStyling) {
    score++;
    console.log('  ✅ Consistent styling approach detected');
  } else {
    console.log('  ❌ Mixed styling approaches detected');
    issues.push('Multiple styling approaches without consistency');
  }
  
  // 4. Check accessibility compliance
  console.log('\n♿ Accessibility Compliance Analysis:');
  
  let accessibleComponents = 0;
  let ariaUsage = 0;
  let semanticHTML = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for ARIA attributes
      if (content.includes('aria-') || content.includes('role=')) {
        ariaUsage++;
      }
      
      // Check for semantic HTML
      if (content.includes('<main') || content.includes('<nav') || content.includes('<header') || 
          content.includes('<footer') || content.includes('<section') || content.includes('<article')) {
        semanticHTML++;
      }
      
      // Check for basic accessibility features
      const hasAltText = content.includes('alt=') || !content.includes('<img');
      const hasButtonTypes = content.includes('<button') && (content.includes('type=') || !content.includes('<button'));
      const hasFormLabels = content.includes('<input') && (content.includes('<label') || content.includes('aria-label'));
      
      if (hasAltText && hasButtonTypes && hasFormLabels) {
        accessibleComponents++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🏷️  ARIA usage: ${ariaUsage} components`);
  console.log(`  📄 Semantic HTML: ${semanticHTML} components`);
  console.log(`  ♿ Accessible components: ${accessibleComponents}/${componentFiles.length}`);
  
  const accessibilityScore = componentFiles.length > 0 ? (accessibleComponents / componentFiles.length) * 100 : 0;
  
  if (accessibilityScore >= 70) {
    score++;
    console.log('  ✅ Good accessibility compliance');
  } else {
    console.log('  ❌ Accessibility compliance needs improvement');
    issues.push('Low accessibility compliance in components');
  }
  
  // 5. Check component naming conventions
  console.log('\n📝 Component Naming Conventions:');
  
  let properlyNamedComponents = 0;
  let namingIssues = 0;
  
  componentFiles.forEach(file => {
    try {
      const fileName = path.basename(file, path.extname(file));
      
      // Check for PascalCase naming
      const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(fileName);
      
      if (isPascalCase) {
        properlyNamedComponents++;
      } else {
        namingIssues++;
        console.log(`    ⚠️  ${fileName} should use PascalCase`);
        issues.push(`Component ${fileName} doesn't follow PascalCase convention`);
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  ✅ Properly named: ${properlyNamedComponents}/${componentFiles.length}`);
  
  if (namingIssues <= componentFiles.length * 0.1) {
    score++;
    console.log('  ✅ Component naming conventions are followed');
  } else {
    console.log('  ❌ Component naming conventions need improvement');
  }
  
  // 6. Check for duplicate components
  console.log('\n🔄 Duplicate Component Analysis:');
  
  const componentNames = componentFiles.map(file => 
    path.basename(file, path.extname(file)).toLowerCase()
  );
  
  const duplicates = componentNames.filter((name, index) => 
    componentNames.indexOf(name) !== index
  );
  
  const uniqueDuplicates = [...new Set(duplicates)];
  
  console.log(`  🔄 Duplicate components found: ${uniqueDuplicates.length}`);
  
  if (uniqueDuplicates.length > 0) {
    uniqueDuplicates.forEach(duplicate => {
      console.log(`    ⚠️  ${duplicate} appears multiple times`);
      issues.push(`Duplicate component: ${duplicate}`);
    });
  }
  
  if (uniqueDuplicates.length === 0) {
    score++;
    console.log('  ✅ No duplicate components found');
  } else {
    console.log('  ❌ Duplicate components detected');
  }
  
  // 7. Check component documentation
  console.log('\n📚 Component Documentation Analysis:');
  
  let documentedComponents = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for JSDoc comments or other documentation
      const hasJSDoc = content.includes('/**') && content.includes('*/');
      const hasComment = content.includes('//') && content.includes('Component');
      const hasStorybook = content.includes('.stories');
      
      if (hasJSDoc || hasComment || hasStorybook) {
        documentedComponents++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  const documentationScore = componentFiles.length > 0 ? (documentedComponents / componentFiles.length) * 100 : 0;
  console.log(`  📚 Documented components: ${documentedComponents}/${componentFiles.length} (${Math.round(documentationScore)}%)`);
  
  if (documentationScore >= 50) {
    score++;
    console.log('  ✅ Good component documentation');
  } else {
    console.log('  ❌ Component documentation needs improvement');
    issues.push('Low component documentation coverage');
  }
  
  // 8. Check for proper error boundaries
  console.log('\n🛡️  Error Boundary Analysis:');
  
  let errorBoundaries = 0;
  let errorHandling = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
        errorBoundaries++;
      }
      
      if (content.includes('try') && content.includes('catch') && content.includes('throw')) {
        errorHandling++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🛡️  Error boundaries: ${errorBoundaries}`);
  console.log(`  ⚠️  Error handling: ${errorHandling} components`);
  
  if (errorBoundaries >= 1) {
    score++;
    console.log('  ✅ Error boundaries implemented');
  } else {
    console.log('  ⚠️  Consider adding error boundaries');
    issues.push('No error boundaries found');
  }
  
  // 9. Check for proper state management
  console.log('\n🔄 State Management Analysis:');
  
  let useStateUsage = 0;
  let useContextUsage = 0;
  let customHooksUsage = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('useState')) {
        useStateUsage++;
      }
      
      if (content.includes('useContext') || content.includes('Context')) {
        useContextUsage++;
      }
      
      if (content.includes('use') && content.includes('custom') || content.includes('hooks')) {
        customHooksUsage++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🪝 useState usage: ${useStateUsage} components`);
  console.log(`  📦 useContext usage: ${useContextUsage} components`);
  console.log(`  🎣 Custom hooks: ${customHooksUsage} components`);
  
  if (useStateUsage > 0 || useContextUsage > 0) {
    score++;
    console.log('  ✅ Proper state management patterns detected');
  } else {
    console.log('  ❌ State management patterns need improvement');
    issues.push('Poor state management patterns');
  }
  
  // 10. Check component performance
  console.log('\n⚡ Component Performance Analysis:');
  
  let optimizedComponents = 0;
  let memoUsage = 0;
  let callbackUsage = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('React.memo') || content.includes('memo(')) {
        memoUsage++;
      }
      
      if (content.includes('useCallback') || content.includes('useMemo')) {
        callbackUsage++;
      }
      
      if (content.includes('React.memo') || content.includes('useCallback') || content.includes('useMemo')) {
        optimizedComponents++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  🧠 React.memo usage: ${memoUsage} components`);
  console.log(`  🔄 useCallback/useMemo usage: ${callbackUsage} components`);
  console.log(`  ⚡ Optimized components: ${optimizedComponents}/${componentFiles.length}`);
  
  const performanceScore = componentFiles.length > 0 ? (optimizedComponents / componentFiles.length) * 100 : 0;
  
  if (performanceScore >= 20) {
    score++;
    console.log('  ✅ Good component performance optimization');
  } else {
    console.log('  ⚠️  Consider adding performance optimizations');
    issues.push('Low component performance optimization');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 3 Results:');
  console.log(`  🎯 Component & UI Structure Score: ${score}/${maxScore} (${percentage}%)`);
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
  
  console.log(`\n🎯 Phase 3 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 4');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 4');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual component structure issues'] : []
  };
}

// Helper functions
function getComponentFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx'))) {
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

function getUIFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.' && item !== 'node_modules')) {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx'))) {
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

function getStyleFiles(dir) {
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
          item.endsWith('.css') || 
          item.endsWith('.scss') || 
          item.endsWith('.sass') || 
          item.endsWith('.styled.tsx') || 
          item.endsWith('.styled.ts')
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

function checkIfComponentIsImported(componentName, searchDir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.js'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(searchDir);
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(`import.*${componentName}`) || content.includes(`from.*${componentName}`)) {
        return true;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return false;
}

if (require.main === module) {
  validateComponentStructure();
}

module.exports = { validateComponentStructure };
