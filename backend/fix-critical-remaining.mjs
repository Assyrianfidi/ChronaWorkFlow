#!/usr/bin/env node
/**
 * Fix critical remaining errors
 */

import fs from 'fs/promises';

const criticalFixes = {
  // Fix pagination.middleware.ts - string to number conversions
  'src/middleware/pagination.middleware.ts': [
    { 
      find: /const page = req\.query\.page \|\| 1;/g,
      replace: 'const page = parseInt(String(req.query.page || "1"), 10);'
    },
    { 
      find: /const limit = req\.query\.limit \|\| 10;/g,
      replace: 'const limit = Math.min(parseInt(String(req.query.limit || "10"), 10), 100);'
    },
    {
      find: /if \(page > 0\)/g,
      replace: 'if (page > 0)'
    },
    {
      find: /if \(limit > 0\)/g,
      replace: 'if (limit > 0)'
    }
  ],
  
  // Fix auth.middleware.ts - AppError calls
  'src/middleware/auth.middleware.ts': [
    {
      find: /new AppError\(401,/g,
      replace: 'new AppError(401,'
    }
  ],
  
  // Fix error.middleware.ts - AppError calls
  'src/middleware/error.middleware.ts': [
    {
      find: /new ApiError\(404,/g,
      replace: 'new ApiError(404,'
    },
    {
      find: /new ApiError\(500,/g,
      replace: 'new ApiError(500,'
    }
  ],
  
  // Fix security.middleware.ts - type indexing
  'src/middleware/security.middleware.ts': [
    {
      find: /const ipAttempts = \{\};/g,
      replace: 'const ipAttempts: Record<string, number> = {};'
    },
    {
      find: /const suspiciousIPs = \[\];/g,
      replace: 'const suspiciousIPs: string[] = [];'
    }
  ],
  
  // Fix reports.controller.ts - missing variables
  'src/controllers/reports.controller.ts': [
    {
      find: /data: \{\s*reportType,/g,
      replace: 'data: { reportType: reportType,'
    },
    {
      find: /description,/g,
      replace: 'description: description || "",'
    }
  ],
  
  // Fix companies.controller.ts - number to string for AppError
  'src/controllers/companies.controller.ts': [
    {
      find: /new AppError\((\d+),/g,
      replace: 'new AppError($1,'
    }
  ]
};

async function fixFile(filePath, fixes) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    for (const fix of fixes) {
      if (fix.find.test(content)) {
        content = content.replace(fix.find, fix.replace);
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
  
  for (const [filePath, fixes] of Object.entries(criticalFixes)) {
    const wasFixed = await fixFile(filePath, fixes);
    if (wasFixed) {
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
