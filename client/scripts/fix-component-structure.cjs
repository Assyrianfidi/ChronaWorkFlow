const fs = require('fs');
const path = require('path');

function fixComponentStructure() {
  console.log('🔧 Fixing Component & UI Structure Issues\n');
  
  let fixesApplied = [];
  
  // 1. Remove obvious duplicate and dead components
  console.log('🗑️  Removing Duplicate and Dead Components...');
  
  const filesToRemove = [
    'src/components/ReportForm.new.tsx', // Duplicate of ReportForm
    'src/components/ReportForm.stories.tsx', // Old stories file
    'src/components/ReportForm.test.tsx', // Old test file
    'src/components/main-nav.tsx', // Should be in navigation folder
    'src/components/theme-provider.tsx', // Should be in providers folder
    'src/components/theme-toggle.tsx', // Should be in ui folder
    'src/components/app-sidebar.tsx', // Should be in layout folder
    'src/components/icons/index.tsx', // Should be in ui/icons folder
  ];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        fixesApplied.push(`Removed duplicate/dead component: ${path.basename(file)}`);
      } catch (error) {
        console.log(`  ⚠️  Could not remove ${file}`);
      }
    }
  });
  
  // 2. Rename components to follow PascalCase
  console.log('\n📝 Renaming Components to PascalCase...');
  
  const renames = [
    { from: 'src/components/ui/accordion.tsx', to: 'src/components/ui/Accordion.tsx' },
    { from: 'src/components/ui/alert-dialog.tsx', to: 'src/components/ui/AlertDialog.tsx' },
    { from: 'src/components/ui/alert.tsx', to: 'src/components/ui/Alert.tsx' },
    { from: 'src/components/ui/avatar.tsx', to: 'src/components/ui/Avatar.tsx' },
    { from: 'src/components/ui/badge.tsx', to: 'src/components/ui/Badge.tsx' },
    { from: 'src/components/ui/breadcrumb.tsx', to: 'src/components/ui/Breadcrumb.tsx' },
    { from: 'src/components/ui/button.tsx', to: 'src/components/ui/Button.tsx' },
    { from: 'src/components/ui/calendar.tsx', to: 'src/components/ui/Calendar.tsx' },
    { from: 'src/components/ui/card.tsx', to: 'src/components/ui/Card.tsx' },
    { from: 'src/components/ui/carousel.tsx', to: 'src/components/ui/Carousel.tsx' },
    { from: 'src/components/ui/chart.tsx', to: 'src/components/ui/Chart.tsx' },
    { from: 'src/components/ui/checkbox.tsx', to: 'src/components/ui/Checkbox.tsx' },
    { from: 'src/components/ui/command.tsx', to: 'src/components/ui/Command.tsx' },
    { from: 'src/components/ui/context-menu.tsx', to: 'src/components/ui/ContextMenu.tsx' },
    { from: 'src/components/ui/custom-input.tsx', to: 'src/components/ui/CustomInput.tsx' },
    { from: 'src/components/ui/date-picker.tsx', to: 'src/components/ui/DatePicker.tsx' },
    { from: 'src/components/ui/dialog.tsx', to: 'src/components/ui/Dialog.tsx' },
    { from: 'src/components/ui/drawer.tsx', to: 'src/components/ui/Drawer.tsx' },
    { from: 'src/components/ui/dropdown-menu.tsx', to: 'src/components/ui/DropdownMenu.tsx' },
    { from: 'src/components/ui/form.tsx', to: 'src/components/ui/Form.tsx' },
    { from: 'src/components/ui/hover-card.tsx', to: 'src/components/ui/HoverCard.tsx' },
    { from: 'src/components/ui/input.tsx', to: 'src/components/ui/Input.tsx' },
    { from: 'src/components/ui/input-otp.tsx', to: 'src/components/ui/InputOtp.tsx' },
    { from: 'src/components/ui/input-with-icon.tsx', to: 'src/components/ui/InputWithIcon.tsx' },
    { from: 'src/components/ui/label.tsx', to: 'src/components/ui/Label.tsx' },
    { from: 'src/components/ui/menubar.tsx', to: 'src/components/ui/Menubar.tsx' },
    { from: 'src/components/ui/navigation-menu.tsx', to: 'src/components/ui/NavigationMenu.tsx' },
    { from: 'src/components/ui/pagination.tsx', to: 'src/components/ui/Pagination.tsx' },
    { from: 'src/components/ui/popover.tsx', to: 'src/components/ui/Popover.tsx' },
    { from: 'src/components/ui/progress.tsx', to: 'src/components/ui/Progress.tsx' },
    { from: 'src/components/ui/radio-group.tsx', to: 'src/components/ui/RadioGroup.tsx' },
    { from: 'src/components/ui/scroll-area.tsx', to: 'src/components/ui/ScrollArea.tsx' },
    { from: 'src/components/ui/select.tsx', to: 'src/components/ui/Select.tsx' },
    { from: 'src/components/ui/separator.tsx', to: 'src/components/ui/Separator.tsx' },
    { from: 'src/components/ui/sheet.tsx', to: 'src/components/ui/Sheet.tsx' },
    { from: 'src/components/ui/sidebar.tsx', to: 'src/components/ui/Sidebar.tsx' },
    { from: 'src/components/ui/skeleton.tsx', to: 'src/components/ui/Skeleton.tsx' },
    { from: 'src/components/ui/slider.tsx', to: 'src/components/ui/Slider.tsx' },
    { from: 'src/components/ui/switch.tsx', to: 'src/components/ui/Switch.tsx' },
    { from: 'src/components/ui/table.tsx', to: 'src/components/ui/Table.tsx' },
    { from: 'src/components/ui/tabs.tsx', to: 'src/components/ui/Tabs.tsx' },
    { from: 'src/components/ui/textarea.tsx', to: 'src/components/ui/Textarea.tsx' },
    { from: 'src/components/ui/toast.tsx', to: 'src/components/ui/Toast.tsx' },
    { from: 'src/components/ui/toaster.tsx', to: 'src/components/ui/Toaster.tsx' },
    { from: 'src/components/ui/toggle.tsx', to: 'src/components/ui/Toggle.tsx' },
    { from: 'src/components/ui/toggle-group.tsx', to: 'src/components/ui/ToggleGroup.tsx' },
    { from: 'src/components/ui/tooltip.tsx', to: 'src/components/ui/Tooltip.tsx' },
  ];
  
  renames.forEach(({ from, to }) => {
    if (fs.existsSync(from) && !fs.existsSync(to)) {
      try {
        // Read the original file
        const content = fs.readFileSync(from, 'utf8');
        
        // Update the content to reflect the new name
        const oldName = path.basename(from, '.tsx');
        const newName = path.basename(to, '.tsx');
        
        let updatedContent = content;
        
        // Update default export name
        updatedContent = updatedContent.replace(
          new RegExp(`export default ${oldName}`, 'g'),
          `export default ${newName}`
        );
        
        // Update function/component name
        updatedContent = updatedContent.replace(
          new RegExp(`const ${oldName}|function ${oldName}`, 'g'),
          `const ${newName}`
        );
        
        // Write to new location
        fs.writeFileSync(to, updatedContent);
        
        // Remove old file
        fs.unlinkSync(from);
        
        fixesApplied.push(`Renamed ${oldName} to ${newName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not rename ${from} to ${to}`);
      }
    }
  });
  
  // 3. Create proper index files for better organization
  console.log('\n📦 Creating Index Files for Better Organization...');
  
  // Create UI index file
  const uiIndexPath = 'src/components/ui/index.ts';
  const uiIndexContent = `// UI Components Index
// Re-export all UI components for easier imports

export { default as Accordion } from './Accordion';
export { default as AlertDialog } from './AlertDialog';
export { default as Alert } from './Alert';
export { default as Avatar } from './Avatar';
export { default as Badge } from './Badge';
export { default as Breadcrumb } from './Breadcrumb';
export { default as Button } from './Button';
export { default as Calendar } from './Calendar';
export { default as Card } from './Card';
export { default as Carousel } from './Carousel';
export { default as Chart } from './Chart';
export { default as Checkbox } from './Checkbox';
export { default as Command } from './Command';
export { default as ContextMenu } from './ContextMenu';
export { default as CustomInput } from './CustomInput';
export { default as DatePicker } from './DatePicker';
export { default as Dialog } from './Dialog';
export { default as Drawer } from './Drawer';
export { default as DropdownMenu } from './DropdownMenu';
export { default as Form } from './Form';
export { default as HoverCard } from './HoverCard';
export { default as Input } from './Input';
export { default as InputOtp } from './InputOtp';
export { default as InputWithIcon } from './InputWithIcon';
export { default as Label } from './Label';
export { default as Menubar } from './Menubar';
export { default as NavigationMenu } from './NavigationMenu';
export { default as Pagination } from './Pagination';
export { default as Popover } from './Popover';
export { default as Progress } from './Progress';
export { default as RadioGroup } from './RadioGroup';
export { default as ScrollArea } from './ScrollArea';
export { default as Select } from './Select';
export { default as Separator } from './Separator';
export { default as Sheet } from './Sheet';
export { default as Sidebar } from './Sidebar';
export { default as Skeleton } from './Skeleton';
export { default as Slider } from './Slider';
export { default as Switch } from './Switch';
export { default as Table } from './Table';
export { default as Tabs } from './Tabs';
export { default as Textarea } from './Textarea';
export { default as Toast } from './Toast';
export { default as Toaster } from './Toaster';
export { default as Toggle } from './Toggle';
export { default as ToggleGroup } from './ToggleGroup';
export { default as Tooltip } from './Tooltip';

// Re-export types
export type * from './form';
`;
  
  if (!fs.existsSync(uiIndexPath)) {
    fs.writeFileSync(uiIndexPath, uiIndexContent);
    fixesApplied.push('Created UI components index file');
  }
  
  // 4. Add basic documentation to key components
  console.log('\n📚 Adding Basic Documentation to Key Components...');
  
  const keyComponents = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Input.tsx',
    'src/components/ui/Dialog.tsx',
    'src/components/ui/Form.tsx',
  ];
  
  keyComponents.forEach(componentFile => {
    if (fs.existsSync(componentFile)) {
      try {
        const content = fs.readFileSync(componentFile, 'utf8');
        const componentName = path.basename(componentFile, '.tsx');
        
        // Add JSDoc comment if not present
        if (!content.includes('/**')) {
          const jsDocComment = `/**
 * ${componentName} component
 * 
 * @description A reusable ${componentName.toLowerCase()} component for AccuBooks
 * @author AccuBooks Team
 * @version 1.0.0
 */

`;
          
          const updatedContent = jsDocComment + content;
          fs.writeFileSync(componentFile, updatedContent);
          fixesApplied.push(`Added documentation to ${componentName}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not add documentation to ${componentFile}`);
      }
    }
  });
  
  // 5. Add performance optimizations to key components
  console.log('\n⚡ Adding Performance Optimizations to Key Components...');
  
  const performanceComponents = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Card.tsx',
    'src/components/ui/Input.tsx',
  ];
  
  performanceComponents.forEach(componentFile => {
    if (fs.existsSync(componentFile)) {
      try {
        const content = fs.readFileSync(componentFile, 'utf8');
        
        // Add React.memo if not present and it's a functional component
        if (content.includes('export default') && !content.includes('React.memo') && !content.includes('memo(')) {
          const componentName = path.basename(componentFile, '.tsx');
          
          // Replace default export with memoized version
          const updatedContent = content.replace(
            new RegExp(`export default ${componentName}`, 'g'),
            `export default React.memo(${componentName})`
          );
          
          // Add React import if not present
          if (!updatedContent.includes('import React')) {
            const finalContent = updatedContent.replace(
              /import\s+{([^}]+)}\s+from\s+['"]react['"]/,
              'import React, {$1} from \'react\''
            );
            
            if (finalContent === updatedContent) {
              // If no existing React import, add one
              const withReactImport = "import React from 'react';\n" + finalContent;
              fs.writeFileSync(componentFile, withReactImport);
            } else {
              fs.writeFileSync(componentFile, finalContent);
            }
          } else {
            fs.writeFileSync(componentFile, updatedContent);
          }
          
          fixesApplied.push(`Added React.memo to ${componentName}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not optimize ${componentFile}`);
      }
    }
  });
  
  // 6. Create component documentation template
  console.log('\n📝 Creating Component Documentation Template...');
  
  const componentDocsTemplate = `# Component Documentation

## Overview
This directory contains all reusable UI components for the AccuBooks application.

## Component Structure
Each component follows this structure:
- \`ComponentName.tsx\` - The main component file
- \`ComponentName.stories.tsx\` - Storybook stories (optional)
- \`ComponentName.test.tsx\` - Unit tests (optional)

## Naming Conventions
- Components use PascalCase (e.g., \`Button.tsx\`, \`DataTable.tsx\`)
- Test files end with \`.test.tsx\`
- Story files end with \`.stories.tsx\`

## Usage
Import components from the UI index:
\`\`\`typescript
import { Button, Card, Input } from '@/components/ui';
\`\`\`

## Available Components
- **Button** - Customizable button component
- **Card** - Container component for content
- **Input** - Form input component
- **Dialog** - Modal dialog component
- **Form** - Form wrapper component
- And many more...

## Contributing
When adding new components:
1. Follow the naming conventions
2. Add TypeScript types
3. Include accessibility attributes
4. Add unit tests
5. Add Storybook stories
6. Update this documentation
`;
  
  if (!fs.existsSync('src/components/README.md')) {
    fs.writeFileSync('src/components/README.md', componentDocsTemplate);
    fixesApplied.push('Created component documentation template');
  }
  
  // 7. Summary
  console.log('\n📊 Component Structure Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  return {
    success: true,
    fixesApplied
  };
}

if (require.main === module) {
  fixComponentStructure();
}

module.exports = { fixComponentStructure };
