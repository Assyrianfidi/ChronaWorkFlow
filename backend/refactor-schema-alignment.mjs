#!/usr/bin/env node
/**
 * Aggressive Schema Alignment Refactor
 * Fixes all schema mismatches by updating code to match actual schema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

let filesFixed = 0;
let totalChanges = 0;

async function getAllFiles(dir, exts = ['.ts', '.js']) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
        files.push(...await getAllFiles(fullPath, exts));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function refactorFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  const original = content;
  let changeCount = 0;

  // Fix 1: activities → audit_logs
  const activitiesRegex = /prisma\.activities/g;
  if (activitiesRegex.test(content)) {
    content = content.replace(activitiesRegex, 'prisma.audit_logs');
    changeCount += (original.match(activitiesRegex) || []).length;
  }

  // Fix 2: transactions.ine → transactions.transaction_lines
  if (content.includes('transactions.ine')) {
    content = content.replace(/transactions\.ine/g, 'transactions.transaction_lines');
    changeCount++;
  }

  // Fix 3: transactions.lines → transactions.transaction_lines  
  const linesRegex = /transactions\.lines/g;
  if (linesRegex.test(content)) {
    content = content.replace(linesRegex, 'transactions.transaction_lines');
    changeCount += (original.match(linesRegex) || []).length;
  }

  // Fix 4: tx.lines → tx.transaction_lines
  if (content.includes('tx.lines')) {
    content = content.replace(/tx\.lines/g, 'tx.transaction_lines');
    changeCount++;
  }

  // Fix 5: Remove subscriptionStatus, subscriptionPlan, planType from users queries
  // These need more careful handling - comment out instead of removing
  const userFieldsToRemove = ['subscriptionStatus', 'subscriptionPlan', 'planType'];
  userFieldsToRemove.forEach(field => {
    // Comment out in select/where clauses
    const selectRegex = new RegExp(`(\\s+)${field}:\\s*true,`, 'g');
    if (selectRegex.test(content)) {
      content = content.replace(selectRegex, `$1// ${field}: true, // REMOVED - field does not exist in users schema`);
      changeCount++;
    }
    
    // Comment out in data updates
    const updateRegex = new RegExp(`(\\s+)${field}:\\s*[^,]+,`, 'g');
    if (updateRegex.test(content)) {
      content = content.replace(updateRegex, (match, ws) => {
        return `${ws}// ${match.trim()} // REMOVED - field does not exist in users schema\n`;
      });
      changeCount++;
    }
  });

  if (content !== original) {
    await fs.writeFile(filePath, content, 'utf8');
    filesFixed++;
    totalChanges += changeCount;
    console.log(`✓ Fixed ${changeCount} schema issues in ${path.relative(process.cwd(), filePath)}`);
  }

  return content !== original;
}

async function main() {
  console.log('🔧 Starting aggressive schema alignment refactor...\n');
  
  const files = await getAllFiles(SRC_DIR);
  console.log(`Scanning ${files.length} files\n`);
  
  for (const file of files) {
    await refactorFile(file);
  }
  
  console.log('\n✅ Schema alignment refactor complete!');
  console.log(`📊 Fixed ${totalChanges} schema issues in ${filesFixed} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
