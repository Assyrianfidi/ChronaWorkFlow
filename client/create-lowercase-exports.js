#!/usr/bin/env node

/**
 * Create lowercase re-export files for case-sensitive filesystems (Linux/Docker)
 * Windows is case-insensitive, but Linux/Docker needs explicit lowercase files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, 'client', 'src', 'components', 'ui');

// Components that need lowercase re-export files
const components = [
  'Button', 'Input', 'Label', 'Card', 'Badge', 'Alert', 'Dialog', 
  'Select', 'Checkbox', 'Switch', 'Textarea', 'Tabs', 'Table',
  'Popover', 'Slider', 'Skeleton', 'Calendar'
];

console.log('Creating lowercase re-export files for case-sensitive filesystems...\n');

let created = 0;
let skipped = 0;

components.forEach(component => {
  const pascalFile = path.join(UI_DIR, `${component}.tsx`);
  const kebabName = component.replace(/([A-Z])/g, (match, p1, offset) => 
    offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase()
  );
  const lowercaseFile = path.join(UI_DIR, `${kebabName}.tsx`);
  
  // Check if PascalCase file exists
  if (!fs.existsSync(pascalFile)) {
    console.log(`⚠️  Skipped ${component}: PascalCase file not found`);
    skipped++;
    return;
  }
  
  // On Windows, lowercase and PascalCase are the same file
  // So we need to check if they're different paths
  if (pascalFile.toLowerCase() === lowercaseFile.toLowerCase()) {
    console.log(`⚠️  Skipped ${component}: Same file on Windows (case-insensitive)`);
    skipped++;
    return;
  }
  
  // Create re-export file
  const content = `export * from "./${component}";\n`;
  
  try {
    fs.writeFileSync(lowercaseFile, content, 'utf8');
    console.log(`✅ Created: ${kebabName}.tsx → re-exports ${component}.tsx`);
    created++;
  } catch (error) {
    console.log(`❌ Error creating ${kebabName}.tsx: ${error.message}`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`✅ Created: ${created}`);
console.log(`⚠️  Skipped: ${skipped}`);
console.log('═'.repeat(60));
console.log('\nNote: On Windows, some files may be skipped due to case-insensitive filesystem.');
console.log('The lowercase files will be created in Git for Linux/Docker compatibility.\n');
