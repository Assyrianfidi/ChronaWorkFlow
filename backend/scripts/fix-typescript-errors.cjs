const fs = require('fs');
const path = require('path');

// Files that need fixing
const filesToFix = [
  'src/index.ts',
  'src/middleware/auth.middleware.ts',
  'src/routes/monitoring.routes.ts',
  'src/services/auditLogger.service.ts',
  'src/services/databaseConstraints.service.ts',
  'src/services/databaseSecurity.service.ts',
  'src/controllers/authController.ts',
  'src/controllers/reports.controller.ts',
  'src/envValidator.ts'
];

function fixTypeScriptErrors(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Fix common TypeScript syntax errors
  
  // 1. Fix (: any) -> (any) or remove type annotations for now
  content = content.replace(/\(: any\)/g, '()');
  content = content.replace(/\(req: any, res: any: any\)/g, '(req: any, res: any)');
  content = content.replace(/\(req: any, res: any, next: any: any\)/g, '(req: any, res: any, next: any)');
  content = content.replace(/\(log: any: any\)/g, '(log: any)');
  content = content.replace(/\(alert: any: any\)/g, '(alert: any)');
  content = content.replace(/\(a: any: any\)/g, '(a: any)');
  content = content.replace(/\(attempt: any: any\)/g, '(attempt: any)');
  
  // 2. Fix function parameter declarations
  content = content.replace(/function (\w+)\(: any\)/g, 'function $1()');
  content = content.replace(/async function (\w+)\(: any\)/g, 'async function $1()');
  
  // 3. Fix arrow function parameters
  content = content.replace(/\((\w+): any: any\) =>/g, '($1: any) =>');
  
  // 4. Fix return statements that got broken
  content = content.replace(/return \(req: any, res: any, next: any: any\) =>/g, 'return (req: any, res: any, next: any) =>');
  
  // 5. Fix filter callbacks
  content = content.replace(/\.filter\(\(\w+: any: any\) =>/g, '.filter(($1: any) =>');
  
  // 6. Fix process.on handlers
  content = content.replace(/process\.on\("SIGINT", \(: any\) => \{/g, 'process.on("SIGINT", () => {');
  content = content.replace(/process\.on\("SIGTERM", \(: any\) => \{/g, 'process.on("SIGTERM", () => {');
  content = content.replace(/process\.on\("SIGUSR2", \(: any\) => \{/g, 'process.on("SIGUSR2", () => {');
  
  // 7. Fix server.close callback
  content = content.replace(/server\.close\(\(: any\) => \{/g, 'server.close(() => {');
  
  // Write the fixed file
  fs.writeFileSync(fullPath, content);
  
  console.log(`✅ Fixed: ${filePath}`);
}

function main() {
  console.log('🔧 Fixing TypeScript compilation errors...\n');
  
  filesToFix.forEach(fixTypeScriptErrors);
  
  console.log('\n✅ TypeScript errors fixed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run `npm run build` to verify fixes');
  console.log('2. Add proper type annotations gradually');
  console.log('3. Install missing @types packages if needed');
}

if (require.main === module) {
  main();
}

module.exports = { fixTypeScriptErrors };
