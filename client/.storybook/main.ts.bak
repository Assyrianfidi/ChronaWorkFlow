import type { StorybookConfig } from '@storybook/react-vite';

const removeUseClientPlugin = (): import('vite').Plugin => ({
  name: 'remove-use-client-directive',
  transform(code, id) {
    if (!code) return null;
    if (!/node_modules|src/.test(id)) return null;
    if (!code.includes(`'use client'`) && !code.includes(`"use client"`)) {
      return null;
    }
    const updated = code.replace(/^[\s]*(?:'use client'|"use client")[\s]*;?/m, '');
    return { code: updated, map: null };
  },
});

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-controls',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(removeUseClientPlugin());
    return config;
  },
};

export default config;
