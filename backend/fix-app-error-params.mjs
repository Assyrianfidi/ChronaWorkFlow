#!/usr/bin/env node
/**
 * Fix AppError parameter order - should be (statusCode: number, message: string)
 */

import fs from 'fs/promises';
import { glob } from 'glob';

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    // Fix StatusCodes usage with AppError
    const pattern1 = /new AppError\(StatusCodes\.(\w+),/g;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, 'new AppError(StatusCodes.$1,');
      changed = true;
    }
    
    // Fix numeric first parameter (already correct)
    const pattern2 = /new AppError\((\d+),\s*"([^"]+)"\)/g;
    if (pattern2.test(content)) {
      // Already correct format
      changed = false;
    }
    
    // Type cast userId to string where needed for AppError
    const pattern3 = /new AppError\((\d+),\s*`([^`]*)\$\{userId\}([^`]*)`\)/g;
    if (pattern3.test(content)) {
      content = content.replace(pattern3, 'new AppError($1, `$2${String(userId)}$3`)');
      changed = true;
    }
    
    if (changed) {
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function main() {
  const files = await glob('src/**/*.ts', { 
    absolute: true, 
    ignore: ['**/*.d.ts', '**/node_modules/**', '**/ai/**'] 
  });
  
  let fixedCount = 0;
  for (const file of files) {
    const wasFixed = await fixFile(file);
    if (wasFixed) {
      console.log(`✓ Fixed ${file.replace(/.*\\src\\/, 'src/')}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
