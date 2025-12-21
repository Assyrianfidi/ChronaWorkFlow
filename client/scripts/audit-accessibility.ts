import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const ISSUES = {
  missingAlt: 0,
  missingAriaLabel: 0,
  missingRole: 0,
  colorContrast: 0,
  focusManagement: 0,
  semanticHTML: 0,
  keyboardNavigation: 0,
  formLabels: 0,
  totalFiles: 0,
  filesWithIssues: 0,
};

const PATTERNS = {
  // Missing alt text in images
  missingAlt: /<img((?![^>]*alt=)[^>]*)>/g,
  
  // Interactive elements without aria-label or aria-labelledby
  missingAriaLabel: /<(button|a|input|select|textarea)((?![^>]*(aria-label=|aria-labelledby=|title=))[^>]*)>/g,
  
  // Missing role attributes where needed
  missingRole: /<(div|span|section|article|header|footer|main|nav|aside)((?![^>]*role=)[^>]*)>/g,
  
  // Color contrast issues (basic check - will need manual verification)
  colorContrast: /(?:color|background(?:-color)?):\s*#[0-9a-fA-F]{3,6}(?![a-fA-F0-9])/g,
  
  // Missing focus management
  focusManagement: /<[a-z][a-z0-9]*\s+[^>]*(?:onClick|onKeyDown|onKeyUp|onKeyPress)=/g,
  
  // Non-semantic HTML elements used for interactive elements
  semanticHTML: /<(div|span)\s+[^>]*(?:onClick|onKeyDown|onKeyUp|onKeyPress)=/g,
  
  // Missing keyboard navigation
  keyboardNavigation: /<div[^>]*role=["'](?:button|tab|menuitem|link)["'][^>]*>/g,
  
  // Form controls without proper labels
  formLabels: /<(input|select|textarea)((?![^>]*(id=|aria-label=|aria-labelledby=|title=))[^>]*)>/g,
};

async function checkFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    let hasIssues = false;
    
    for (const [issueType, pattern] of Object.entries(PATTERNS)) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        ISSUES[issueType as keyof typeof ISSUES] += matches.length;
        hasIssues = true;
        
        console.log(`\n⚠️  ${relativePath} - ${issueType}:`);
        matches.forEach((match, i) => {
          if (i < 3) { // Show first 3 issues of each type per file
            console.log(`   ${match.substring(0, 100)}${match.length > 100 ? '...' : ''}`);
          } else if (i === 3) {
            console.log(`   ...and ${matches.length - 3} more`);
          }
        });
      }
    }
    
    ISSUES.totalFiles++;
    if (hasIssues) ISSUES.filesWithIssues++;
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function walkDir(dir: string): Promise<string[]> {
  let files: string[] = [];
  const items = await readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
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
  console.log('🚀 Starting accessibility audit...\n');
  
  const files = await walkDir(SRC_DIR);
  
  for (const file of files) {
    await checkFile(file);
  }
  
  // Print summary
  console.log('\n📊 Accessibility Audit Summary:');
  console.log('='.repeat(50));
  console.log(`📂 Files scanned: ${ISSUES.totalFiles}`);
  console.log(`⚠️  Files with issues: ${ISSUES.filesWithIssues} (${Math.round((ISSUES.filesWithIssues / ISSUES.totalFiles) * 100)}%)`);
  console.log('\n🔍 Issues found:');
  console.log('-'.repeat(50));
  console.log(`❌ Missing alt text: ${ISSUES.missingAlt}`);
  console.log(`❌ Missing ARIA labels: ${ISSUES.missingAriaLabel}`);
  console.log(`❌ Missing roles: ${ISSUES.missingRole}`);
  console.log(`⚠️  Potential color contrast issues: ${ISSUES.colorContrast}`);
  console.log(`⚠️  Focus management issues: ${ISSUES.focusManagement}`);
  console.log(`⚠️  Non-semantic HTML: ${ISSUES.semanticHTML}`);
  console.log(`⚠️  Keyboard navigation issues: ${ISSUES.keyboardNavigation}`);
  console.log(`❌ Form label issues: ${ISSUES.formLabels}`);
  
  const totalIssues = Object.values(ISSUES).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
  console.log('\n🔧 Total issues found:', totalIssues);
  
  if (totalIssues > 0) {
    console.log('\n❌ Accessibility issues found. Please address them before proceeding.');
    process.exit(1);
  } else {
    console.log('\n✅ No accessibility issues found!');
  }
}

main().catch(console.error);
