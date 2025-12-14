declare global {
  interface Window {
    [key: string]: any;
  }
}

import type { Meta, StoryObj } from "@storybook/react";
import { ScreenReaderEnhancements } from "./ScreenReaderEnhancements.js";

const meta: Meta<typeof ScreenReaderEnhancements> = {
  title: "Accessibility/ScreenReaderEnhancements",
  component: ScreenReaderEnhancements,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Advanced screen reader enhancements that provide speech synthesis, ARIA live regions, and navigation assistance for visually impaired users.",
      },
    },
  },
  tags: ["autodocs", "accessibility"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Screen Reader Enhancements Demo</h1>
        <p>
          This page includes advanced screen reader support with speech
          synthesis and ARIA live regions.
        </p>

        <div style={{ marginTop: "2rem" }}>
          <h2>Interactive Elements</h2>
          <button
            onClick={() =>
              window.speechSynthesis?.speak(
                new SpeechSynthesisUtterance("Button clicked"),
              )
            }
          >
            Speak Text Button
          </button>

          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              window.speechSynthesis?.speak(
                new SpeechSynthesisUtterance("Custom button activated"),
              )
            }
            style={{
              marginLeft: "1rem",
              padding: "0.5rem",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Custom Button
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>Live Region Demo</h2>
          <button
            onClick={() => {
              const liveRegion = document.getElementById("demo-live-region");
              if (liveRegion) {
                liveRegion.textContent =
                  "Status updated at " + new Date().toLocaleTimeString();
              }
            }}
          >
            Update Status
          </button>
          <div
            id="demo-live-region"
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginTop: "1rem",
              padding: "0.5rem",
              backgroundColor: "#f0f0f0",
            }}
          >
            Status will appear here
          </div>
        </div>
      </div>
    ),
  },
};

export const FormWithLabels: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Accessible Form Example</h1>
        <p>
          This form demonstrates proper labeling and screen reader
          announcements.
        </p>

        <form style={{ marginTop: "2rem" }}>
          <fieldset>
            <legend>User Information</legend>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="fullName">Full Name:</label>
              <input
                id="fullName"
                type="text"
                aria-describedby="name-help"
                aria-required="true"
                required
              />
              <div id="name-help" style={{ fontSize: "0.8rem", color: "#666" }}>
                Enter your full name as it appears on official documents
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email">Email Address:</label>
              <input
                id="email"
                type="email"
                aria-describedby="email-help"
                aria-required="true"
                required
              />
              <div
                id="email-help"
                style={{ fontSize: "0.8rem", color: "#666" }}
              >
                We'll use this to send account notifications
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="phone">Phone Number:</label>
              <input id="phone" type="tel" aria-describedby="phone-help" />
              <div
                id="phone-help"
                style={{ fontSize: "0.8rem", color: "#666" }}
              >
                Optional: Include country code for international numbers
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <fieldset>
                <legend>Communication Preferences</legend>
                <div>
                  <input id="email-notifications" type="checkbox" />
                  <label htmlFor="email-notifications">
                    Email notifications
                  </label>
                </div>
                <div>
                  <input id="sms-notifications" type="checkbox" />
                  <label htmlFor="sms-notifications">SMS notifications</label>
                </div>
              </fieldset>
            </div>

            <button type="submit">Submit Form</button>
          </fieldset>
        </form>
      </div>
    ),
  },
};

export const NavigationExample: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Accessible Navigation</h1>

        <nav aria-label="Main navigation">
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <a href="#home" aria-describedby="home-desc">
                Home
              </a>
              <span
                id="home-desc"
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginLeft: "0.5rem",
                }}
              >
                Return to homepage
              </span>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a href="#dashboard" aria-describedby="dashboard-desc">
                Dashboard
              </a>
              <span
                id="dashboard-desc"
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginLeft: "0.5rem",
                }}
              >
                View your financial overview
              </span>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a href="#accounts" aria-describedby="accounts-desc">
                Accounts
              </a>
              <span
                id="accounts-desc"
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginLeft: "0.5rem",
                }}
              >
                Manage your accounts
              </span>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a href="#reports" aria-describedby="reports-desc">
                Reports
              </a>
              <span
                id="reports-desc"
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginLeft: "0.5rem",
                }}
              >
                Generate and view reports
              </span>
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: "2rem" }}>
          <h2>Skip Links</h2>
          <a
            href="#main-content"
            style={{
              padding: "0.5rem",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
            }}
          >
            Skip to main content
          </a>
        </div>

        <main id="main-content" style={{ marginTop: "2rem" }}>
          <h2>Main Content Area</h2>
          <p>
            This is the main content that screen reader users can jump to using
            the skip link.
          </p>
        </main>
      </div>
    ),
  },
};
