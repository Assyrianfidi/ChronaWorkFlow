#!/usr/bin/env node
/**
 * Fix Schema Field Mismatches
 * Removes references to non-existent fields/tables in the schema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

// Fields that don't exist in actual schema
const INVALID_FIELDS = {
  // users model doesn't have these
  'subscriptionStatus': 'Remove - field does not exist in users model',
  'subscriptionPlan': 'Remove - use billing_status table instead',
  'planType': 'Remove - use billing_status table instead',
  
  // Table doesn't exist
  'prisma.activities': 'prisma.audit_logs',
  'prisma.activity_notifications': 'Remove - table does not exist',
  
  // Relation field typo
  'transactions.ine': 'transactions.transaction_lines',
  'transactions.lines': 'transactions.transaction_lines',
  'tx.lines': 'tx.transaction_lines',
};

let filesScanned = 0;
let issuesFound = [];

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

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  filesScanned++;
  
  for (const [invalid, reason] of Object.entries(INVALID_FIELDS)) {
    if (content.includes(invalid)) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(invalid)) {
          issuesFound.push({
            file: relativePath,
            line: idx + 1,
            invalid,
            reason,
            code: line.trim()
          });
        }
      });
    }
  }
}

async function main() {
  console.log('🔍 Scanning for schema field mismatches...\n');
  
  const files = await getAllFiles(SRC_DIR);
  
  for (const file of files) {
    await scanFile(file);
  }
  
  console.log(`\n📊 Scanned ${filesScanned} files`);
  console.log(`❌ Found ${issuesFound.length} schema mismatches\n`);
  
  if (issuesFound.length > 0) {
    console.log('Issues found:');
    console.log('─'.repeat(100));
    
    // Group by file
    const byFile = {};
    issuesFound.forEach(issue => {
      if (!byFile[issue.file]) byFile[issue.file] = [];
      byFile[issue.file].push(issue);
    });
    
    Object.entries(byFile).forEach(([file, issues]) => {
      console.log(`\n📄 ${file}`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.invalid}`);
        console.log(`   → ${issue.reason}`);
        console.log(`   Code: ${issue.code.substring(0, 80)}${issue.code.length > 80 ? '...' : ''}`);
      });
    });
    
    console.log('\n─'.repeat(100));
    console.log('\n⚠️  These files need manual review and fixing.');
    console.log('Recommendation: Remove outdated code or update to use correct schema tables/fields.');
  } else {
    console.log('✅ No schema mismatches found!');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
