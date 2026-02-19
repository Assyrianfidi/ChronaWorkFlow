#!/usr/bin/env node
/**
 * Fix quickbooks-migration.service.ts schema issues
 */

import fs from 'fs/promises';

const fixes = [
  // Fix transactions.lines → transaction_lines relation
  { pattern: /lines:\s*\{/g, replacement: 'transaction_lines: {' },
  { pattern: /lines:/g, replacement: 'transaction_lines:' },
  { pattern: /\.lines\b/g, replacement: '.transaction_lines' },
  
  // Fix transactions.amount → totalAmount
  { pattern: /transaction\.amount\b/g, replacement: 'transaction.totalAmount' },
  
  // Remove prisma.client references (table doesn't exist)
  { pattern: /prisma\.client\./g, replacement: 'prisma.customers.' },
  { pattern: /await prisma\.client\.findUnique/g, replacement: 'await prisma.customers.findUnique' },
  { pattern: /await prisma\.client\.create/g, replacement: 'await prisma.customers.create' },
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
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

const filePath = 'src/services/quickbooks-migration.service.ts';
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
