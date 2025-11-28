import type { Meta, StoryObj } from '@storybook/react';
import { UserExperienceModeProvider, useUserExperienceMode } from './UserExperienceMode';

// Demo component to show user experience mode features
const UXModeDemo: React.FC = () => {
  const { preferences, updatePreferences, resetPreferences } = useUserExperienceMode();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>User Experience Mode Preferences</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Display Preferences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.reduceAnimations}
                onChange={(e) => updatePreferences({ reduceAnimations: e.target.checked })}
              />
              Reduce Animations
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.highContrast}
                onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
              />
              High Contrast Mode
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.largeText}
                onChange={(e) => updatePreferences({ largeText: e.target.checked })}
              />
              Large Text
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.simpleMode}
                onChange={(e) => updatePreferences({ simpleMode: e.target.checked })}
              />
              Simple Mode
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Interaction Preferences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.keyboardNavigation}
                onChange={(e) => updatePreferences({ keyboardNavigation: e.target.checked })}
              />
              Keyboard Navigation
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.screenReaderOptimized}
                onChange={(e) => updatePreferences({ screenReaderOptimized: e.target.checked })}
              />
              Screen Reader Optimized
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.voiceCommands}
                onChange={(e) => updatePreferences({ voiceCommands: e.target.checked })}
              />
              Voice Commands
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Content Preferences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.showTooltips}
                onChange={(e) => updatePreferences({ showTooltips: e.target.checked })}
              />
              Show Tooltips
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.showNotifications}
                onChange={(e) => updatePreferences({ showNotifications: e.target.checked })}
              />
              Show Notifications
            </label>
          </div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={preferences.showHelpText}
                onChange={(e) => updatePreferences({ showHelpText: e.target.checked })}
              />
              Show Help Text
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Performance Preferences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label>
              Data Quality:
              <select 
                value={preferences.dataQuality}
                onChange={(e) => updatePreferences({ dataQuality: e.target.value as any })}
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              Auto-refresh:
              <select 
                value={preferences.autoRefresh}
                onChange={(e) => updatePreferences({ autoRefresh: e.target.value as any })}
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
                <option value="wifi-only">WiFi Only</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Current Preferences</h3>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
          {JSON.stringify(preferences, null, 2)}
        </pre>
      </div>

      <button 
        onClick={resetPreferences}
        style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Reset to Defaults
      </button>
    </div>
  );
};

const meta: Meta<typeof UserExperienceModeProvider> = {
  title: 'Adaptive/UserExperienceMode',
  component: UserExperienceModeProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Advanced user experience mode provider that adapts the interface based on user preferences, device capabilities, and accessibility needs.',
      },
    },
  },
  tags: ['autodocs', 'adaptive'],
};

export default meta;
type Story = StoryObj<typeof UserExperienceModeProvider>;

export const Default: Story = {
  args: {
    children: <UXModeDemo />,
  },
};

export const FinancialDashboard: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem', maxWidth: '1000px' }}>
        <h1>Financial Dashboard with UX Adaptation</h1>
        <UXModeDemo />
        
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Adaptive Financial Interface</h3>
          <p>This interface automatically adapts based on your UX preferences:</p>
          <ul>
            <li><strong>High Contrast Mode:</strong> Enhanced visibility for users with visual impairments</li>
            <li><strong>Large Text:</strong> Improved readability for better user experience</li>
            <li><strong>Reduce Animations:</strong> Better performance and reduced motion sickness</li>
            <li><strong>Keyboard Navigation:</strong> Full keyboard accessibility</li>
            <li><strong>Voice Commands:</strong> Hands-free operation</li>
            <li><strong>Data Quality:</strong> Optimize for network conditions</li>
          </ul>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Financial dashboard with comprehensive UX adaptation features for personalized user experience.',
      },
    },
  },
};

export const AccessibilityFocused: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Accessibility-First Experience</h1>
        <UXModeDemo />
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Accessibility Features</h3>
          <p>This mode prioritizes accessibility with:</p>
          <ul>
            <li>Screen reader optimization</li>
            <li>High contrast colors</li>
            <li>Large text options</li>
            <li>Keyboard-only navigation</li>
            <li>Reduced animations</li>
            <li>Voice command support</li>
          </ul>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility-focused configuration demonstrating comprehensive support for users with disabilities.',
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Performance-Optimized Experience</h1>
        <UXModeDemo />
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Performance Features</h3>
          <p>This mode prioritizes performance with:</p>
          <ul>
            <li>Reduced animations and transitions</li>
            <li>Lower data quality settings</li>
            <li>Disabled auto-refresh</li>
            <li>Simplified interface</li>
            <li>Minimal tooltips and help text</li>
            <li>Optimized for slower connections</li>
          </ul>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized configuration for users with limited bandwidth or older devices.',
      },
    },
  },
};
