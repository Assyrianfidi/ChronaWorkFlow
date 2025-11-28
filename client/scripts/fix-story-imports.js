const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STORIES_DIR = path.join(__dirname, '../src');
const LOG_FILE = path.join(__dirname, '../devops/storybook-import-fixes.log');

const log = (message) => {
  console.log(message);
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} - ${message}\n`);
};

const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check for default import patterns
    const importRegex = /import\s+([\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, imports, source] = match;
      if (imports.includes('default') && !source.startsWith('@storybook/')) {
        log(`Found potential default import in ${filePath}: ${fullMatch}`);
        // In a real implementation, we would analyze the actual component file
        // to determine the correct named exports and update accordingly
      }
    }
    
    // Check for .stories.ts files that should be .stories.tsx
    if (filePath.endsWith('.stories.ts') && content.includes('</') && content.includes('>')) {
      const newPath = filePath.replace(/\.stories\.ts$/, '.stories.tsx');
      log(`Renaming ${filePath} to ${newPath} (contains JSX)`);
      fs.renameSync(filePath, newPath);
      return { updated: true, renamed: true };
    }
    
    return { updated, renamed: false };
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`);
    return { updated: false, renamed: false, error: error.message };
  }
};\n
const findStoryFiles = (dir) => {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(findStoryFiles(fullPath));
    } else if (/\.stories\.(ts|tsx|js|jsx)$/.test(item.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
};

// Main execution
const main = () => {
  // Clear log file
  fs.writeFileSync(LOG_FILE, `Storybook Import Fix Log - ${new Date().toISOString()}\n\n`);
  
  log('Starting Storybook import fix process...');
  
  try {
    const storyFiles = findStoryFiles(STORIES_DIR);
    log(`Found ${storyFiles.length} story files to process`);
    
    let fixedCount = 0;
    let renamedCount = 0;
    
    for (const file of storyFiles) {
      const { updated, renamed } = processFile(file);
      if (updated) fixedCount++;
      if (renamed) renamedCount++;
    }
    
    log(`\nProcess completed.`);
    log(`- Files processed: ${storyFiles.length}`);
    log(`- Files fixed: ${fixedCount}`);
    log(`- Files renamed: ${renamedCount}`);
    
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
};

main();
