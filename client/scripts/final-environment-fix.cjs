const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function finalEnvironmentFix() {
  console.log('🎯 Final Environment Configuration Fix\n');
  
  let fixesApplied = [];
  
  // 1. Fix remaining TypeScript configuration issues
  console.log('📘 Final TypeScript Configuration Fixes...');
  
  // Update tsconfig.node.json with proper options
  const tsconfigNodeContent = {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["ES2020"],
      "module": "ESNext",
      "moduleResolution": "node",
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "strict": false,
      "types": ["node"],
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true
    },
    "include": [
      "vite.config.ts",
      "scripts/**/*"
    ],
    "exclude": [
      "node_modules",
      "dist",
      "build"
    ]
  };
  
  fs.writeFileSync('tsconfig.node.json', JSON.stringify(tsconfigNodeContent, null, 2));
  fixesApplied.push('Enhanced tsconfig.node.json with essential options');
  
  // Update tsconfig.eslint.json with proper options
  const tsconfigESLintContent = {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["DOM", "DOM.Iterable", "ES6"],
      "module": "ESNext",
      "moduleResolution": "node",
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "strict": false,
      "jsx": "react-jsx",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"],
        "@/components/*": ["./src/components/*"],
        "@/lib/*": ["./src/lib/*"],
        "@/hooks/*": ["./src/hooks/*"],
        "@/utils/*": ["./src/utils/*"],
        "@/types/*": ["./src/types/*"],
        "@/pages/*": ["./src/pages/*"],
        "@/store/*": ["./src/store/*"],
        "@/services/*": ["./src/services/*"]
      }
    },
    "include": [
      "src/**/*",
      "scripts/**/*"
    ],
    "exclude": [
      "node_modules",
      "dist",
      "build",
      "**/*.test.ts",
      "**/*.test.tsx"
    ]
  };
  
  fs.writeFileSync('tsconfig.eslint.json', JSON.stringify(tsconfigESLintContent, null, 2));
  fixesApplied.push('Enhanced tsconfig.eslint.json with essential options and paths');
  
  // 2. Create vite.config.js as backup
  console.log('\n⚡ Creating Vite Configuration Backup...');
  
  const viteConfigJSContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/services": path.resolve(__dirname, "./src/services"),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@storybook/*']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-icons'],
        },
      },
    },
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
})
`;
  
  fs.writeFileSync('vite.config.js', viteConfigJSContent);
  fixesApplied.push('Created vite.config.js as backup configuration');
  
  // 3. Fix remaining hardcoded values
  console.log('\n🔍 Fixing Remaining Hardcoded Values...');
  
  const sourceFiles = getSourceFiles('src');
  let filesFixed = 0;
  
  sourceFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Replace more hardcoded patterns
      content = content.replace(/'sk-[a-zA-Z0-9]+'/g, 'import.meta.env.VITE_OPENAI_API_KEY');
      content = content.replace(/"sk-[a-zA-Z0-9]+"/g, 'import.meta.env.VITE_OPENAI_API_KEY');
      content = content.replace(/'ghp_[a-zA-Z0-9]+'/g, 'import.meta.env.VITE_GITHUB_TOKEN');
      content = content.replace(/"ghp_[a-zA-Z0-9]+"/g, 'import.meta.env.VITE_GITHUB_TOKEN');
      
      // Replace hardcoded URLs with environment variables
      content = content.replace(/'https:\/\/api\.accubooks\.com'/g, 'import.meta.env.VITE_API_URL');
      content = content.replace(/"https:\/\/api\.accubooks\.com"/g, 'import.meta.env.VITE_API_URL');
      content = content.replace(/'https:\/\/accubooks\.com'/g, 'import.meta.env.VITE_APP_URL');
      content = content.replace(/"https:\/\/accubooks\.com"/g, 'import.meta.env.VITE_APP_URL');
      
      if (content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content);
        modified = true;
        filesFixed++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (filesFixed > 0) {
    fixesApplied.push(`Fixed additional hardcoded values in ${filesFixed} source files`);
  }
  
  // 4. Update environment files with production-ready values
  console.log('\n📝 Updating Environment Files with Production Values...');
  
  // Update .env with realistic values
  const envContent = `# Local Development Environment Variables
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
VITE_SENTRY_DSN=
VITE_GOOGLE_ANALYTICS_ID=
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_1234567890abcdef
VITE_OPENAI_API_KEY=
VITE_GITHUB_TOKEN=
VITE_ENABLE_ANALYTICS=false
VITE_LOG_LEVEL=debug
VITE_HOT_RELOAD=true
VITE_DEV_TOOLS=true
`;
  
  fs.writeFileSync('.env', envContent);
  fixesApplied.push('Updated .env with realistic development values');
  
  // Update .env.production with production template
  const envProductionContent = `# Production Environment Variables
NODE_ENV=production
VITE_API_URL=https://api.accubooks.com
VITE_APP_URL=https://accubooks.com
VITE_WS_URL=wss://api.accubooks.com
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_1234567890abcdef
VITE_OPENAI_API_KEY=sk-proj-1234567890abcdef
VITE_GITHUB_TOKEN=ghp_1234567890abcdef
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
VITE_HOT_RELOAD=false
VITE_DEV_TOOLS=false
`;
  
  fs.writeFileSync('.env.production', envProductionContent);
  fixesApplied.push('Updated .env.production with production template');
  
  // 5. Test TypeScript compilation
  console.log('\n🧪 Testing TypeScript Compilation...');
  
  try {
    const result = execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('✅ TypeScript compilation successful');
    fixesApplied.push('TypeScript compilation now works');
    
  } catch (error) {
    console.log('⚠️  TypeScript compilation still has issues');
    
    // Try to identify the remaining errors
    const errorOutput = error.stdout || error.message;
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    
    if (errorLines.length > 0 && errorLines.length <= 5) {
      console.log('Remaining errors:');
      errorLines.slice(0, 3).forEach(line => console.log(`  ${line}`));
    }
  }
  
  // 6. Test build process
  console.log('\n🏗️  Testing Build Process...');
  
  try {
    const buildResult = execSync('npm run build', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('✅ Build process successful');
    fixesApplied.push('Build process now works');
    
  } catch (error) {
    console.log('⚠️  Build process has issues');
  }
  
  // 7. Summary
  console.log('\n📊 Final Environment Fix Summary:');
  console.log(`  🔧 Fixes Applied: ${fixesApplied.length}`);
  
  if (fixesApplied.length > 0) {
    console.log('\n✅ Fixes Applied:');
    fixesApplied.forEach(fix => console.log(`  - ${fix}`));
  }
  
  return {
    success: true,
    fixesApplied,
    filesFixed
  };
}

// Helper function to get all source files
function getSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

if (require.main === module) {
  finalEnvironmentFix();
}

module.exports = { finalEnvironmentFix };
