import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { Button } from './ui/button';

const ThemeConsumer = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div className={`p-6 rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Theme Demo</h3>
      <p className="mb-4">Current theme: {theme}</p>
      <p className="mb-4">Resolved theme: {resolvedTheme}</p>
      <div className="flex gap-2">
        <Button onClick={() => setTheme('light')} size="sm">Light</Button>
        <Button onClick={() => setTheme('dark')} size="sm">Dark</Button>
        <Button onClick={() => setTheme('system')} size="sm">System</Button>
      </div>
    </div>
  );
};

const meta: Meta<typeof ThemeProvider> = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Child components to receive theme context',
    },
    defaultTheme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Default theme',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <ThemeConsumer />,
    defaultTheme: 'system',
  },
};

export const LightTheme: Story = {
  args: {
    children: <ThemeConsumer />,
    defaultTheme: 'light',
  },
};

export const DarkTheme: Story = {
  args: {
    children: <ThemeConsumer />,
    defaultTheme: 'dark',
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Custom Themed Content</h2>
        <p className="mb-4">This content adapts to the theme</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded">Card 1</div>
          <div className="p-4 border rounded">Card 2</div>
        </div>
      </div>
    ),
    defaultTheme: 'system',
  },
};
