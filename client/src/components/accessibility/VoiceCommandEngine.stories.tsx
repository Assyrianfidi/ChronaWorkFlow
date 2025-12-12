import type { Meta, StoryObj } from "@storybook/react";
import { VoiceCommandEngine } from './VoiceCommandEngine.js';

const meta: Meta<typeof VoiceCommandEngine> = {
  title: "Accessibility/VoiceCommandEngine",
  component: VoiceCommandEngine,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Advanced voice command engine that enables hands-free navigation and control of the application using speech recognition and natural language processing.",
      },
    },
  },
  tags: ["autodocs", "accessibility"],
};

export default meta;
type Story = StoryObj<typeof VoiceCommandEngine>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Voice Command Engine Demo</h1>
        <p>
          Try saying commands like "click button", "navigate to dashboard", or
          "show help" to control the interface with your voice.
        </p>

        <div style={{ marginTop: "2rem" }}>
          <h2>Voice Commands Available:</h2>
          <ul>
            <li>"Click [button name]" - Click any button</li>
            <li>"Navigate to [page]" - Navigate to different pages</li>
            <li>"Show help" - Display help information</li>
            <li>"Toggle theme" - Switch between light and dark themes</li>
            <li>"Scroll down/up" - Scroll the page</li>
            <li>"Focus input" - Focus on input fields</li>
          </ul>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Interactive Elements</h2>
          <button id="voice-btn-1">Voice Button 1</button>
          <button id="voice-btn-2" style={{ marginLeft: "1rem" }}>
            Voice Button 2
          </button>
          <button id="voice-btn-3" style={{ marginLeft: "1rem" }}>
            Voice Button 3
          </button>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Voice Status</h2>
          <div
            id="voice-status"
            style={{
              padding: "1rem",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            <p>
              Microphone: <span id="mic-status">Inactive</span>
            </p>
            <p>
              Last Command: <span id="last-command">None</span>
            </p>
            <p>
              Confidence: <span id="confidence">-</span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
};

export const FormControls: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Voice-Controlled Form</h1>
        <p>Use voice commands to fill out and submit this form.</p>

        <form style={{ marginTop: "2rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-name">Name:</label>
            <input
              id="voice-name"
              type="text"
              placeholder="Say 'fill name John'"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-email">Email:</label>
            <input
              id="voice-email"
              type="email"
              placeholder="Say 'fill email john@example.com'"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-message">Message:</label>
            <textarea
              id="voice-message"
              placeholder="Say 'fill message Hello world'"
              rows={4}
            ></textarea>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              <input id="voice-terms" type="checkbox" />I agree to the terms and
              conditions
            </label>
          </div>

          <button type="submit" id="voice-submit">
            Submit Form
          </button>
          <button type="button" id="voice-clear" style={{ marginLeft: "1rem" }}>
            Clear Form
          </button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <h3>Voice Form Commands:</h3>
          <ul>
            <li>"Fill name [value]" - Fill the name field</li>
            <li>"Fill email [value]" - Fill the email field</li>
            <li>"Fill message [value]" - Fill the message field</li>
            <li>"Check terms" - Check the terms checkbox</li>
            <li>"Uncheck terms" - Uncheck the terms checkbox</li>
            <li>"Submit form" - Submit the form</li>
            <li>"Clear form" - Clear all form fields</li>
          </ul>
        </div>
      </div>
    ),
  },
};

export const NavigationDemo: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Voice Navigation Demo</h1>
        <p>Navigate the interface using voice commands.</p>

        <nav aria-label="Main navigation">
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              gap: "1rem",
            }}
          >
            <li>
              <button id="nav-home">Home</button>
            </li>
            <li>
              <button id="nav-dashboard">Dashboard</button>
            </li>
            <li>
              <button id="nav-accounts">Accounts</button>
            </li>
            <li>
              <button id="nav-reports">Reports</button>
            </li>
            <li>
              <button id="nav-settings">Settings</button>
            </li>
          </ul>
        </nav>

        <main style={{ marginTop: "2rem" }}>
          <section id="home-section" style={{ display: "none" }}>
            <h2>Home Page</h2>
            <p>Welcome to the AccuBooks home page.</p>
          </section>

          <section id="dashboard-section" style={{ display: "none" }}>
            <h2>Dashboard</h2>
            <p>View your financial overview and key metrics.</p>
          </section>

          <section id="accounts-section" style={{ display: "none" }}>
            <h2>Accounts</h2>
            <p>Manage your financial accounts and balances.</p>
          </section>

          <section id="reports-section" style={{ display: "none" }}>
            <h2>Reports</h2>
            <p>Generate and view financial reports.</p>
          </section>

          <section id="settings-section" style={{ display: "none" }}>
            <h2>Settings</h2>
            <p>Configure your application preferences.</p>
          </section>

          <section id="default-section">
            <h2>Voice Navigation Commands:</h2>
            <ul>
              <li>"Navigate home" or "Go to home"</li>
              <li>"Navigate dashboard" or "Go to dashboard"</li>
              <li>"Navigate accounts" or "Go to accounts"</li>
              <li>"Navigate reports" or "Go to reports"</li>
              <li>"Navigate settings" or "Go to settings"</li>
              <li>"Go back" or "Previous page"</li>
              <li>"Show menu" or "Open navigation"</li>
            </ul>
          </section>
        </main>
      </div>
    ),
  },
};

export const AdvancedFeatures: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Advanced Voice Features</h1>
        <p>Demonstrates advanced voice command capabilities.</p>

        <div style={{ marginTop: "2rem" }}>
          <h2>Custom Commands</h2>
          <button id="custom-calc">Open Calculator</button>
          <button id="custom-calendar" style={{ marginLeft: "1rem" }}>
            Show Calendar
          </button>
          <button id="custom-search" style={{ marginLeft: "1rem" }}>
            Search
          </button>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Voice Macros</h2>
          <button id="macro-financial">Run Financial Report</button>
          <button id="macro-backup" style={{ marginLeft: "1rem" }}>
            Backup Data
          </button>
          <button id="macro-export" style={{ marginLeft: "1rem" }}>
            Export Data
          </button>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Multi-step Commands</h2>
          <p>Try saying complex commands like:</p>
          <ul>
            <li>"Navigate to accounts and show balance"</li>
            <li>"Open calculator and add 5 plus 3"</li>
            <li>"Search for transactions last month"</li>
// @ts-ignore
            <li>"Generate report and save as PDF"</li>
          </ul>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Voice Feedback</h2>
          <div
            id="voice-feedback"
            style={{
              padding: "1rem",
              backgroundColor: "#e8f4fd",
              border: "1px solid #0066cc",
              borderRadius: "4px",
              minHeight: "60px",
            }}
          >
            <p>Voice command responses will appear here...</p>
          </div>
        </div>
      </div>
    ),
  },
};
