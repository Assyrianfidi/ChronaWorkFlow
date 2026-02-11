#!/usr/bin/env node

/**
 * Fix case-sensitive imports for UI components
 * Replace lowercase imports with PascalCase for Linux/Docker compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'client', 'src');

// Map of lowercase imports to PascalCase
const importMap = {
  'button': 'Button',
  'input': 'Input',
  'label': 'Label',
  'card': 'Card',
  'badge': 'Badge',
  'alert': 'Alert',
  'dialog': 'Dialog',
  'select': 'Select',
  'checkbox': 'Checkbox',
  'switch': 'Switch',
  'textarea': 'Textarea',
  'tabs': 'Tabs',
  'table': 'Table',
  'popover': 'Popover',
  'slider': 'Slider',
  'skeleton': 'Skeleton',
  'calendar': 'Calendar'
};

console.log('🔧 Fixing case-sensitive UI component imports...\n');

let filesFixed = 0;
let totalReplacements = 0;

// Find all TypeScript/TSX files
const files = glob.sync('**/*.{ts,tsx}', {
  cwd: SRC_DIR,
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**']
});

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileReplacements = 0;

  // Replace each lowercase import with PascalCase
  Object.entries(importMap).forEach(([lowercase, pascalCase]) => {
    const pattern = new RegExp(`from ["']@/components/ui/${lowercase}["']`, 'g');
    const newContent = content.replace(pattern, `from "@/components/ui/${pascalCase}"`);
    
    if (newContent !== content) {
      const matches = (content.match(pattern) || []).length;
      fileReplacements += matches;
      totalReplacements += matches;
      modified = true;
      content = newContent;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relativePath = path.relative(SRC_DIR, filePath);
    console.log(`✅ Fixed: ${relativePath} (${fileReplacements} replacements)`);
    filesFixed++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Files fixed: ${filesFixed}`);
console.log(`✅ Total replacements: ${totalReplacements}`);
console.log('═'.repeat(60));
console.log('\n✨ All imports fixed for case-sensitive filesystems!\n');
