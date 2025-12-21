import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  UserExperienceModeProvider,
  useUserExperienceMode,
} from "./UserExperienceMode";

const UXModeDemo: React.FC = () => {
  const { currentMode, customSettings, updateCustomSettings, resetToDefaults } =
    useUserExperienceMode();

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <h2>User Experience Mode</h2>
      <p>Current mode: {currentMode.name}</p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <label>
          <input
            type="checkbox"
            checked={customSettings.animations === "minimal"}
            onChange={(e) =>
              updateCustomSettings({
                animations: e.target.checked ? "minimal" : "normal",
              })
            }
          />
          Minimal animations
        </label>

        <label>
          <input
            type="checkbox"
            checked={customSettings.accessibility === "high-contrast"}
            onChange={(e) =>
              updateCustomSettings({
                accessibility: e.target.checked ? "high-contrast" : "standard",
              })
            }
          />
          High contrast
        </label>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button type="button" onClick={resetToDefaults}>
          Reset
        </button>
      </div>
    </div>
  );
};

const meta: Meta<typeof UserExperienceModeProvider> = {
  title: "Adaptive/UserExperienceMode",
  component: UserExperienceModeProvider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Advanced user experience mode provider that adapts the interface based on user preferences, device capabilities, and accessibility needs.",
      },
    },
  },
  tags: ["autodocs", "adaptive"],
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
      <div style={{ padding: "2rem", maxWidth: "1000px" }}>
        <h1>Financial Dashboard with UX Adaptation</h1>
        <UXModeDemo />

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <h3>Adaptive Financial Interface</h3>
          <p>
            This interface automatically adapts based on your UX preferences:
          </p>
          <ul>
            <li>
              <strong>High Contrast Mode:</strong> Enhanced visibility for users
              with visual impairments
            </li>
            <li>
              <strong>Large Text:</strong> Improved readability for better user
              experience
            </li>
            <li>
              <strong>Reduce Animations:</strong> Better performance and reduced
              motion sickness
            </li>
            <li>
              <strong>Keyboard Navigation:</strong> Full keyboard accessibility
            </li>
            <li>
              <strong>Voice Commands:</strong> Hands-free operation
            </li>
            <li>
              <strong>Data Quality:</strong> Optimize for network conditions
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Financial dashboard with comprehensive UX adaptation features for personalized user experience.",
      },
    },
  },
};

export const AccessibilityFocused: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Accessibility-First Experience</h1>
        <UXModeDemo />

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
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
        story:
          "Accessibility-focused configuration demonstrating comprehensive support for users with disabilities.",
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Performance-Optimized Experience</h1>
        <UXModeDemo />

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
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
        story:
          "Performance-optimized configuration for users with limited bandwidth or older devices.",
      },
    },
  },
};
