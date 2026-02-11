import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

const replacements = {
  'from "@/components/ui/button"': 'from "@/components/ui/Button"',
  "from '@/components/ui/button'": "from '@/components/ui/Button'",
  'from "@/components/ui/badge"': 'from "@/components/ui/Badge"',
  "from '@/components/ui/badge'": "from '@/components/ui/Badge'",
};

let filesFixed = 0;
let totalReplacements = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  Object.entries(replacements).forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      modified = true;
      totalReplacements++;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(__dirname, filePath)}`);
    filesFixed++;
  }
});

console.log(`\n✅ Fixed ${filesFixed} files with ${totalReplacements} replacements`);
