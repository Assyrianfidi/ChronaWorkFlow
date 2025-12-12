const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function validateEnvironmentConfig() {
  console.log('⚙️ Phase 2: Environment & Config Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check .env files
  console.log('📁 Environment Files Validation:');
  
  const envFiles = ['.env', '.env.example', '.env.local', '.env.production', '.env.development'];
  let envFilesFound = 0;
  let envFilesValid = 0;
  
  envFiles.forEach(envFile => {
    const exists = fs.existsSync(envFile);
    console.log(`  ${exists ? '✅' : '❌'} ${envFile}`);
    
    if (exists) {
      envFilesFound++;
      
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        
        // Check for basic structure
        if (content.includes('VITE_') || content.includes('REACT_APP_') || content.includes('NODE_ENV')) {
          envFilesValid++;
          console.log(`    ✅ Valid environment variable format`);
        } else {
          console.log(`    ⚠️  Missing standard environment variables`);
          issues.push(`${envFile} lacks standard environment variables`);
        }
        
        // Check for placeholder values
        if (content.includes('placeholder') || content.includes('your_') || content.includes('CHANGE_ME')) {
          console.log(`    ⚠️  Contains placeholder values`);
          issues.push(`${envFile} contains placeholder values that need to be replaced`);
        }
        
      } catch (error) {
        console.log(`    ❌ Cannot read file`);
        issues.push(`Cannot read ${envFile}`);
      }
    }
  });
  
  if (envFilesFound >= 3 && envFilesValid >= 2) {
    score++;
    console.log('  ✅ Environment files are properly configured');
  } else {
    console.log('  ❌ Environment files need attention');
  }
  
  // 2. Check TypeScript configuration
  console.log('\n📘 TypeScript Configuration Validation:');
  
  const tsconfigFiles = ['tsconfig.json', 'tsconfig.node.json', 'tsconfig.eslint.json'];
  let tsconfigValid = 0;
  
  tsconfigFiles.forEach(configFile => {
    if (fs.existsSync(configFile)) {
      try {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Check for essential compiler options
        const essentialOptions = ['target', 'module', 'moduleResolution', 'jsx', 'allowJs', 'skipLibCheck'];
        const hasEssentialOptions = essentialOptions.every(opt => config.compilerOptions && config.compilerOptions[opt] !== undefined);
        
        if (hasEssentialOptions) {
          console.log(`  ✅ ${configFile} has essential compiler options`);
          tsconfigValid++;
        } else {
          console.log(`  ⚠️  ${configFile} missing essential options`);
          issues.push(`${configFile} missing essential TypeScript options`);
        }
        
        // Check for path aliases
        if (config.compilerOptions && config.compilerOptions.paths) {
          console.log(`    ✅ Path aliases configured`);
        } else {
          console.log(`    ⚠️  No path aliases found`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${configFile} is invalid JSON`);
        issues.push(`${configFile} contains invalid JSON`);
      }
    } else {
      console.log(`  ⚠️  ${configFile} not found`);
    }
  });
  
  if (tsconfigValid >= 1) {
    score++;
    console.log('  ✅ TypeScript configuration is valid');
  } else {
    console.log('  ❌ TypeScript configuration needs fixing');
  }
  
  // 3. Check Vite configuration
  console.log('\n⚡ Vite Configuration Validation:');
  
  const viteConfigFiles = ['vite.config.ts', 'vite.config.js'];
  let viteConfigValid = 0;
  
  viteConfigFiles.forEach(configFile => {
    if (fs.existsSync(configFile)) {
      try {
        const content = fs.readFileSync(configFile, 'utf8');
        
        // Check for essential Vite configurations
        const hasReactPlugin = content.includes('@vitejs/plugin-react');
        const hasPathAliases = content.includes('alias') && content.includes('@/');
        const hasProperBuild = content.includes('build') || content.includes('rollupOptions');
        
        console.log(`  ✅ ${configFile} found`);
        console.log(`    ${hasReactPlugin ? '✅' : '❌'} React plugin configured`);
        console.log(`    ${hasPathAliases ? '✅' : '❌'} Path aliases configured`);
        console.log(`    ${hasProperBuild ? '✅' : '❌'} Build options configured`);
        
        if (hasReactPlugin && hasPathAliases) {
          viteConfigValid++;
          score++;
        } else {
          issues.push(`${configFile} missing essential Vite configurations`);
        }
        
      } catch (error) {
        console.log(`  ❌ Cannot read ${configFile}`);
        issues.push(`Cannot read ${configFile}`);
      }
    } else {
      console.log(`  ❌ ${configFile} not found`);
      issues.push(`Vite configuration file not found`);
    }
  });
  
  // 4. Check package.json scripts
  console.log('\n📦 Package.json Scripts Validation:');
  
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      
      const essentialScripts = ['dev', 'build', 'preview', 'lint', 'test'];
      const scriptsFound = essentialScripts.filter(script => scripts[script]);
      
      console.log(`  📊 Found ${scriptsFound.length}/${essentialScripts.length} essential scripts`);
      
      essentialScripts.forEach(script => {
        console.log(`    ${scripts[script] ? '✅' : '❌'} ${script}`);
      });
      
      if (scriptsFound.length >= 4) {
        score++;
        console.log('  ✅ Essential scripts are configured');
      } else {
        console.log('  ❌ Missing essential scripts');
        issues.push('Missing essential npm scripts');
      }
      
      // Check for TypeScript support
      const hasTypeScript = packageJson.devDependencies && (
        packageJson.devDependencies.typescript || 
        packageJson.dependencies.typescript
      );
      
      console.log(`    ${hasTypeScript ? '✅' : '❌'} TypeScript dependency`);
      
      if (!hasTypeScript) {
        issues.push('TypeScript dependency not found');
      }
      
    } catch (error) {
      console.log('  ❌ Invalid package.json');
      issues.push('package.json contains invalid JSON');
    }
  } else {
    console.log('  ❌ package.json not found');
    issues.push('package.json not found');
  }
  
  // 5. Check environment variable usage
  console.log('\n🔍 Environment Variable Usage Validation:');
  
  const sourceFiles = getSourceFiles('src');
  let envVarUsage = 0;
  let hardcodedValues = 0;
  
  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for proper environment variable usage
      if (content.includes('import.meta.env.') || content.includes('process.env.')) {
        envVarUsage++;
      }
      
      // Check for hardcoded URLs or secrets
      const suspiciousPatterns = [
        /http:\/\/localhost:\d+/g,
        /https?:\/\/[^/]+\.com/g,
        /sk-[a-zA-Z0-9]+/g,
        /ghp_[a-zA-Z0-9]+/g,
        /['"]\w+SECRET\w*['"]/g
      ];
      
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hardcodedValues++;
        }
      });
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📊 Environment variables used in ${envVarUsage} files`);
  console.log(`  ⚠️  Potential hardcoded values found in ${hardcodedValues} files`);
  
  if (envVarUsage > 0 && hardcodedValues < 5) {
    score++;
    console.log('  ✅ Environment variables are properly used');
  } else {
    console.log('  ❌ Environment variable usage needs improvement');
    issues.push('Environment variables not properly used or hardcoded values detected');
  }
  
  // 6. Check for .gitignore
  console.log('\n🚫 Git Ignore Validation:');
  
  if (fs.existsSync('.gitignore')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    const essentialIgnores = ['node_modules', '.env', 'dist', 'build', '.DS_Store'];
    const ignoresFound = essentialIgnores.filter(ignore => gitignoreContent.includes(ignore));
    
    console.log(`  📊 Found ${ignoresFound.length}/${essentialIgnores.length} essential ignores`);
    
    if (ignoresFound.length >= 4) {
      score++;
      console.log('  ✅ .gitignore is properly configured');
    } else {
      console.log('  ❌ .gitignore missing essential entries');
      issues.push('.gitignore missing essential entries');
    }
  } else {
    console.log('  ❌ .gitignore not found');
    issues.push('.gitignore not found');
  }
  
  // 7. Check for lock file
  console.log('\n🔒 Dependency Lock Validation:');
  
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  const lockFileFound = lockFiles.some(lockFile => fs.existsSync(lockFile));
  
  if (lockFileFound) {
    score++;
    console.log('  ✅ Dependency lock file found');
  } else {
    console.log('  ❌ No dependency lock file found');
    issues.push('No dependency lock file found');
  }
  
  // 8. Check for proper folder structure
  console.log('\n📂 Folder Structure Validation:');
  
  const essentialFolders = ['src', 'src/components', 'src/lib', 'src/hooks', 'src/types'];
  const foldersFound = essentialFolders.filter(folder => fs.existsSync(folder));
  
  console.log(`  📊 Found ${foldersFound.length}/${essentialFolders.length} essential folders`);
  
  essentialFolders.forEach(folder => {
    console.log(`    ${fs.existsSync(folder) ? '✅' : '❌'} ${folder}`);
  });
  
  if (foldersFound.length >= 4) {
    score++;
    console.log('  ✅ Essential folder structure is present');
  } else {
    console.log('  ❌ Essential folder structure missing');
    issues.push('Essential folder structure missing');
  }
  
  // 9. Check for configuration consistency
  console.log('\n🔄 Configuration Consistency Validation:');
  
  let configConsistent = true;
  
  // Check if tsconfig.json and vite.config.ts paths match
  if (fs.existsSync('tsconfig.json') && (fs.existsSync('vite.config.ts') || fs.existsSync('vite.config.js'))) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      const viteConfig = fs.existsSync('vite.config.ts') ? 
        fs.readFileSync('vite.config.ts', 'utf8') : 
        fs.readFileSync('vite.config.js', 'utf8');
      
      const tsconfigPaths = tsconfig.compilerOptions?.paths || {};
      const hasViteAliases = viteConfig.includes('alias') && viteConfig.includes('@/components');
      
      if (Object.keys(tsconfigPaths).length > 0 && hasViteAliases) {
        console.log('  ✅ TypeScript and Vite path configurations are consistent');
        score++;
      } else {
        console.log('  ⚠️  Path configuration inconsistency detected');
        configConsistent = false;
      }
      
    } catch (error) {
      console.log('  ❌ Cannot validate configuration consistency');
      configConsistent = false;
    }
  } else {
    console.log('  ❌ Missing configuration files for consistency check');
    configConsistent = false;
  }
  
  if (!configConsistent) {
    issues.push('Configuration inconsistency between TypeScript and Vite');
  }
  
  // 10. Check for build readiness
  console.log('\n🏗️  Build Readiness Validation:');
  
  try {
    // Try to run TypeScript compilation
    execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('  ✅ TypeScript compilation successful');
    score++;
    
  } catch (error) {
    console.log('  ❌ TypeScript compilation failed');
    issues.push('TypeScript compilation fails');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 2 Results:');
  console.log(`  🎯 Environment & Config Score: ${score}/${maxScore} (${percentage}%)`);
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
  const isPhaseComplete = percentage >= 90 && issues.length <= 2;
  
  console.log(`\n🎯 Phase 2 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Ready to proceed to Phase 3');
  } else {
    console.log('📝 Address remaining issues before proceeding to Phase 3');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual configuration issues'] : []
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
  validateEnvironmentConfig();
}

module.exports = { validateEnvironmentConfig };
