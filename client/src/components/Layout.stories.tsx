import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './Layout';

const meta: Meta<typeof Layout> = {
  title: 'Layout/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard Content</h1>
        <p className="text-gray-600">This is the main content area of the application.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Card 1</h3>
            <p className="text-sm text-gray-600">Sample content for card 1</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Card 2</h3>
            <p className="text-sm text-gray-600">Sample content for card 2</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Card 3</h3>
            <p className="text-sm text-gray-600">Sample content for card 3</p>
          </div>
        </div>
      </div>
    ),
  },
};

export const WithSidebarOpen: Story = {
  args: {
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Settings Page</h1>
        <p className="text-gray-600">Application settings and preferences</p>
      </div>
    ),
  },
};
