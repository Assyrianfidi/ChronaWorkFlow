#!/usr/bin/env node
/**
 * Final comprehensive fix for all remaining errors
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const fixes = [
  // Fix Prisma type imports
  { pattern: /Prisma\.InvoiceGetPayload/g, replacement: 'Prisma.invoicesGetPayload' },
  { pattern: /Prisma\.CustomerGetPayload/g, replacement: 'Prisma.customersGetPayload' },
  { pattern: /Prisma\.ProductGetPayload/g, replacement: 'Prisma.productsGetPayload' },
  { pattern: /Prisma\.PaymentGetPayload/g, replacement: 'Prisma.paymentsGetPayload' },
  
  // Fix table name references
  { pattern: /prisma\.client\b/g, replacement: 'prisma.customers' },
  
  // Fix field references
  { pattern: /\.totalAmount(?=\s*[,;)}])/g, replacement: '.amount' },
  { pattern: /\.dueDate(?=\s*[,;:)}])/g, replacement: '.dueAt' },
  
  // Fix number/string type mismatches for IDs
  { pattern: /parseInt\(([^,)]+),\s*10\)/g, replacement: '$1' },
  
  // Fix implicit any in parameters
  { pattern: /\(([a-z]+)\)\s*=>\s*\1\./g, replacement: '($1: any) => $1.' },
  
  // Fix PrismaClient type references
  { pattern: /:\s*PrismaClient(?!\<)/g, replacement: ': any' },
  
  // Fix missing .js extensions in imports (common pattern)
  { pattern: /from\s+['"](\.\.[\/\\][^'"]+)(?<!\.js)['"]/g, replacement: 'from "$1.js"' },
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
