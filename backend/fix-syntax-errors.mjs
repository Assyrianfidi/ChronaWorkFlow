#!/usr/bin/env node
/**
 * Fix Syntax Errors from Automated Refactoring
 * Properly removes broken comment lines
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_FIX = [
  'src/routes/billing.routes.js',
  'src/services/pricing-tier.service.ts',
  'src/services/trial-activation.service.ts'
];

async function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = await fs.readFile(fullPath, 'utf8');
  const original = content;
  
  // Remove broken comment lines that span multiple lines
  content = content.replace(/\/\/ ([^\n]+) \/\/ REMOVED - field does not exist[^\n]*\n\n/g, '// Field removed from schema\n');
  
  // Fix lines that end with "// REMOVED..." followed by content on next line
  content = content.replace(/\/\/ ([^\n]+) \/\/ REMOVED - field does not exist[^\n]*\n([^\n]+)/g, '// Field removed from schema');
  
  // Remove standalone lines with just "// REMOVED..."
  content = content.replace(/^\s*\/\/ REMOVED - field does not exist[^\n]*\n/gm, '');
  
  // Fix "data: { //" pattern
  content = content.replace(/data:\s*\{\s*\/\/[^\}]+\}/g, 'data: {}');
  
  if (content !== original) {
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(`✓ Fixed ${filePath}`);
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Fixing syntax errors from automated refactoring...\n');
  
  let fixed = 0;
  for (const file of FILES_TO_FIX) {
    try {
      if (await fixFile(file)) {
        fixed++;
      }
    } catch (error) {
      console.log(`⚠️  Could not fix ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
