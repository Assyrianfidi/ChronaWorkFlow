#!/usr/bin/env node
/**
 * Targeted schema table name fixes
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const fixes = [
  // Fix prisma table names to match schema
  { pattern: /prisma\.refreshToken\b/g, replacement: 'prisma.refresh_tokens' },
  { pattern: /prisma\.product\b(?!s)/g, replacement: 'prisma.products' },
  { pattern: /prisma\.customer\b(?!s)/g, replacement: 'prisma.customers' },
  { pattern: /prisma\.subscriptionPlan\b/g, replacement: 'prisma.subscription_plans' },
  
  // Fix include: { lines: true } in transactions - should be transaction_lines
  { pattern: /include:\s*\{\s*lines:\s*true\s*\}/g, replacement: 'include: { transaction_lines: true }' },
  
  // Fix status enum values that don't exist
  { pattern: /"SENT"/g, replacement: '"OPEN"' },
  { pattern: /"OVERDUE"/g, replacement: '"OPEN"' },
  
  // Fix field name in invoices queries
  { pattern: /dueDate:/g, replacement: 'dueAt:' },
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
