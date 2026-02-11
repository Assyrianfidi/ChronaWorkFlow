#!/usr/bin/env node

/**
 * Comprehensive UI Component Export Fixer
 * Automatically fixes named exports and case-sensitivity issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, 'src', 'components', 'ui');

console.log('🔧 Starting UI Component Export Fixer...\n');

// List of components that need lowercase re-export files
const componentsNeedingLowercaseExports = [
  { pascal: 'Button', kebab: 'button' },
  { pascal: 'Input', kebab: 'input' },
  { pascal: 'Label', kebab: 'label' },
  { pascal: 'Card', kebab: 'card' },
  { pascal: 'Badge', kebab: 'badge' },
  { pascal: 'Alert', kebab: 'alert' },
  { pascal: 'Dialog', kebab: 'dialog' },
  { pascal: 'Select', kebab: 'select' },
  { pascal: 'Checkbox', kebab: 'checkbox' },
  { pascal: 'RadioGroup', kebab: 'radio-group' },
  { pascal: 'Switch', kebab: 'switch' },
  { pascal: 'Textarea', kebab: 'textarea' },
  { pascal: 'Tabs', kebab: 'tabs' },
  { pascal: 'Table', kebab: 'table' },
  { pascal: 'DropdownMenu', kebab: 'dropdown-menu' },
  { pascal: 'ContextMenu', kebab: 'context-menu' },
  { pascal: 'NavigationMenu', kebab: 'navigation-menu' },
  { pascal: 'Popover', kebab: 'popover' },
  { pascal: 'HoverCard', kebab: 'hover-card' },
  { pascal: 'Slider', kebab: 'slider' },
  { pascal: 'ScrollArea', kebab: 'scroll-area' },
  { pascal: 'Skeleton', kebab: 'skeleton' },
  { pascal: 'LoadingSpinner', kebab: 'loading-spinner' },
  { pascal: 'Calendar', kebab: 'calendar' },
  { pascal: 'DatePicker', kebab: 'date-picker' },
  { pascal: 'AlertDialog', kebab: 'alert-dialog' },
  { pascal: 'ToggleGroup', kebab: 'toggle-group' },
];

let fixedCount = 0;
let createdCount = 0;
let skippedCount = 0;

// Step 1: Add named exports to PascalCase files
console.log('Step 1: Adding named exports to PascalCase component files...\n');

componentsNeedingLowercaseExports.forEach(({ pascal, kebab }) => {
  const pascalFile = path.join(UI_DIR, `${pascal}.tsx`);
  
  if (!fs.existsSync(pascalFile)) {
    console.log(`⚠️  Skipped: ${pascal}.tsx (file not found)`);
    skippedCount++;
    return;
  }

  let content = fs.readFileSync(pascalFile, 'utf8');
  
  // Check if file already has named export
  const hasNamedExport = content.includes(`export { ${pascal} }`);
  const hasDefaultExport = content.includes('export default');
  
  if (hasNamedExport) {
    console.log(`✓ ${pascal}.tsx already has named export`);
    return;
  }

  // Add named export before default export
  if (hasDefaultExport) {
    content = content.replace(
      /export default (\w+);/,
      `export { $1 };\nexport default $1;`
    );
    
    fs.writeFileSync(pascalFile, content, 'utf8');
    console.log(`✅ Fixed: ${pascal}.tsx (added named export)`);
    fixedCount++;
  } else {
    console.log(`⚠️  Skipped: ${pascal}.tsx (no default export found)`);
    skippedCount++;
  }
});

console.log('\n' + '─'.repeat(60) + '\n');

// Step 2: Create lowercase re-export files
console.log('Step 2: Creating lowercase re-export files...\n');

componentsNeedingLowercaseExports.forEach(({ pascal, kebab }) => {
  const kebabFile = path.join(UI_DIR, `${kebab}.tsx`);
  const pascalFile = path.join(UI_DIR, `${pascal}.tsx`);
  
  // Skip if PascalCase file doesn't exist
  if (!fs.existsSync(pascalFile)) {
    console.log(`⚠️  Skipped: ${kebab}.tsx (source ${pascal}.tsx not found)`);
    skippedCount++;
    return;
  }

  // Check if lowercase file already exists
  if (fs.existsSync(kebabFile)) {
    const content = fs.readFileSync(kebabFile, 'utf8');
    // Check if it's already a re-export
    if (content.includes(`from "./${pascal}"`)) {
      console.log(`✓ ${kebab}.tsx already exists and re-exports ${pascal}`);
      return;
    }
  }

  // Create re-export file
  const reExportContent = `export * from "./${pascal}";\n`;
  fs.writeFileSync(kebabFile, reExportContent, 'utf8');
  console.log(`✅ Created: ${kebab}.tsx → re-exports ${pascal}.tsx`);
  createdCount++;
});

console.log('\n' + '─'.repeat(60) + '\n');

// Step 3: Create missing component files that are commonly imported
console.log('Step 3: Creating missing commonly-imported components...\n');

const missingComponents = [
  {
    name: 'separator',
    content: `import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
export default Separator;
`
  },
  {
    name: 'tooltip',
    content: `import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
`
  }
];

missingComponents.forEach(({ name, content }) => {
  const filePath = path.join(UI_DIR, `${name}.tsx`);
  
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${name}.tsx already exists`);
    return;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${name}.tsx`);
  createdCount++;
});

console.log('\n' + '═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Fixed exports: ${fixedCount}`);
console.log(`✅ Created files: ${createdCount}`);
console.log(`⚠️  Skipped: ${skippedCount}`);
console.log('═'.repeat(60));
console.log('\n✨ UI Component Export Fixer completed!\n');
console.log('Next step: Run `npm run build` to test the build\n');
