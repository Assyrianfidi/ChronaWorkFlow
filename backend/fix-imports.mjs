#!/usr/bin/env node
/**
 * Comprehensive Import Path Fixer
 * Fixes all TypeScript import paths to use .js extensions for ESM compatibility
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');

// Patterns to fix
const IMPORT_PATTERNS = [
  // Relative imports without extensions
  {
    pattern: /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g,
    fix: (match, importPath) => {
      // Skip if already has extension
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        return match;
      }
      return match.replace(importPath, `${importPath}.js`);
    }
  }
];

let filesFixed = 0;
let totalChanges = 0;

async function getAllTypeScriptFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
        files.push(...await getAllTypeScriptFiles(fullPath));
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function fixImportsInFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;
  
  for (const { pattern, fix } of IMPORT_PATTERNS) {
    const newContent = content.replace(pattern, (...args) => {
      const result = fix(...args);
      if (result !== args[0]) {
        changed = true;
        changeCount++;
      }
      return result;
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  if (changed) {
    await fs.writeFile(filePath, content, 'utf8');
    filesFixed++;
    totalChanges += changeCount;
    console.log(`✓ Fixed ${changeCount} imports in ${path.relative(process.cwd(), filePath)}`);
  }
  
  return changed;
}

async function main() {
  console.log('🔧 Starting comprehensive import path fixes...\n');
  
  const files = await getAllTypeScriptFiles(SRC_DIR);
  console.log(`Found ${files.length} TypeScript files\n`);
  
  for (const file of files) {
    await fixImportsInFile(file);
  }
  
  console.log('\n✅ Import fix complete!');
  console.log(`📊 Fixed ${totalChanges} imports in ${filesFixed} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
