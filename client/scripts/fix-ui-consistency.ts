import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const CHANGES = {
  filesUpdated: 0,
  uiFixes: 0,
  accessibilityFixes: 0,
  consistencyFixes: 0,
};

// Common UI patterns to standardize
const UI_PATTERNS = [
  // Replace inline styles with Tailwind classes
  {
    pattern: /style={[{]\s*([^}]*?)(?:!important)?\s*[}]}/g,
    replacement: (match: string, styles: string) => {
      const styleMap: Record<string, string> = {
        'color:\s*[#0-9a-fA-F]{3,6}': 'text-*',
        'background(?:-color)?:\s*[#0-9a-fA-F]{3,6}': 'bg-*',
        'border(?:-color)?:\s*[#0-9a-fA-F]{3,6}': 'border-*',
        'border-radius:\s*[0-9]+(?:px|rem|em)': 'rounded-*',
        'padding(?:-[^:]+)?:\s*[0-9]+(?:px|rem|em)': 'p-*',
        'margin(?:-[^:]+)?:\s*[0-9]+(?:px|rem|em)': 'm-*',
        'width:\s*[0-9]+(?:px|rem|em|%)': 'w-*',
        'height:\s*[0-9]+(?:px|rem|em|%)': 'h-*',
        'font-size:\s*[0-9]+(?:px|rem|em)': 'text-*',
        'font-weight:\s*[0-9]+': 'font-*',
      };

      let tailwindClasses: string[] = [];
      const stylePairs = styles.split(';').map(s => s.trim()).filter(Boolean);

      for (const pair of stylePairs) {
        const [property, value] = pair.split(':').map(s => s.trim());
        if (!property || !value) continue;

        const matched = Object.entries(styleMap).find(([pattern]) => 
          new RegExp(pattern, 'i').test(`${property}:${value}`)
        );

        if (matched) {
          const [_, prefix] = matched;
          tailwindClasses.push(prefix.replace('*', value));
        }
      }

      return tailwindClasses.length > 0 
        ? `className="${tailwindClasses.join(' ')}"`
        : match;
    }
  },
  
  // Ensure consistent button variants
  {
    pattern: /<Button[^>]*variant=["'](?!outline|ghost|link|default|destructive|secondary|primary)[^"']*["'][^>]*>/g,
    replacement: (match: string) => {
      return match.replace(/variant=["'][^"']*["']/, 'variant="default"');
    }
  },
  
  // Ensure consistent spacing scale
  {
    pattern: /(?:m|p)([tblrxy])?-?([0-9]+)(?:px|rem|em)/g,
    replacement: (match: string) => {
      // Convert pixel values to Tailwind scale (1 = 0.25rem = 4px)
      const pixelMatch = match.match(/(\d+)px/);
      if (pixelMatch) {
        const px = parseInt(pixelMatch[1], 10);
        const rem = Math.round(px / 4);
        return match.replace(/\d+px/, rem > 0 ? rem.toString() : 'px');
      }
      return match;
    }
  },
  
  // Ensure consistent border radius
  {
    pattern: /border-radius:\s*([0-9.]+)(?:px|rem|em)/g,
    replacement: (match: string, value: string) => {
      const num = parseFloat(value);
      const rounded = Math.round(num / 4) * 4; // Round to nearest 4px
      return `rounded-${rounded / 4}`; // Convert to Tailwind scale (1 = 0.25rem = 4px)
    }
  },
  
  // Ensure consistent shadows
  {
    pattern: /box-shadow:[^;]+/g,
    replacement: () => 'shadow-md' // Default to medium shadow, adjust as needed
  },
  
  // Ensure consistent transitions
  {
    pattern: /transition(?:-property)?:[^;]+/g,
    replacement: () => 'transition-colors duration-200'
  },
  
  // Ensure consistent focus states
  {
    pattern: /:focus\s*{[^}]*outline:[^;]*;?[^}]*}/g,
    replacement: () => 'focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:outline-none'
  },
  
  // Ensure consistent hover states
  {
    pattern: /:hover\s*{[^}]*background(?:-color)?:[^;]*;?[^}]*}/g,
    replacement: (match: string) => {
      const colorMatch = match.match(/background(?:-color)?:\s*([^;]+);?/);
      if (colorMatch) {
        const color = colorMatch[1].trim();
        return `hover:bg-${color}`;
      }
      return 'hover:bg-opacity-90';
    }
  }
];

