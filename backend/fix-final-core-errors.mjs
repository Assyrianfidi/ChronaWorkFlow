#!/usr/bin/env node
/**
 * Final fix for all remaining core errors (non-AI)
 */

import fs from 'fs/promises';

const fixes = {
  // Fix business-logic/anti-fraud/fraud.detector.ts
  'src/business-logic/anti-fraud/fraud.detector.ts': async (content) => {
    // Find the riskScores initialization and add type annotation
    content = content.replace(
      /const riskScores\s*=\s*\{\s*low:\s*0,\s*medium:\s*0,\s*high:\s*0,\s*critical:\s*0\s*\}/g,
      'const riskScores: { low: number; medium: number; high: number; critical: number } = { low: 0, medium: 0, high: 0, critical: 0 }'
    );
    return content;
  },

  // Fix business-logic/validators/domain.validator.ts
  'src/business-logic/validators/domain.validator.ts': async (content) => {
    content = content.replace(/maxLength:\s*"(\d+)"/g, 'maxLength: $1');
    content = content.replace(/minLength:\s*"(\d+)"/g, 'minLength: $1');
    return content;
  },

  // Fix admin.controller.ts
  'src/controllers/admin.controller.ts': async (content) => {
    content = content.replace(/\.map\(\(sub\)\s*=>/g, '.map((sub: any) =>');
    content = content.replace(/\.filter\(\(s\)\s*=>/g, '.filter((s: any) =>');
    content = content.replace(/\.forEach\(\(([a-z])\)\s*=>/g, '.forEach(($1: any) =>');
    return content;
  },

  // Fix dashboard.controller.ts
  'src/controllers/dashboard.controller.ts': async (content) => {
    content = content.replace(
      /interface AuthenticatedRequest extends Request\s*\{/g,
      'interface AuthenticatedRequest extends Request<any, any, any, any> {'
    );
    return content;
  },

  // Fix storage/document.controller.ts
  'src/controllers/storage/document.controller.ts': async (content) => {
    content = content.replace(
      /interface AuthenticatedRequest extends Request\s*\{/g,
      'interface AuthenticatedRequest extends Request<any, any, any, any> {'
    );
    // Fix import if needed
    if (content.includes('documentService')) {
      content = content.replace(
        /import\s*\{\s*documentService\s*\}/g,
        'import DocumentService'
      );
      content = content.replace(/documentService\./g, 'DocumentService.');
    }
    return content;
  },

  // Fix modules/transactions/transactions.service.ts
  'src/modules/transactions/transactions.service.ts': async (content) => {
    // The type definition uses 'lines', not 'transaction_lines'
    // Keep it consistent with the type
    content = content.replace(/data\.transaction_lines/g, 'data.lines');
    content = content.replace(/transactionData\.transaction_lines/g, 'transactionData.lines');
    return content;
  },
};

async function fixFile(filePath, fixFunction) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const newContent = await fixFunction(content);
    
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  let fixedCount = 0;
  
  console.log('🔧 Applying final core error fixes...\n');
  
  for (const [filePath, fixFunction] of Object.entries(fixes)) {
    const wasFixed = await fixFile(filePath, fixFunction);
    if (wasFixed) {
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('📊 Run npm run build to verify');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
