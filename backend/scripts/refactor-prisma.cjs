const fs = require('fs');
const path = require('path');

// List of TypeScript files to refactor (excluding disabled files)
const tsFiles = [
  'src/server.ts',
  'src/ai/accounting-ai-engine.ts',
  'src/ai/predictive-insights-backend.ts',
  'src/audit/audit-trail-system.ts',
  'src/business-logic/business.logic.service.ts',
  'src/controllers/api-v3-upgrades.ts',
  'src/controllers/report.controller.ts',
  'src/controllers/user.controller.ts',
  'src/controllers/billing/billing.controller.ts',
  'src/middleware/auth.ts',
  'src/modules/transactions/transactions.model.ts',
  'src/performance/backend-performance-engine.ts',
  'src/routes/invoicing/customer.routes.ts',
  'src/routes/invoicing/product.routes.ts',
  'src/routes/invoicing/reports.routes.ts',
  'src/services/auth.service.ts',
  'src/services/refreshToken.service.ts',
  'src/services/billing/stripe.service.ts',
  'src/services/email/email.service.ts',
  'src/services/invoicing/invoice.service.ts',
  'src/services/invoicing/pdf.service.ts',
  'src/services/invoicing/payment.service.ts',
  'src/services/invoicing/utils/invoice-number.util.ts',
  'src/services/storage/document.service.ts',
  'src/utils/queryOptimizer.ts'
];

// List of JavaScript files to refactor
const jsFiles = [
  'src/services/databaseConstraints.service.js',
  'src/services/databaseSecurity.service.js',
  'src/services/auditLogger.service.js',
  'src/controllers/authController.js',
  'src/controllers/reports.controller.js',
  'src/middleware/auth.js',
  'src/middleware/auth.middleware.js'
];

function refactorTypeScriptFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace import statement
  content = content.replace(
    /import\s*\{\s*PrismaClient\s*\}\s*from\s*['"]@prisma\/client['"];?/g,
    "import { prisma, PrismaClientSingleton } from '../lib/prisma';"
  );
  
  // Replace new PrismaClient() with prisma (singleton instance)
  content = content.replace(
    /new\s+PrismaClient\(\)/g,
    'prisma'
  );
  
  // Replace constructor assignments
  content = content.replace(
    /this\.prisma\s*=\s*new\s+PrismaClient\(\)/g,
    'this.prisma = prisma'
  );
  
  // Replace const assignments
  content = content.replace(
    /const\s+prisma\s*=\s*new\s+PrismaClient\(\)/g,
    'const prismaClient = prisma'
  );
  
  // Replace variable assignments
  content = content.replace(
    /let\s+prisma\s*=\s*new\s+PrismaClient\(\)/g,
    'let prismaClient = prisma'
  );
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Refactored TypeScript: ${filePath}`);
}

function refactorJavaScriptFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace require statement
  content = content.replace(
    /const\s*\{\s*PrismaClient\s*\}\s*=\s*require\(['"]@prisma\/client['"]\);?/g,
    "const { PrismaClientSingleton } = require('../lib/prisma');"
  );
  
  // Replace new PrismaClient() with singleton
  content = content.replace(
    /new\s+PrismaClient\(\)/g,
    'PrismaClientSingleton.getInstance()'
  );
  
  // Replace constructor assignments
  content = content.replace(
    /this\.prisma\s*=\s*new\s+PrismaClient\(\)/g,
    'this.prisma = PrismaClientSingleton.getInstance()'
  );
  
  // Replace const assignments
  content = content.replace(
    /const\s+prisma\s*=\s*new\s+PrismaClient\(\)/g,
    'const prisma = PrismaClientSingleton.getInstance()'
  );
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Refactored JavaScript: ${filePath}`);
}

console.log('🔄 Starting Prisma client refactoring...\n');

// Refactor TypeScript files
tsFiles.forEach(refactorTypeScriptFile);

// Refactor JavaScript files
jsFiles.forEach(refactorJavaScriptFile);

console.log('\n✅ Prisma client refactoring completed!');
