#!/usr/bin/env node
/**
 * Fix document service schema mismatches
 */

import fs from 'fs/promises';

const fixes = [
  // Fix userId → uploadedBy
  { pattern: /userId:/g, replacement: 'uploadedBy:' },
  { pattern: /\.userId\b/g, replacement: '.uploadedBy' },
  
  // Fix originalName → fileName
  { pattern: /originalName:/g, replacement: 'fileName:' },
  { pattern: /\.originalName\b/g, replacement: '.fileName' },
  
  // Fix documentId type conversions (string to number)
  { pattern: /where:\s*\{\s*id:\s*documentId\s*\}/g, replacement: 'where: { id: parseInt(documentId, 10) }' },
  { pattern: /organizationId:\s*organizationId\s*\}/g, replacement: 'organizationId: parseInt(organizationId, 10) }' },
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    for (const fix of fixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        changed = true;
      }
    }
    
    if (changed) {
      await fs.writeFile(filePath, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

const filePath = 'src/services/storage/document.service.ts';
fixFile(filePath).then(fixed => {
  if (fixed) {
    console.log(`✓ Fixed ${filePath}`);
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
