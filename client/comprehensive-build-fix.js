#!/usr/bin/env node

/**
 * Comprehensive Build Fix Script
 * Analyzes and fixes all build issues before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 COMPREHENSIVE BUILD ANALYSIS\n');
console.log('═'.repeat(60));

// 1. Check vite.config.ts for unused dependencies in manualChunks
console.log('\n📦 Checking Vite Config for Unused Dependencies...\n');

const viteConfigPath = path.join(__dirname, 'vite.config.ts');
const packageJsonPath = path.join(__dirname, 'package.json');

const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

// Extract manualChunks from vite.config.ts
const manualChunksMatch = viteConfig.match(/manualChunks:\s*{([^}]+)}/s);
let unusedPackages = [];
let usedPackages = [];

if (manualChunksMatch) {
  const manualChunksContent = manualChunksMatch[1];
  const packageMatches = manualChunksContent.match(/"([^"]+)"/g);
  
  if (packageMatches) {
    packageMatches.forEach(match => {
      const pkg = match.replace(/"/g, '');
      if (!allDeps[pkg]) {
        unusedPackages.push(pkg);
      } else {
        usedPackages.push(pkg);
      }
    });
  }
  
  console.log('✅ Used packages in manualChunks:', usedPackages.length);
  usedPackages.forEach(pkg => console.log(`   - ${pkg}`));
  
  if (unusedPackages.length > 0) {
    console.log('\n❌ UNUSED packages in manualChunks (WILL BE REMOVED):');
    unusedPackages.forEach(pkg => console.log(`   - ${pkg}`));
  }
  
  // Fix vite.config.ts by removing unused packages
  if (unusedPackages.length > 0) {
    let fixedConfig = viteConfig;
    
    // Remove @headlessui/react from ui chunk
    fixedConfig = fixedConfig.replace(
      /ui:\s*\["@headlessui\/react",\s*"@heroicons\/react"\]/,
      'ui: ["@heroicons/react"]'
    );
    
    // Remove lodash from utils chunk
    fixedConfig = fixedConfig.replace(
      /utils:\s*\["lodash",\s*"date-fns",\s*"clsx"\]/,
      'utils: ["date-fns", "clsx"]'
    );
    
    fs.writeFileSync(viteConfigPath, fixedConfig, 'utf8');
    console.log('\n✅ Fixed vite.config.ts - removed unused packages');
  }
}

// 2. Check for case-sensitive import issues
console.log('\n\n🔤 Checking for Remaining Case-Sensitive Imports...\n');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

const caseIssues = [];
const srcDir = path.join(__dirname, 'src');

walkDir(srcDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(srcDir, filePath);
  
  // Check for lowercase UI component imports
  const lowercaseImports = content.match(/from ["']@\/components\/ui\/[a-z-]+["']/g);
  if (lowercaseImports) {
    caseIssues.push({
      file: relativePath,
      imports: lowercaseImports
    });
  }
});

if (caseIssues.length > 0) {
  console.log(`❌ Found ${caseIssues.length} files with lowercase imports:`);
  caseIssues.forEach(issue => {
    console.log(`   ${issue.file}:`);
    issue.imports.forEach(imp => console.log(`     - ${imp}`));
  });
} else {
  console.log('✅ No case-sensitive import issues found');
}

// 3. Check for missing config files
console.log('\n\n📁 Checking Config Files...\n');

const requiredConfigs = [
  'src/config/theme.config.ts',
  'src/config/view.config.ts',
  'src/config/navigation.config.ts'
];

const missingConfigs = [];
requiredConfigs.forEach(config => {
  const configPath = path.join(__dirname, config);
  if (!fs.existsSync(configPath)) {
    missingConfigs.push(config);
  } else {
    console.log(`✅ ${config} exists`);
  }
});

if (missingConfigs.length > 0) {
  console.log('\n❌ Missing config files:');
  missingConfigs.forEach(config => console.log(`   - ${config}`));
}

// 4. Summary
console.log('\n\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));

const issues = [];
if (unusedPackages && unusedPackages.length > 0) {
  issues.push(`Unused packages in vite.config.ts: ${unusedPackages.length} (FIXED)`);
}
if (caseIssues.length > 0) {
  issues.push(`Case-sensitive import issues: ${caseIssues.length} files`);
}
if (missingConfigs.length > 0) {
  issues.push(`Missing config files: ${missingConfigs.length}`);
}

if (issues.length === 0) {
  console.log('✅ No issues found - ready to deploy!');
} else {
  console.log('⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('═'.repeat(60));
console.log('\n');
