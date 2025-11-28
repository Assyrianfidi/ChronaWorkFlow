// fix-tsconfig.js
const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(__dirname, 'tsconfig.json');

const tsconfigContent = {
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "strict": true,
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "moduleResolution": "Node",
    "target": "ES2021",
    "lib": ["DOM", "DOM.Iterable", "ES2021"],
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node"]
  },
  "include": ["src", ".storybook"],
  "exclude": ["node_modules", "build", "dist"]
};

// Write the JSON file
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2), 'utf-8');
console.log('✅ tsconfig.json fixed successfully!');
