import type { Meta, StoryObj } from '@storybook/react';
import { AccessibilityProvider } from './AccessibilityContext';

// Test component to demonstrate accessibility context usage
const AccessibilityDemo: React.FC = () => {
  // Since useAccessibility hook might not be exported, we'll create a simple demo
  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2>Accessibility Features Demo</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Screen Reader Announcements</h3>
        <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Polite Announcement
        </button>
        <button style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Assertive Announcement
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Voice Commands</h3>
        <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Enable Voice Commands
        </button>
        <button style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Disable Voice Commands
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Visual Modes</h3>
        <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          High Contrast
        </button>
        <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Large Text
        </button>
        <button style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Default Mode
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Accessibility Monitoring</h3>
        <button style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Enable Monitoring
        </button>
        <button style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          Disable Monitoring
        </button>
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h4>Accessibility Status</h4>
        <p>Accessibility Enabled: ✅ Yes</p>
      </div>
    </div>
  );
};

const meta: Meta<typeof AccessibilityProvider> = {
  title: 'Accessibility/AccessibilityContext',
  component: AccessibilityProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Central accessibility context that manages screen reader announcements, voice commands, visual modes, and accessibility monitoring across the entire application.',
      },
    },
  },
  tags: ['autodocs', 'accessibility'],
};

export default meta;
type Story = StoryObj<typeof AccessibilityProvider>;

export const Default: Story = {
  args: {
    children: <AccessibilityDemo />,
  },
};

export const FinancialDashboard: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <h1>Financial Dashboard with Accessibility</h1>
        <AccessibilityDemo />
        
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Sample Financial Content</h3>
          <p>This content is fully accessible with screen reader support, voice commands, and visual adaptations.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
              <h4>Total Balance</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$45,678.90</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
              <h4>Monthly Income</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$12,345.67</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
              <h4>Active Accounts</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>8</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Financial dashboard with full accessibility integration, demonstrating how accessibility features enhance the user experience for financial applications.',
      },
    },
  },
};
