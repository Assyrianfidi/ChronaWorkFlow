const fs = require('fs');
const path = require('path');

// Key JavaScript files to migrate to TypeScript (excluding test files and disabled files)
const jsToMigrate = [
  'src/index.js',
  'src/config.js',
  'src/envValidator.js',
  'src/utils/responseEnvelope.js',
  'src/services/auditLogger.service.js',
  'src/services/databaseConstraints.service.js',
  'src/services/databaseSecurity.service.js',
  'src/controllers/authController.js',
  'src/controllers/reports.controller.js',
  'src/middleware/auth.js',
  'src/middleware/auth.middleware.js',
  'src/routes/accounts.routes.js',
  'src/routes/auth.routes.js',
  'src/routes/businesses.routes.js',
  'src/routes/clients.routes.js',
  'src/routes/invoices.routes.js',
  'src/routes/reports.routes.js',
  'src/routes/transactions.routes.js',
  'src/routes/users.routes.js',
  'src/routes/monitoring.routes.js'
];

function migrateFileToTypeScript(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const tsPath = fullPath.replace('.js', '.ts');
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  if (fs.existsSync(tsPath)) {
    console.log(`⚠️  TypeScript file already exists: ${filePath} -> ${path.basename(tsPath)}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Add TypeScript transformations
  
  // 1. Convert require statements to import (for non-relative modules)
  content = content.replace(
    /const\s+({[^}]+})\s*=\s*require\("([^"]+)"\);?/g,
    'import $1 from "$2";'
  );
  
  // 2. Convert require statements to import (for relative modules)
  content = content.replace(
    /const\s+({[^}]+})\s*=\s*require\("\.\/([^"]+)"\);?/g,
    'import $1 from "./$2";'
  );
  
  content = content.replace(
    /const\s+({[^}]+})\s*=\s*require\("\.\.\/([^"]+)"\);?/g,
    'import $1 from "../$1";'
  );
  
  // 3. Convert module.exports to export default
  content = content.replace(
    /module\.exports\s*=\s*([^;]+);?/g,
    'export default $1;'
  );
  
  // 4. Convert exports.property to export const
  content = content.replace(
    /exports\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
    'export const $1 = $2;'
  );
  
  // 5. Add basic type annotations for common patterns
  
  // Express req/res/next
  content = content.replace(
    /\(req,\s*res,\s*next\)/g,
    '(req: any, res: any, next: any)'
  );
  
  content = content.replace(
    /\(req,\s*res\)/g,
    '(req: any, res: any)'
  );
  
  // Function parameters
  content = content.replace(
    /function\s+(\w+)\(([^)]*)\)/g,
    'function $1($2: any)'
  );
  
  // Async functions
  content = content.replace(
    /async\s+function\s+(\w+)\(([^)]*)\)/g,
    'async function $1($2: any)'
  );
  
  // Arrow functions with single parameter
  content = content.replace(
    /\((\w+)\)\s*=>/g,
    '($1: any) =>'
  );
  
  // Arrow functions with multiple parameters
  content = content.replace(
    /\(([^)]+)\)\s*=>/g,
    '($1: any) =>'
  );
  
  // 6. Add JSDoc comments as type annotations where helpful
  content = content.replace(
    /\/\*\*\s*\n\s*\*\s*@param\s*{([^}]+)}\s*(\w+)\s*([^*]*)\*\//g,
    '/**\n * @param $2 $3\n */'
  );
  
  // Write the TypeScript file
  fs.writeFileSync(tsPath, content);
  
  // Remove the original JavaScript file
  fs.unlinkSync(fullPath);
  
  console.log(`✅ Migrated: ${filePath} -> ${path.basename(tsPath)}`);
}

function main() {
  console.log('🔄 Starting TypeScript migration...\n');
  
  // Check if TypeScript dependencies are installed
  try {
    require('typescript');
    console.log('✅ TypeScript is installed');
  } catch (error) {
    console.log('❌ TypeScript is not installed. Please run: npm install --save-dev typescript @types/node');
    process.exit(1);
  }
  
  // Migrate each file
  jsToMigrate.forEach(migrateFileToTypeScript);
  
  console.log('\n✅ TypeScript migration completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run `npm run build` to check for TypeScript errors');
  console.log('2. Fix any type errors by adding proper type annotations');
  console.log('3. Update import statements in other files');
  console.log('4. Run tests to ensure everything works correctly');
}

if (require.main === module) {
  main();
}

module.exports = { migrateFileToTypeScript };
