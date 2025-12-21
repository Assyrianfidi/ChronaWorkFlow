import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const FIXES_APPLIED = {
  jsImports: 0,
  filesProcessed: 0,
};

async function processFile(filePath: string): Promise<void> {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Fix .js imports in from clauses
    const jsImportRegex = /from\s+['"](.*?)\.js['"]/g;
    const jsImports = [...content.matchAll(jsImportRegex)];
    
    for (const match of jsImports) {
      const [fullMatch, importPath] = match;
      let newPath = importPath;
      
      // Only modify if it's not a node_modules import
      if (!importPath.startsWith('@/') && !importPath.startsWith('.')) {
        continue;
      }
      
      // Remove .js extension
      newPath = importPath.replace(/\.js$/, '');
      
      // Special handling for @/ imports
      if (importPath.startsWith('@/')) {
        newPath = importPath.replace(/\.js$/, '');
      }
      
      content = content.replace(fullMatch, `from '${newPath}'`);
      FIXES_APPLIED.jsImports++;
      modified = true;
    }

    if (modified) {
      await writeFile(filePath, content, 'utf8');
      FIXES_APPLIED.filesProcessed++;
      console.log(`✅ Processed: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function walkDir(dir: string): Promise<string[]> {
  let files: string[] = [];
  const items = await readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = [...files, ...(await walkDir(fullPath))];
    } else if (item.isFile() && /\.(tsx?|jsx?)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Starting to fix .js imports...\n');
  
  const files = await walkDir(SRC_DIR);
  console.log(`🔍 Found ${files.length} files to process\n`);
  
  for (const file of files) {
    await processFile(file);
  }

  console.log('\n✨ Fixes applied:');
  console.log(`- Fixed ${FIXES_APPLIED.jsImports} .js imports`);
  console.log(`- Processed ${FIXES_APPLIED.filesProcessed} files`);
  console.log('\n✅ Done!');
}

main().catch(console.error);