// Accessibility improvements
const ACCESSIBILITY_PATTERNS = [
  // Add missing alt text to images
  {
    pattern: /<img((?![^>]*alt=)[^>]*)>/g,
    replacement: (match: string, attrs: string) => {
      // Skip if already has alt or is decorative
      if (/alt=["'](?:|\s*)["']/.test(match)) return match;
      if (/role=["']presentation["']/.test(match)) return match;
      if (/aria-hidden=["']true["']/.test(match)) return match;
      
      // Try to extract meaningful alt text from nearby content
      let altText = 'Image';
      const srcMatch = match.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        const fileName = srcMatch[1].split('/').pop()?.split('.')[0] || '';
        altText = fileName.split(/[-_]/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
      
      return `<img${attrs} alt="${altText}" />`;
    }
  },
  
  // Ensure buttons have meaningful text
  {
    pattern: /<button[^>]*>\s*<[^>]+>\s*<\/button>/g,
    replacement: (match: string) => {
      // Skip if already has aria-label or title
      if (/aria-label=/.test(match) || /title=/.test(match)) return match;
      
      // Try to extract icon name
      let label = 'Button';
      const iconMatch = match.match(/<([A-Za-z][^\s>]*)/);
      if (iconMatch) {
        const iconName = iconMatch[1].replace(/Icon$/, '');
        label = `${iconName.charAt(0).toUpperCase() + iconName.slice(1)} button`;
      }
      
      return match.replace('>', ` aria-label="${label}">`);
    }
  },
  
  // Add missing form labels
  {
    pattern: /<input((?![^>]*(?:id=|aria-labelledby=|aria-label=))[^>]*)>/g,
    replacement: (match: string, attrs: string) => {
      // Skip if already has label
      if (/aria-label=/.test(match) || /aria-labelledby=/.test(match)) return match;
      
      // Generate an ID for the input
      const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get the input type for better label text
      const typeMatch = attrs.match(/type=["']([^"']+)["']/);
      const inputType = typeMatch ? typeMatch[1] : 'field';
      
      return `
        <label htmlFor="${inputId}" className="sr-only">
          ${inputType.charAt(0).toUpperCase() + inputType.slice(1)}
        </label>
        <input id="${inputId}"${attrs}>
      `;
    }
  }
];

async function processFile(filePath: string): Promise<void> {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Process UI patterns
    for (const { pattern, replacement } of UI_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match: string, ...args: any[]) => {
          const result = typeof replacement === 'function' 
            ? replacement(match, ...args) 
            : replacement;
          if (result !== match) {
            CHANGES.uiFixes++;
            modified = true;
          }
          return result;
        });
      }
    }

    // Process accessibility patterns
    for (const { pattern, replacement } of ACCESSIBILITY_PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match: string, ...args: any[]) => {
          const result = typeof replacement === 'function' 
            ? replacement(match, ...args) 
            : replacement;
          if (result !== match) {
            CHANGES.accessibilityFixes++;
            modified = true;
          }
          return result;
        });
      }
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
  console.log('🚀 Starting UI consistency and accessibility improvements...\n');
  
  const files = await walkDir(SRC_DIR);
  console.log(`🔍 Found ${files.length} files to process\n`);
  
  for (const file of files) {
    await processFile(file);
  }

  console.log('\n✨ UI Consistency Improvements Complete!');
  console.log(`- Updated ${CHANGES.filesUpdated} files`);
  console.log(`- Applied ${CHANGES.uiFixes} UI consistency fixes`);
  console.log(`- Applied ${CHANGES.accessibilityFixes} accessibility improvements`);
  console.log(`- Applied ${CHANGES.consistencyFixes} consistency improvements`);
  console.log('\n✅ Task 3 - UI Consistency Complete!');
}

main().catch(console.error);
