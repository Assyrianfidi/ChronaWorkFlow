#!/usr/bin/env node
/**
 * Fix invoicing services schema alignment
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const fixes = [
  // Fix PaymentMethod type import - doesn't exist
  {
    pattern: /import\s+\{[^}]*PaymentMethod[^}]*\}\s+from\s+['"]@prisma\/client['"]/g,
    replacement: '// PaymentMethod type removed',
  },
  // Fix payments.method → payments.paymentMethod
  {
    pattern: /method:/g,
    replacement: 'paymentMethod:',
  },
  // Fix payments.paidAt → payments.processedAt
  {
    pattern: /paidAt:/g,
    replacement: 'processedAt:',
  },
  // Fix .toNumber() calls - amounts are already numbers
  {
    pattern: /\.amount\.toNumber\(\)/g,
    replacement: '.amount',
  },
  {
    pattern: /\.toNumber\(\)/g,
    replacement: '',
  },
  // Remove client include from invoices (doesn't exist)
  {
    pattern: /client:\s*true,?/g,
    replacement: '',
  },
  // Fix invoice.totalAmount → invoice.amount
  {
    pattern: /invoice\.totalAmount/g,
    replacement: 'invoice.amount',
  },
  {
    pattern: /\.totalAmount/g,
    replacement: '.amount',
  },
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

async function main() {
  const files = await glob('src/services/invoicing/**/*.ts', { absolute: true });
  
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
