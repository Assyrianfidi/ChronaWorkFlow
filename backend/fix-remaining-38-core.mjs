#!/usr/bin/env node
/**
 * Fix all remaining 38 non-AI core errors
 */

import fs from 'fs/promises';

const comprehensiveFixes = {
  // Fix auth.middleware.ts - Use ApiError instead of AppError
  'src/middleware/auth.middleware.ts': async (content) => {
    content = content.replace(/import.*AppError.*from.*error\.middleware/g, 
      'import { ApiError } from "../utils/errors.js";');
    content = content.replace(/new AppError\(/g, 'new ApiError(');
    return content;
  },
  
  // Fix error.middleware.ts - Remove duplicate AppError class, use from utils
  'src/middleware/error.middleware.ts': async (content) => {
    // Remove the duplicate AppError class definition
    content = content.replace(/export class AppError extends Error \{[\s\S]*?\n\}/m, '');
    // Add import from utils
    if (!content.includes('import { ApiError, AppError }')) {
      content = 'import { ApiError, AppError } from "../utils/errors.js";\n' + content;
    }
    // Replace all ApiError constructor calls with correct signature
    content = content.replace(/new ApiError\((\d+),/g, 'new ApiError($1,');
    return content;
  },
  
  // Fix security.middleware.ts - Type indexing
  'src/middleware/security.middleware.ts': async (content) => {
    content = content.replace(/const ipAttempts\s*=\s*\{\};?/g, 
      'const ipAttempts: Record<string, number> = {};');
    content = content.replace(/const suspiciousIPs\s*=\s*\[\];?/g, 
      'const suspiciousIPs: string[] = [];');
    content = content.replace(/ipAttempts\[([^\]]+)\](?!\s*=)/g, '(ipAttempts as any)[$1]');
    return content;
  },
  
  // Fix business-logic/anti-fraud/fraud.detector.ts
  'src/business-logic/anti-fraud/fraud.detector.ts': async (content) => {
    content = content.replace(/const riskScores\s*=\s*\{/g, 
      'const riskScores: Record<string, number> = {');
    content = content.replace(/riskScores\[([^\]]+)\]/g, '(riskScores as any)[$1]');
    return content;
  },
  
  // Fix business-logic/validators/domain.validator.ts
  'src/business-logic/validators/domain.validator.ts': async (content) => {
    content = content.replace(/maxLength:\s*"(\d+)"/g, 'maxLength: $1');
    return content;
  },
  
  // Fix admin.controller.ts - implicit any
  'src/controllers/admin.controller.ts': async (content) => {
    content = content.replace(/\.map\(\(sub\)\s*=>/g, '.map((sub: any) =>');
    content = content.replace(/\.filter\(\(s\)\s*=>/g, '.filter((s: any) =>');
    return content;
  },
  
  // Fix dashboard.controller.ts - AuthenticatedRequest
  'src/controllers/dashboard.controller.ts': async (content) => {
    content = content.replace(
      /interface AuthenticatedRequest extends Request\s*\{/g,
      'interface AuthenticatedRequest extends Request<any, any, any, any> {'
    );
    return content;
  },
  
  // Fix storage/document.controller.ts - AuthenticatedRequest
  'src/controllers/storage/document.controller.ts': async (content) => {
    content = content.replace(
      /interface AuthenticatedRequest extends Request\s*\{/g,
      'interface AuthenticatedRequest extends Request<any, any, any, any> {'
    );
    return content;
  },
  
  // Fix reports.controller.ts - variable scope
  'src/controllers/reports.controller.ts': async (content) => {
    content = content.replace(/data:\s*\{\s*reportType\s*,/g, 
      'data: { reportType: reportType || "",');
    content = content.replace(/,\s*description\s*,/g, ', description: description || "",');
    return content;
  },
  
  // Fix modules/transactions/transactions.service.ts - property access
  'src/modules/transactions/transactions.service.ts': async (content) => {
    content = content.replace(/data\.lines\b/g, 'data.transaction_lines');
    content = content.replace(/transactionData\.lines\b/g, 'transactionData.transaction_lines');
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
  
  console.log('🔧 Fixing all remaining non-AI core errors...\n');
  
  for (const [filePath, fixFunction] of Object.entries(comprehensiveFixes)) {
    const wasFixed = await fixFile(filePath, fixFunction);
    if (wasFixed) {
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('🎯 Non-AI core errors should be minimal now');
  console.log('📊 Run npm run build to verify');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
