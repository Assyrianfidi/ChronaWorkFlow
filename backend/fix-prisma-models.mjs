#!/usr/bin/env node
/**
 * Fix Prisma Model Name Mismatches
 * Replaces incorrect camelCase model names with correct snake_case names from schema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');

// Map of incorrect model names to correct ones based on actual schema
const MODEL_FIXES = {
  'prisma.user.': 'prisma.users.',
  'prisma.account.': 'prisma.accounts.',
  'prisma.transaction.': 'prisma.transactions.',
  'prisma.transactionLine.': 'prisma.transaction_lines.',
  'prisma.document.': 'prisma.documents.',
  'prisma.activity.': 'prisma.activities.',
  'prisma.activityNotification.': 'prisma.activity_notifications.',
  'prisma.reconciliationReport.': 'prisma.reconciliation_reports.',
  'prisma.paymentMethod.': 'prisma.payment_methods.',
  'prisma.companyMember.': 'prisma.company_members.',
  'prisma.apiKey.': 'prisma.api_keys.',
  'prisma.auditLog.': 'prisma.audit_logs.',
  'prisma.featureFlag.': 'prisma.feature_flags.',
  'prisma.billingStatus.': 'prisma.billing_status.',
  'prisma.apiUsageRecord.': 'prisma.api_usage_records.',
  'prisma.roleFeature.': 'prisma.role_features.',
  'prisma.userFeature.': 'prisma.user_features.',
  'prisma.automationProposal.': 'prisma.automation_proposals.',
  'prisma.founderAuditLog.': 'prisma.founder_audit_logs.',
  'prisma.agencyClientRelationship.': 'prisma.agency_client_relationships.',
};

let filesFixed = 0;
let totalChanges = 0;

async function getAllFiles(dir, exts = ['.ts', '.js', '.tsx']) {
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

async function fixPrismaModels(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;
  
  for (const [incorrect, correct] of Object.entries(MODEL_FIXES)) {
    const regex = new RegExp(incorrect.replace('.', '\\.'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, correct);
      changed = true;
      changeCount += matches.length;
    }
  }
  
  if (changed) {
    await fs.writeFile(filePath, content, 'utf8');
    filesFixed++;
    totalChanges += changeCount;
    console.log(`✓ Fixed ${changeCount} model names in ${path.relative(process.cwd(), filePath)}`);
  }
  
  return changed;
}

async function main() {
  console.log('🔧 Fixing Prisma model name mismatches...\n');
  
  const files = await getAllFiles(SRC_DIR);
  console.log(`Scanning ${files.length} files\n`);
  
  for (const file of files) {
    await fixPrismaModels(file);
  }
  
  console.log('\n✅ Prisma model fix complete!');
  console.log(`📊 Fixed ${totalChanges} model references in ${filesFixed} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
