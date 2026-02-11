import type { Meta, StoryObj } from "@storybook/react";
import { RealTimeAccessibilityMonitor } from "./RealTimeAccessibilityMonitor";

const meta: Meta<typeof RealTimeAccessibilityMonitor> = {
  title: "Accessibility/RealTimeAccessibilityMonitor",
  component: RealTimeAccessibilityMonitor,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Real-time accessibility monitoring component that scans DOM elements for WCAG compliance violations and provides live feedback to users and developers.",
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
        <h1>Accessibility Monitor Demo</h1>
        <p>
          This page is being monitored for accessibility violations in
          real-time.
        </p>

        <div style={{ marginTop: "2rem" }}>
          <h2>Sample Content</h2>
          <img src="https://via.placeholder.com/300x200" alt="Sample image" />
          <p>Some text content with proper accessibility.</p>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h3>Interactive Elements</h3>
          <button>Accessible Button</button>
          <input
            type="text"
            placeholder="Accessible input"
            aria-label="Sample input"
          />
        </div>
      </div>
    ),
  },
};

export const WithViolations: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <h1>Page with Accessibility Issues</h1>

        <div style={{ marginTop: "2rem" }}>
          <h2>Problematic Content</h2>
          <img src="https://via.placeholder.com/300x200" alt="" />
          <button></button>
          <div role="button">Not a real button</div>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates how the accessibility monitor detects and reports WCAG violations in real-time.",
      },
    },
  },
};

export const ComplexLayout: Story = {
  args: {
    children: (
      <div style={{ padding: "2rem" }}>
        <header>
          <nav aria-label="Main navigation">
            <ul>
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </nav>
        </header>

        <main style={{ marginTop: "2rem" }}>
          <section>
            <h2>Accessible Section</h2>
            <p>This section follows accessibility best practices.</p>

            <form aria-label="Contact form">
              <fieldset>
                <legend>Contact Information</legend>
                <div>
                  <label htmlFor="name">Name:</label>
                  <input id="name" type="text" required />
                </div>
                <div>
                  <label htmlFor="email">Email:</label>
                  <input id="email" type="email" required />
                </div>
                <div>
                  <label htmlFor="message">Message:</label>
                  <textarea id="message" required></textarea>
                </div>
                <button type="submit">Send Message</button>
              </fieldset>
            </form>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2>Data Table</h2>
            <table aria-label="Sample data table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Availability</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Widget A</td>
                  <td>$29.99</td>
                  <td>In Stock</td>
                </tr>
                <tr>
                  <td>Widget B</td>
                  <td>$39.99</td>
                  <td>Out of Stock</td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>

        <footer style={{ marginTop: "2rem" }}>
          <p>&copy; 2024 AccuBooks. All rights reserved.</p>
        </footer>
      </div>
    ),
  },
};
