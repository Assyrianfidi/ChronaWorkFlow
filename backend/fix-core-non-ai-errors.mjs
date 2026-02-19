#!/usr/bin/env node
/**
 * Fix all remaining non-AI core errors
 */

import fs from 'fs/promises';

const targetFixes = {
  // Fix companies.controller.ts - AppError with template literals
  'src/controllers/companies.controller.ts': [
    { find: /new AppError\((\d+), `([^`]*)\$\{userId\}([^`]*)`\)/g, replace: 'new AppError($1, `$2${String(userId)}$3`)' },
    { find: /new AppError\((\d+), `([^`]*)\$\{companyId\}([^`]*)`\)/g, replace: 'new AppError($1, `$2${String(companyId)}$3`)' },
  ],
  
  // Fix auth.middleware.ts - template literal issues
  'src/middleware/auth.middleware.ts': [
    { find: /new AppError\((\d+), `([^`]*)\$\{([^}]+)\}([^`]*)`\)/g, replace: 'new AppError($1, `$2${String($3)}$4`)' },
  ],
  
  // Fix error.middleware.ts - similar issues
  'src/middleware/error.middleware.ts': [
    { find: /new ApiError\((\d+), `([^`]*)\$\{([^}]+)\}([^`]*)`\)/g, replace: 'new ApiError($1, `$2${String($3)}$4`)' },
  ],
  
  // Fix pagination.middleware.ts - already attempted, try more aggressive fix
  'src/middleware/pagination.middleware.ts': [
    { find: /req\.query\.page/g, replace: 'Number(req.query.page || 1)' },
    { find: /req\.query\.limit/g, replace: 'Number(req.query.limit || 10)' },
  ],
  
  // Fix security.middleware.ts - type indexing
  'src/middleware/security.middleware.ts': [
    { find: /const ipAttempts = \{\};/g, replace: 'const ipAttempts: Record<string, number> = {};' },
    { find: /const suspiciousIPs: string\[\] = \[\];/g, replace: 'const suspiciousIPs: string[] = [];' },
  ],
  
  // Fix admin.controller.ts - implicit any
  'src/controllers/admin.controller.ts': [
    { find: /\.map\(sub =>/g, replace: '.map((sub: any) =>' },
    { find: /\.map\(s =>/g, replace: '.map((s: any) =>' },
    { find: /\.filter\(s =>/g, replace: '.filter((s: any) =>' },
  ],
  
  // Fix reports.controller.ts - variable scope
  'src/controllers/reports.controller.ts': [
    { find: /const \{ title, amount, description, status, reportType \} = req\.body;/g, 
      replace: 'const { title, amount, description, status, reportType } = req.body || {};' },
    { find: /data: \{ reportType,/g, replace: 'data: { reportType: reportType || "",' },
    { find: /description:/g, replace: 'description: description || "",' },
  ],
  
  // Fix server.ts - implicit any
  'server.ts': [
    { find: /\$transaction\(async \(tx\) =>/g, replace: '$transaction(async (tx: any) =>' },
  ],
  
  // Fix business-logic files
  'src/business-logic/anti-fraud/fraud.detector.ts': [
    { find: /const riskScores = \{\};/g, replace: 'const riskScores: Record<string, number> = {};' },
  ],
  
  'src/business-logic/validators/domain.validator.ts': [
    { find: /maxLength: "255"/g, replace: 'maxLength: 255' },
  ],
};

async function fixFile(filePath, fixes) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    for (const fix of fixes) {
      const beforeLength = content.length;
      content = content.replace(fix.find, fix.replace);
      if (content.length !== beforeLength) {
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
  let fixedCount = 0;
  
  for (const [filePath, fixes] of Object.entries(targetFixes)) {
    const wasFixed = await fixFile(filePath, fixes);
    if (wasFixed) {
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  
  // Now remove legacy files
  console.log('\n📁 Removing legacy files...');
  const legacyFiles = [
    'src/models/AuditLog.ts',
    'src/models/Organization.ts',
    'src/models/User.ts',
  ];
  
  for (const file of legacyFiles) {
    try {
      await fs.unlink(file);
      console.log(`✓ Removed ${file}`);
    } catch (error) {
      console.log(`  ${file} - already removed or not found`);
    }
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
