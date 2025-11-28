import type { Preview } from '@storybook/react';
import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { I18nProvider } from '../src/components/I18nProvider';
import { ToastContainer } from '../src/components/ToastContainer';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['UI', 'Accounts', 'Accessibility', 'Forms', 'Reports'],
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <Story />
            <ToastContainer />
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    ),
  ],
};

export default preview;
