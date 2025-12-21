import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const CHANGES = {
  filesUpdated: 0,
  emptyStatesStandardized: 0,
  loadingStatesStandardized: 0,
};

// Patterns to identify empty states
const EMPTY_STATE_PATTERNS = [
  // Direct text content patterns
  { 
    pattern: /<div[^>]*>\s*No (?:data|records|results|transactions|inventory|reports|notifications)[^<]*<\/div>/gi,
    replacement: (match: string) => {
      const title = match.replace(/<[^>]*>/g, '').trim();
      return `<EmptyState size="sm" title="${title}" />`;
    }
  },
  // Common empty state divs
  {
    pattern: /<div[^>]*>\s*<p[^>]*>No (?:data|records|results|transactions|inventory|reports|notifications)[^<]*<\/p>\s*<\/div>/gi,
    replacement: (match: string) => {
      const title = match.replace(/<[^>]*>/g, '').trim();
      return `<EmptyState size="sm" title="${title}" />`;
    }
  },
  // Common empty state with icon
  {
    pattern: /<div[^>]*>\s*<[^>]*>\s*<[^>]*>\s*No (?:data|records|results|transactions|inventory|reports|notifications)[^<]*<\/div>/gi,
    replacement: (match: string) => {
      const title = match.replace(/<[^>]*>/g, '').trim();
      return `<EmptyState size="sm" title="${title}" />`;
    }
  }
];

// Patterns to identify loading states
const LOADING_STATE_PATTERNS = [
  // Inline spinners
  {
    pattern: /<div[^>]*>\s*<svg[^>]*class=["'][^"']*(animate-spin|spinner|loading)[^"']*["'][^>]*>.*<\/svg>\s*<\/div>/gis,
    replacement: '<LoadingState size="sm" />'
  },
  // Text loading indicators
  {
    pattern: /<div[^>]*>\s*Loading[^<]*<\/div>/gi,
    replacement: '<LoadingState size="sm" />'
  },
  // Skeleton loaders
  {
    pattern: /<div[^>]*>\s*<div[^>]*(skeleton|shimmer|pulse)[^>]*>.*<\/div>\s*<\/div>/gis,
    replacement: '<LoadingState size="sm" />'
  }
];

async function processFile(filePath: string): Promise<void> {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Process empty states
    for (const { pattern, replacement } of EMPTY_STATE_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          const result = typeof replacement === 'function' 
            ? replacement(match) 
            : replacement;
          CHANGES.emptyStatesStandardized++;
          modified = true;
          return result;
        });
      }
    }

    // Process loading states
    for (const { pattern, replacement } of LOADING_STATE_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          const result = typeof replacement === 'function' 
            ? replacement(match) 
            : replacement;
          CHANGES.loadingStatesStandardized++;
          modified = true;
          return result;
        });
      }
    }

    // Add EmptyState import if needed
    if (content.includes('EmptyState') && !content.includes("from '@/components/ui/EmptyState'")) {
      content = content.replace(
        /import\s+[^;]+;/, 
        `$&\nimport { EmptyState } from '@/components/ui/EmptyState';`
      );
      modified = true;
    }

    // Add LoadingState import if needed
    if (content.includes('LoadingState') && !content.includes("from '@/components/ui/LoadingState'")) {
      content = content.replace(
        /import\s+[^;]+;/, 
        `$&\nimport { LoadingState } from '@/components/ui/LoadingState';`
      );
      modified = true;
    }

    if (modified) {
      await writeFile(filePath, content, 'utf8');
      CHANGES.filesUpdated++;
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function walkDir(dir: string): Promise<string[]> {
  let files: string[] = [];
  const items = await readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    // Skip node_modules and other non-source directories
    if (item.name === 'node_modules' || item.name === '.next' || item.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files = [...files, ...(await walkDir(fullPath))];
    } else if (item.isFile() && /\.(tsx|jsx|js|ts)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Starting UI standardization...\n');
  
  const files = await walkDir(SRC_DIR);
  console.log(`🔍 Found ${files.length} files to process\n`);
  
  for (const file of files) {
    await processFile(file);
  }

  console.log('\n✨ Standardization complete!');
  console.log(`- Updated ${CHANGES.filesUpdated} files`);
  console.log(`- Standardized ${CHANGES.emptyStatesStandardized} empty states`);
  console.log(`- Standardized ${CHANGES.loadingStatesStandardized} loading states`);
  console.log('\n✅ Task 3 - UI Standardization Complete!');
}

main().catch(console.error);
