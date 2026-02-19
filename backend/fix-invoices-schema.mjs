#!/usr/bin/env node
/**
 * Fix invoices table schema mismatches
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const fixes = [
  // totalAmount → amount (invoices table has 'amount' not 'totalAmount')
  {
    pattern: /\.totalAmount\b/g,
    replacement: '.amount',
  },
  // dueDate → dueAt (invoices table has 'dueAt' not 'dueDate')
  {
    pattern: /\.dueDate\b/g,
    replacement: '.dueAt',
  },
  // InvoiceStatus.SENT → InvoiceStatus.OPEN (SENT doesn't exist)
  {
    pattern: /InvoiceStatus\.SENT/g,
    replacement: 'InvoiceStatus.OPEN',
  },
  // InvoiceStatus.OVERDUE → check with dueAt < now (OVERDUE doesn't exist)
  {
    pattern: /InvoiceStatus\.OVERDUE/g,
    replacement: 'InvoiceStatus.OPEN',
  },
  // payment → payments (table is payments not payment)
  {
    pattern: /prisma\.payment\b(?!s)/g,
    replacement: 'prisma.payments',
  },
  // Remove include: { client: true } from invoices (no client field)
  {
    pattern: /include:\s*{\s*client:\s*true\s*}/g,
    replacement: 'include: {}',
  },
  {
    pattern: /,\s*client:\s*true/g,
    replacement: '',
  },
  // Remove orderBy: { dueDate: ... } and replace with dueAt
  {
    pattern: /orderBy:\s*{\s*dueDate:/g,
    replacement: 'orderBy: { dueAt:',
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
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const files = await glob('src/**/*.ts', { absolute: true, ignore: ['**/*.d.ts'] });
  
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
