#!/usr/bin/env node
/**
 * Fix incorrect .ts.js import extensions - should be just .js
 */

import fs from 'fs/promises';
import { glob } from 'glob';

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    // Fix .ts.js extensions to just .js
    const pattern = /from ['"]([^'"]+)\.ts\.js['"]/g;
    if (pattern.test(content)) {
      content = content.replace(pattern, 'from \'$1.js\'');
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
    ignore: ['**/*.d.ts', '**/node_modules/**'] 
  });
  
  let fixedCount = 0;
  for (const file of files) {
    const wasFixed = await fixFile(file);
    if (wasFixed) {
      console.log(`✓ Fixed ${file.replace(/.*\\src\\/, 'src/')}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files with incorrect .ts.js extensions`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
