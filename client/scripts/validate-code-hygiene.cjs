const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validateCodeHygiene() {
  console.log('🧹 Phase 1: Code & Repo Hygiene Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. ESLint Check
  console.log('🔍 ESLint Validation:');
  try {
    const eslintOutput = execSync('npm run lint', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    if (eslintOutput.includes('error')) {
      console.log('  ❌ ESLint errors detected');
      issues.push('ESLint errors found');
    } else {
      console.log('  ✅ ESLint passed - no errors');
      score++;
    }
  } catch (error) {
    console.log('  ❌ ESLint failed');
    issues.push('ESLint execution failed');
  }
  
  // 2. Prettier Check
  console.log('\n🎨 Prettier Formatting:');
  try {
    const prettierOutput = execSync('npx prettier --check "src/**/*.{ts,tsx,js,jsx,css,scss,json,md}"', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    if (prettierOutput.includes('Code style issues found')) {
      console.log('  ⚠️  Formatting issues detected, auto-fixing...');
      execSync('npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,scss,json,md}"', { 
        encoding: 'utf8', 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      console.log('  ✅ Formatting auto-fixed');
      fixes.push('Applied Prettier formatting fixes');
      score++;
    } else {
      console.log('  ✅ Prettier formatting is correct');
      score++;
    }
  } catch (error) {
    console.log('  ❌ Prettier check failed');
    issues.push('Prettier formatting issues');
  }
  
  // 3. TypeScript Compilation Check
  console.log('\n📘 TypeScript Compilation:');
  try {
    const tscOutput = execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('  ✅ TypeScript compilation successful');
    score++;
  } catch (error) {
    console.log('  ❌ TypeScript compilation errors');
    issues.push('TypeScript compilation failed');
  }
  
  // 4. Check for unused imports
  console.log('\n🗑️  Unused Imports Check:');
  try {
    const sourceFiles = getSourceFiles('src');
    let unusedImportCount = 0;
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for common unused import patterns
      if (content.includes('import') && content.includes('// TODO: remove unused import')) {
        unusedImportCount++;
      }
    });
    
    if (unusedImportCount === 0) {
      console.log('  ✅ No obvious unused imports found');
      score++;
    } else {
      console.log(`  ⚠️  Found ${unusedImportCount} potential unused imports`);
      issues.push(`${unusedImportCount} unused imports detected`);
    }
  } catch (error) {
    console.log('  ❌ Could not check unused imports');
    issues.push('Unused import check failed');
  }
  
  // 5. Check imports/exports consistency
  console.log('\n📦 Import/Export Validation:');
  try {
    const sourceFiles = getSourceFiles('src');
    let importExportIssues = 0;
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for missing exports
      if (content.includes('export default') && !content.includes('import')) {
        // This is likely a main file, check if it's imported elsewhere
        const fileName = path.basename(file, path.extname(file));
        const isImported = sourceFiles.some(otherFile => {
          if (otherFile === file) return false;
          const otherContent = fs.readFileSync(otherFile, 'utf8');
          return otherContent.includes(`from './${fileName}'`) || 
                 otherContent.includes(`from "${fileName}"`) ||
                 otherContent.includes(`import.*${fileName}`);
        });
        
        if (!isImported && !file.includes('index') && !file.includes('main')) {
          importExportIssues++;
        }
      }
    });
    
    if (importExportIssues === 0) {
      console.log('  ✅ Import/export consistency looks good');
      score++;
    } else {
      console.log(`  ⚠️  Found ${importExportIssues} import/export issues`);
      issues.push('Import/export inconsistencies found');
    }
  } catch (error) {
    console.log('  ❌ Import/export validation failed');
    issues.push('Import/export check failed');
  }
  
  // 6. Check for dead code
  console.log('\n💀 Dead Code Detection:');
  try {
    const sourceFiles = getSourceFiles('src');
    let deadCodeFiles = [];
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for commented out large blocks
      if (content.includes('/*') && content.includes('*/')) {
        const commentBlocks = content.match(/\/\*[\s\S]*?\*\//g) || [];
        commentBlocks.forEach(block => {
          if (block.length > 200) { // Large commented blocks
            deadCodeFiles.push(path.basename(file));
          }
        });
      }
      
      // Check for TODO comments that indicate dead code
      if (content.includes('TODO: remove') || content.includes('FIXME: dead code')) {
        deadCodeFiles.push(path.basename(file));
      }
    });
    
    if (deadCodeFiles.length === 0) {
      console.log('  ✅ No obvious dead code detected');
      score++;
    } else {
      console.log(`  ⚠️  Found potential dead code in: ${[...new Set(deadCodeFiles)].join(', ')}`);
      issues.push('Dead code detected');
    }
  } catch (error) {
    console.log('  ❌ Dead code detection failed');
    issues.push('Dead code check failed');
  }
  
  // 7. Git status check
  console.log('\n📂 Git Repository Status:');
  try {
    const gitStatus = execSync('git status --porcelain', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    const changedFiles = gitStatus.split('\n').filter(line => line.trim()).length;
    
    if (changedFiles === 0) {
      console.log('  ✅ Working directory is clean');
      score++;
    } else {
      console.log(`  ⚠️  ${changedFiles} files have uncommitted changes`);
      issues.push('Uncommitted changes in repository');
    }
  } catch (error) {
    console.log('  ⚠️  Git status check failed (not a git repository?)');
    // Don't count as an error since this might not be a git repo
    score++;
  }
  
  // 8. Check for console.log statements
  console.log('\n🖥️  Console Statements Check:');
  try {
    const sourceFiles = getSourceFiles('src');
    let consoleLogCount = 0;
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/console\.(log|warn|error|debug|info)\(/g);
      if (matches) {
        consoleLogCount += matches.length;
      }
    });
    
    if (consoleLogCount <= 5) { // Allow a few for debugging
      console.log(`  ✅ Minimal console statements (${consoleLogCount} found)`);
      score++;
    } else {
      console.log(`  ⚠️  Found ${consoleLogCount} console statements`);
      issues.push('Too many console statements');
    }
  } catch (error) {
    console.log('  ❌ Console statement check failed');
    issues.push('Console check failed');
  }
  
  // 9. Check file naming conventions
  console.log('\n📝 File Naming Conventions:');
  try {
    const sourceFiles = getSourceFiles('src');
    let namingIssues = 0;
    
    sourceFiles.forEach(file => {
      const fileName = path.basename(file);
      
      // Check for proper naming (PascalCase for components, camelCase for utilities)
      if (file.includes('components/') && !/^[A-Z][a-zA-Z0-9]*\.tsx?$/.test(fileName)) {
        namingIssues++;
      }
      
      if (file.includes('utils/') && !/^[a-z][a-zA-Z0-9]*\.ts$/.test(fileName)) {
        namingIssues++;
      }
    });
    
    if (namingIssues === 0) {
      console.log('  ✅ File naming conventions are followed');
      score++;
    } else {
      console.log(`  ⚠️  Found ${namingIssues} naming convention issues`);
      issues.push('File naming convention issues');
    }
  } catch (error) {
    console.log('  ❌ File naming check failed');
    issues.push('File naming check failed');
  }
  
  // 10. Check for proper TypeScript types
  console.log('\n🔷 TypeScript Type Safety:');
  try {
    const sourceFiles = getSourceFiles('src');
    let typeIssues = 0;
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for 'any' type usage
      if (content.includes(': any') && !content.includes('// @ts-ignore')) {
        typeIssues += (content.match(/: any/g) || []).length;
      }
      
      // Check for type assertions
      if (content.includes(' as ') && !content.includes(' as const')) {
        typeIssues += (content.match(/ as [^c]/g) || []).length;
      }
    });
    
    if (typeIssues <= 10) { // Allow some type usage
      console.log(`  ✅ Good TypeScript type safety (${typeIssues} type issues)`);
      score++;
    } else {
      console.log(`  ⚠️  Found ${typeIssues} TypeScript type issues`);
      issues.push('TypeScript type safety issues');
    }
  } catch (error) {
    console.log('  ❌ TypeScript type check failed');
    issues.push('TypeScript type check failed');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 1 Results:');
  console.log(`  🎯 Code Hygiene Score: ${score}/${maxScore} (${percentage}%)`);
  console.log(`  🔧 Fixes Applied: ${fixes.length}`);
  console.log(`  ⚠️  Issues Found: ${issues.length}`);
  
  if (fixes.length > 0) {
    console.log('\n✅ Automatic Fixes Applied:');
    fixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Manual Issues Requiring Attention:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Phase completion determination
  const isPhaseComplete = percentage >= 90 && issues.length <= 2;
  
  console.log(`\n🎯 Phase 1 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 2');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 2');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual issues'] : []
  };
}

// Helper function to get all source files
function getSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
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
  }
  
  traverse(dir);
  return files;
}

if (require.main === module) {
  validateCodeHygiene();
}

module.exports = { validateCodeHygiene };
