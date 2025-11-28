import type { Meta, StoryObj } from '@storybook/react';
import { ToastContainer } from './ToastContainer';

// Mock the useToast hook
const mockUseToast = () => ({
  toasts: [
    {
      id: '1',
      title: 'Success',
      description: 'Your changes have been saved.',
      variant: 'default',
    },
    {
      id: '2',
      title: 'Error',
      description: 'Something went wrong.',
      variant: 'destructive',
    },
  ],
  dismiss: () => {},
});

const meta: Meta<typeof ToastContainer> = {
  title: 'Components/ToastContainer',
  component: ToastContainer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Mock the hook
      (global as any).useToast = mockUseToast;
      return (
        <div className="fixed bottom-4 right-4">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMultipleToasts: Story = {
  decorators: [
    (Story) => {
      const mockUseToastMultiple = () => ({
        toasts: [
          {
            id: '1',
            title: 'Success',
            description: 'File uploaded successfully.',
            variant: 'default',
          },
          {
            id: '2',
            title: 'Warning',
            description: 'Low disk space.',
            variant: 'destructive',
          },
          {
            id: '3',
            title: 'Info',
            description: 'New updates available.',
            variant: 'default',
          },
        ],
        dismiss: () => {},
      });
      
      (global as any).useToast = mockUseToastMultiple;
      return (
        <div className="fixed bottom-4 right-4">
          <Story />
        </div>
      );
    },
  ],
};
