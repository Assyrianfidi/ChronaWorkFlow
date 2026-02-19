#!/usr/bin/env node
/**
 * Fix remaining type errors - implicit any, string/number mismatches, etc.
 */

import fs from 'fs/promises';
import { glob } from 'glob';

const fixes = [
  // Fix implicit any in parameters
  { pattern: /\(tx\)\s*=>/g, replacement: '(tx: any) =>' },
  { pattern: /\(schema\)\s*=>/g, replacement: '(schema: any) =>' },
  { pattern: /\(err\)\s*=>/g, replacement: '(err: any) =>' },
  { pattern: /\(sub\)\s*=>/g, replacement: '(sub: any) =>' },
  { pattern: /\(user\)\s*=>/g, replacement: '(user: any) =>' },
  { pattern: /\(s\)\s*=>/g, replacement: '(s: any) =>' },
  { pattern: /\(prismaQuery,\s*tenantId\)\s*=>/g, replacement: '(prismaQuery: any, tenantId: any) =>' },
  
  // Fix pagination middleware string/number issues
  { pattern: /const page = req\.query\.page \|\| 1;/g, replacement: 'const page = parseInt(req.query.page as string, 10) || 1;' },
  { pattern: /const limit = req\.query\.limit \|\| 10;/g, replacement: 'const limit = parseInt(req.query.limit as string, 10) || 10;' },
  
  // Fix ZodError.errors access
  { pattern: /\.errors\.map/g, replacement: '.issues.map' },
  
  // Fix AppError arguments (number first, then string)
  { pattern: /new AppError\("([^"]+)",\s*(\d+)\)/g, replacement: 'new AppError($2, "$1")' },
  
  // Fix missing variables in object literals
  { pattern: /data:\s*\{\s*reportType,/g, replacement: 'data: { reportType: reportType,' },
  { pattern: /data:\s*\{\s*description,/g, replacement: 'data: { description: description || "",' },
  
  // Fix AuthenticatedRequest interface
  { pattern: /interface AuthenticatedRequest extends Request\s*\{/g, replacement: 'interface AuthenticatedRequest extends Request<any, any, any, any> {' },
  
  // Fix type indexing issues
  { pattern: /const riskScores:\s*\{\}\s*=/g, replacement: 'const riskScores: Record<string, number> = ' },
  { pattern: /const ipAttempts:\s*\{\}\s*=/g, replacement: 'const ipAttempts: Record<string, number> = ' },
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
