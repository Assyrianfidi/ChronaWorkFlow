import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const storybookAddonVitestModule: string = '@storybook/addon-vitest/vitest-plugin';
const vitestBrowserPlaywrightModule: string = '@vitest/browser-playwright';

let storybookTest: undefined | ((options: any) => any);
try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ({ storybookTest } = require(storybookAddonVitestModule));
} catch {
  storybookTest = undefined;
}

let playwright: undefined | ((options: any) => any);
try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ({ playwright } = require(vitestBrowserPlaywrightModule));
} catch {
  playwright = undefined;
}

const hasStorybookConfig = fs.existsSync(path.join(dirname, '.storybook'));

const storybookProject: any[] | undefined = storybookTest && playwright && hasStorybookConfig ? [{
  extends: true as const,
  plugins: [
  // The plugin will run tests for the stories defined in your Storybook config
  // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
  storybookTest({
    configDir: path.join(dirname, '.storybook')
  })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{
        browser: 'chromium'
      }]
    },
    setupFiles: ['frontend/.storybook/vitest.setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './client/src'),
      '@shared': path.resolve(dirname, './shared'),
      '@backend': path.resolve(dirname, './backend/src'),
      'next-auth/react': path.resolve(dirname, './client/src/test-stubs/next-auth-react.ts'),
      'next/navigation': path.resolve(dirname, './client/src/test-stubs/next-navigation.ts')
    }
  }
}] : undefined;

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.storybook/**',
      '**/.trunk/**',
      '**/cypress/**',
      '**/e2e/**'
    ],
    testTimeout: 30000,
    projects: [
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, './client/src'),
            '@shared': path.resolve(dirname, './shared'),
            '@backend': path.resolve(dirname, './backend/src'),
            'next-auth/react': path.resolve(dirname, './client/src/test-stubs/next-auth-react.ts'),
            'next/navigation': path.resolve(dirname, './client/src/test-stubs/next-navigation.ts')
          }
        },
        test: {
          name: 'client',
          globals: true,
          pool: 'threads',
          css: false,
          environment: 'jsdom',
          setupFiles: ['./client/vitest.setup.ts'],
          include: [
            'client/**/*.test.ts',
            'client/**/*.test.tsx',
            'src/**/*.test.ts',
            'src/**/*.test.tsx'
          ]
        }
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, './client/src'),
            '@shared': path.resolve(dirname, './shared'),
            '@backend': path.resolve(dirname, './backend/src')
          }
        },
        test: {
          name: 'server',
          globals: true,
          pool: 'threads',
          environment: 'node',
          setupFiles: ['./server/test/setup.ts'],
          include: [
            'server/**/*.test.ts',
            'server/**/*.test.tsx',
            'backend/**/*.test.ts',
            'backend/**/*.test.tsx'
          ]
        }
      },
      ...(storybookProject ?? [])
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './client/src'),
      '@shared': path.resolve(dirname, './shared'),
      '@backend': path.resolve(dirname, './backend/src')
    }
  },
  esbuild: {
    target: 'es2022' // Allow top-level await used in some test files
  }
});