#!/usr/bin/env node
/**
 * Fix Core System TypeScript Errors
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  {
    file: 'src/controllers/admin.controller.ts',
    changes: [
      {
        from: /from\s+['"](\.\.\/utils\/prisma)['"]/,
        to: "from '$1.js'"
      },
      {
        from: /logger\.critical\(/g,
        to: 'logger.error('
      },
      {
        from: /\(sum,\s*user\)\s*=>/g,
        to: '(sum: number, user: any) =>'
      },
      {
        from: /\(sub\)\s*=>/g,
        to: '(sub: any) =>'
      },
      {
        from: /\(sum,\s*sub\)\s*=>/g,
        to: '(sum: number, sub: any) =>'
      },
      {
        from: /\(s\)\s*=>/g,
        to: '(s: any) =>'
      },
      {
        from: /\(plan\)\s*=>/g,
        to: '(plan: any) =>'
      }
    ]
  },
  {
    file: 'src/controllers/auth.controller.ts',
    changes: [
      {
        from: /import\s+\{\s*User\s*\}\s+from\s+['"]@prisma\/client['"]/,
        to: "// User type removed - using Prisma generated types"
      },
      {
        from: /passwordChangedAt:\s*new Date\(\),?/g,
        to: '// passwordChangedAt removed - field does not exist'
      }
    ]
  },
  {
    file: 'src/middleware/auth.middleware.ts',
    changes: [
      {
        from: /ApiError/g,
        to: 'AppError'
      }
    ]
  }
];

async function applyFixes() {
  let totalFixed = 0;
  
  for (const fix of fixes) {
    const filePath = path.join(__dirname, fix.file);
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let changed = false;
      
      for (const change of fix.changes) {
        if (change.from.test(content)) {
          content = content.replace(change.from, change.to);
          changed = true;
        }
      }
      
      if (changed) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✓ Fixed ${fix.file}`);
        totalFixed++;
      }
    } catch (error) {
      console.log(`⚠️  Could not fix ${fix.file}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} files`);
}

applyFixes().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
