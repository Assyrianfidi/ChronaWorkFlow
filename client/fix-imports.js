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
  'from "@/components/ui/dialog"': 'from "@/components/ui/Dialog"',
  "from '@/components/ui/dialog'": "from '@/components/ui/Dialog'",
  'from "@/components/ui/input"': 'from "@/components/ui/Input"',
  "from '@/components/ui/input'": "from '@/components/ui/Input'",
  'from "@/components/ui/label"': 'from "@/components/ui/Label"',
  "from '@/components/ui/label'": "from '@/components/ui/Label'",
  'from "@/components/ui/card"': 'from "@/components/ui/Card"',
  "from '@/components/ui/card'": "from '@/components/ui/Card'",
  'from "@/components/ui/alert"': 'from "@/components/ui/Alert"',
  "from '@/components/ui/alert'": "from '@/components/ui/Alert'",
  'from "@/components/ui/select"': 'from "@/components/ui/Select"',
  "from '@/components/ui/select'": "from '@/components/ui/Select'",
  'from "@/components/ui/checkbox"': 'from "@/components/ui/Checkbox"',
  "from '@/components/ui/checkbox'": "from '@/components/ui/Checkbox'",
  'from "@/components/ui/switch"': 'from "@/components/ui/Switch"',
  "from '@/components/ui/switch'": "from '@/components/ui/Switch'",
  'from "@/components/ui/textarea"': 'from "@/components/ui/Textarea"',
  "from '@/components/ui/textarea'": "from '@/components/ui/Textarea'",
  'from "@/components/ui/tabs"': 'from "@/components/ui/Tabs"',
  "from '@/components/ui/tabs'": "from '@/components/ui/Tabs'",
  'from "@/components/ui/table"': 'from "@/components/ui/Table"',
  "from '@/components/ui/table'": "from '@/components/ui/Table'",
  'from "@/components/ui/popover"': 'from "@/components/ui/Popover"',
  "from '@/components/ui/popover'": "from '@/components/ui/Popover'",
  'from "@/components/ui/slider"': 'from "@/components/ui/Slider"',
  "from '@/components/ui/slider'": "from '@/components/ui/Slider'",
  'from "@/components/ui/skeleton"': 'from "@/components/ui/Skeleton"',
  "from '@/components/ui/skeleton'": "from '@/components/ui/Skeleton'",
  'from "@/components/ui/calendar"': 'from "@/components/ui/Calendar"',
  "from '@/components/ui/calendar'": "from '@/components/ui/Calendar'",
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
