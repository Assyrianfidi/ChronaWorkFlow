import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsconfigPath = path.join(__dirname, 'tsconfig.json');

const tsconfigContent = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": "./",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", ".storybook"]
}`;

fs.writeFileSync(tsconfigPath, tsconfigContent, 'utf8');

console.log('tsconfig.json has been updated successfully!');
