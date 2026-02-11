#!/usr/bin/env node

/**
 * Add Named Exports to UI Components
 * Safely adds named exports without overwriting files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, 'src', 'components', 'ui');

console.log('🔧 Adding Named Exports to UI Components...\n');

// Components that need named exports added
const componentsToFix = [
  'Button', 'Input', 'Label', 'Card', 'Alert', 'Dialog', 'Select',
  'Checkbox', 'RadioGroup', 'Switch', 'Textarea', 'Tabs', 'Table',
  'DropdownMenu', 'ContextMenu', 'NavigationMenu', 'Popover',
  'HoverCard', 'Slider', 'ScrollArea', 'Skeleton', 'LoadingSpinner',
  'Calendar', 'DatePicker', 'AlertDialog', 'ToggleGroup'
];

let fixedCount = 0;
let skippedCount = 0;

componentsToFix.forEach(componentName => {
  const filePath = path.join(UI_DIR, `${componentName}.tsx`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped: ${componentName}.tsx (file not found)`);
    skippedCount++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has named export
  const hasNamedExport = content.match(new RegExp(`export\\s*{[^}]*${componentName}[^}]*}`));
  
  if (hasNamedExport) {
    console.log(`✓ ${componentName}.tsx already has named export`);
    return;
  }

  // Find the default export line
  const defaultExportMatch = content.match(/export\s+default\s+(\w+);?\s*$/m);
  
  if (!defaultExportMatch) {
    console.log(`⚠️  Skipped: ${componentName}.tsx (no default export found)`);
    skippedCount++;
    return;
  }

  const exportedName = defaultExportMatch[1];
  const defaultExportLine = defaultExportMatch[0];
  
  // Add named export before default export
  const newContent = content.replace(
    defaultExportLine,
    `export { ${exportedName} };\n${defaultExportLine}`
  );
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Fixed: ${componentName}.tsx (added export { ${exportedName} })`);
  fixedCount++;
});

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Fixed: ${fixedCount}`);
console.log(`⚠️  Skipped: ${skippedCount}`);
console.log('═'.repeat(60));
console.log('\n✨ Named exports added successfully!\n');
