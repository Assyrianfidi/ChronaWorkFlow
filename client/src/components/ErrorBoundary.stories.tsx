import type { Meta, StoryObj } from '@storybook/react';
import ErrorBoundary from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ThrowingComponent = () => {
  throw new Error('Test error for ErrorBoundary');
};

export const Default: Story = {
  args: {
    children: <div>Normal content that renders fine</div>,
  },
};

export const WithError: Story = {
  args: {
    children: <ThrowingComponent />,
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <ThrowingComponent />,
    fallback: (
      <div style={{ padding: '20px', border: '2px solid red', borderRadius: '8px' }}>
        <h2>Custom Error Fallback</h2>
        <p>Something went wrong with this component.</p>
      </div>
    ),
  },
};
