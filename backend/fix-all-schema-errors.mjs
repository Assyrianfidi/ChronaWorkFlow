#!/usr/bin/env node
/**
 * Comprehensive Schema Alignment Fix
 * Fixes all remaining schema mismatches across the codebase
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  // Fix prisma.user → prisma.users (common typo)
  {
    pattern: /prisma\.user\b/g,
    replacement: 'prisma.users',
    description: 'Fix prisma.user → prisma.users'
  },
  // Fix prisma.subscription → prisma.subscriptions
  {
    pattern: /prisma\.subscription\b(?!s)/g,
    replacement: 'prisma.subscriptions',
    description: 'Fix prisma.subscription → prisma.subscriptions'
  },
  // Fix prisma.invoice → prisma.invoices
  {
    pattern: /prisma\.invoice\b(?!s)/g,
    replacement: 'prisma.invoices',
    description: 'Fix prisma.invoice → prisma.invoices'
  },
  // Fix prisma.company → prisma.companies
  {
    pattern: /prisma\.company\b(?!_)/g,
    replacement: 'prisma.companies',
    description: 'Fix prisma.company → prisma.companies'
  },
  // Fix include: { lines: true } → include: { transaction_lines: true }
  {
    pattern: /include:\s*{\s*lines:\s*true/g,
    replacement: 'include: { transaction_lines: true',
    description: 'Fix transaction lines include'
  },
  // Fix .lines in code → .transaction_lines
  {
    pattern: /\.lines\b/g,
    replacement: '.transaction_lines',
    description: 'Fix .lines → .transaction_lines'
  },
  // Fix User type import from @prisma/client
  {
    pattern: /import\s+\{\s*User\s*\}\s+from\s+['"]@prisma\/client['"]/g,
    replacement: '// User type - using Prisma generated users type',
    description: 'Remove User type import'
  },
  // Fix sessions access (prisma.users.sessions → prisma.user_sessions)
  {
    pattern: /prisma\.users\.sessions/g,
    replacement: 'prisma.user_sessions',
    description: 'Fix sessions table access'
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
  const srcDir = path.join(__dirname, 'src');
  const files = await glob('**/*.ts', { cwd: srcDir, absolute: true, ignore: ['**/*.d.ts', '**/__tests__/**'] });
  
  console.log(`Found ${files.length} TypeScript files to check`);
  
  let fixedCount = 0;
  for (const file of files) {
    const wasFixed = await fixFile(file);
    if (wasFixed) {
      const relativePath = path.relative(__dirname, file);
      console.log(`✓ Fixed ${relativePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
