import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const SRC_DIR = path.join(__dirname, '..', 'src');
const FIXES_APPLIED = {
  jsJsImports: 0,
  duplicateReactImports: 0,
  tsIgnoreComments: 0,
  filesProcessed: 0,
};

async function processFile(filePath: string): Promise<void> {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Fix .js.js imports
    const jsJsImportRegex = /from\s+['"](.*?)\.js\.js['"]/g;
    const jsJsImports = [...content.matchAll(jsJsImportRegex)];
    
    jsJsImports.forEach((match) => {
      const [fullMatch, importPath] = match;
      // Convert relative paths to @/ paths when possible
      let newPath = importPath;
      if (importPath.startsWith('../../')) {
        newPath = `@/${importPath.replace(/^\.\.\/\//, '')}`;
      } else if (importPath.startsWith('../')) {
        newPath = `@/components/${importPath.replace(/^\.\.\//, '')}`;
      } else if (importPath.startsWith('./')) {
        newPath = importPath.replace(/\.js\.js$/, '');
      }
      
      content = content.replace(fullMatch, `from '${newPath}'`);
      FIXES_APPLIED.jsJsImports++;
      modified = true;
    });

    // Remove duplicate React imports
    const reactImports = content.match(/import\s+(?:\*\s+as\s+)?React\s+from\s+['"]react['"]/g) || [];
    if (reactImports.length > 1) {
      // Keep the first import and remove duplicates
      const firstImport = reactImports[0];
      content = content.replace(/import\s+(?:\*\s+as\s+)?React\s+from\s+['"]react['"]/g, '');
      content = `${firstImport}\n${content}`;
      FIXES_APPLIED.duplicateReactImports += reactImports.length - 1;
      modified = true;
    }

    // Remove @ts-ignore comments
    if (content.includes('@ts-ignore')) {
      content = content.replace(/\/\/\s*@ts-ignore\n?/g, '');
      FIXES_APPLIED.tsIgnoreComments++;
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
  console.log('🚀 Starting to fix .js.js imports...\n');
  
  const files = await walkDir(SRC_DIR);
  console.log(`🔍 Found ${files.length} files to process\n`);
  
  for (const file of files) {
    await processFile(file);
  }
  
  console.log('\n🎉 Fixes applied:');
  console.log(`- Fixed ${FIXES_APPLIED.jsJsImports} .js.js imports`);
  console.log(`- Removed ${FIXES_APPLIED.duplicateReactImports} duplicate React imports`);
  console.log(`- Removed ${FIXES_APPLIED.tsIgnoreComments} @ts-ignore comments`);
  console.log(`- Processed ${FIXES_APPLIED.filesProcessed} files in total\n`);
  
  if (FIXES_APPLIED.jsJsImports > 0) {
    console.log('✅ All .js.js imports have been fixed!');
  } else {
    console.log('ℹ️ No .js.js imports were found that needed fixing.');
  }
  
  console.log('\n✨ Process completed!');
}

main().catch(console.error);
