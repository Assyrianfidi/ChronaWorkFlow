import type { Meta, StoryObj } from "@storybook/react";
import { AdaptiveLayoutEngine } from './AdaptiveLayoutEngine';

const meta: Meta<typeof AdaptiveLayoutEngine> = {
  title: "Adaptive/AdaptiveLayoutEngine",
  component: AdaptiveLayoutEngine,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Intelligent layout engine that automatically adapts the UI based on screen size, device capabilities, user preferences, and performance metrics.",
      },
    },
  },
  tags: ["autodocs", "adaptive"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ height: "100vh" }}>
        <header
          style={{
            backgroundColor: "#f8f9fa",
            padding: "1rem",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          <h1>Adaptive Layout Engine Demo</h1>
          <p>
            This layout automatically adapts to your screen size and device
            capabilities.
          </p>
        </header>

        <main style={{ padding: "2rem" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2>Responsive Grid</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h3>Card 1</h3>
                <p>Adaptive card content that adjusts to screen size.</p>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h3>Card 2</h3>
                <p>Another adaptive card with flexible layout.</p>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h3>Card 3</h3>
                <p>Third card demonstrating grid adaptation.</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2>Flexible Navigation</h2>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Home
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Dashboard
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Accounts
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Reports
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Settings
              </button>
            </nav>
          </section>

          <section>
            <h2>Content Area</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
              <div style={{ flex: "1", minWidth: "300px" }}>
                <h3>Main Content</h3>
                <p>
                  This is the main content area that adapts to available space.
                </p>
                <p>
                  The layout engine monitors screen size, device capabilities,
                  and user preferences to optimize the display.
                </p>
              </div>
              <div style={{ flex: "0 0 300px" }}>
                <h3>Sidebar</h3>
                <p>This sidebar may hide or reposition on smaller screens.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    ),
  },
};

export const MobileOptimized: Story = {
  args: {
    children: (
      <div style={{ height: "100vh" }}>
        <header
          style={{
            backgroundColor: "#f8f9fa",
            padding: "1rem",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "1.2rem" }}>Mobile Layout</h1>
            <button
              style={{
                padding: "0.5rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              ☰ Menu
            </button>
          </div>
        </header>

        <main style={{ padding: "1rem" }}>
          <section style={{ marginBottom: "1.5rem" }}>
            <h2>Mobile-First Design</h2>
            <p>Optimized for touch interactions and small screens.</p>
          </section>

          <section style={{ marginBottom: "1.5rem" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h3>Touch-Friendly Card</h3>
                <p>Large tap targets and optimized spacing.</p>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                }}
              >
                <h3>Responsive Content</h3>
                <p>Content adapts to mobile viewport.</p>
              </div>
            </div>
          </section>

          <section>
            <h2>Mobile Navigation</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <button
                style={{
                  padding: "1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Home
              </button>
              <button
                style={{
                  padding: "1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Dashboard
              </button>
              <button
                style={{
                  padding: "1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Accounts
              </button>
              <button
                style={{
                  padding: "1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Reports
              </button>
            </div>
          </section>
        </main>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const DesktopOptimized: Story = {
  args: {
    children: (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <header
          style={{
            backgroundColor: "#f8f9fa",
            padding: "1rem 2rem",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: 0 }}>Desktop Layout</h1>
            <nav style={{ display: "flex", gap: "1rem" }}>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Home
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Dashboard
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Accounts
              </button>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                Reports
              </button>
            </nav>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1 }}>
          <aside
            style={{
              width: "250px",
              backgroundColor: "#f8f9fa",
              padding: "1rem",
              borderRight: "1px solid #dee2e6",
            }}
          >
            <h3>Sidebar</h3>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <button
                style={{
                  padding: "0.5rem",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                Overview
              </button>
              <button
                style={{
                  padding: "0.5rem",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                Analytics
              </button>
              <button
                style={{
                  padding: "0.5rem",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                Transactions
              </button>
              <button
                style={{
                  padding: "0.5rem",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                Settings
              </button>
            </nav>
          </aside>

          <main style={{ flex: 1, padding: "2rem" }}>
            <section style={{ marginBottom: "2rem" }}>
              <h2>Desktop Dashboard</h2>
              <p>
                Optimized for large screens with mouse/keyboard interactions.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <h3>$12,345</h3>
                  <p>Total Balance</p>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <h3>$3,456</h3>
                  <p>Monthly Income</p>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <h3>$2,345</h3>
                  <p>Monthly Expenses</p>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <h3>15</h3>
                  <p>Active Accounts</p>
                </div>
              </div>
            </section>

            <section>
              <h3>Recent Activity</h3>
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "left",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Description
                      </th>
                      <th
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        2024-01-15
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Salary Deposit
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        +$5,000
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        2024-01-14
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Rent Payment
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        -$1,500
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};
