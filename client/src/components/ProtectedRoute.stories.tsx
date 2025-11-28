import type { Meta, StoryObj } from '@storybook/react';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the auth context
const mockUseAuth = (isAuthenticated: boolean, isLoading: boolean = false) => ({
  state: {
    user: isAuthenticated ? { id: '1', name: 'Test User' } : null,
    isLoading,
    isAuthenticated,
  },
});

const meta: Meta<typeof ProtectedRoute> = {
  title: 'Components/ProtectedRoute',
  component: ProtectedRoute,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Mock the useAuth hook based on the story
      const { isAuthenticated, isLoading } = context.args;
      
      // This is a simplified mock - in a real setup you'd use a proper mock provider
      React.useEffect(() => {
        (global as any).mockUseAuth = () => mockUseAuth(isAuthenticated, isLoading);
      }, [isAuthenticated, isLoading]);
      
      return <Story />;
    },
  ],
  argTypes: {
    isAuthenticated: {
      control: 'boolean',
      description: 'Whether user is authenticated',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether auth is loading',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
    isLoading: false,
    children: <div className="p-4">Protected Content - You are authenticated!</div>,
  },
};

export const Unauthenticated: Story = {
  args: {
    isAuthenticated: false,
    isLoading: false,
    children: <div className="p-4">Protected Content - You should not see this</div>,
  },
};

export const Loading: Story = {
  args: {
    isAuthenticated: false,
    isLoading: true,
    children: <div className="p-4">Protected Content - Loading state</div>,
  },
};
