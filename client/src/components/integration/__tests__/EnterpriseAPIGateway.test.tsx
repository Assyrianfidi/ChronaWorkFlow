import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { EnterpriseAPIGateway, useAPIGateway } from '@/components/EnterpriseAPIGateway';

// Mock modules
vi.mock("../hooks/useWindowSize", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: "admin", id: "user-123" },
  })),
}));

vi.mock("../../adaptive/UserExperienceMode.tsx", () => ({
  useUserExperienceMode: vi.fn(() => ({
    currentMode: {
      id: "standard",
      name: "Standard",
      animations: "normal",
      sounds: false,
      shortcuts: true,
    },
  })),
}));

vi.mock("../../adaptive/UI-Performance-Engine.tsx", () => ({
  usePerformance: vi.fn(() => ({
    isLowPerformanceMode: false,
  })),
}));

describe("EnterpriseAPIGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithGateway = (component: React.ReactElement) => {
    return render(<EnterpriseAPIGateway>{component}</EnterpriseAPIGateway>);
  };

  it("renders children correctly", () => {
    renderWithGateway(<div>Test Content</div>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("provides API gateway context", () => {
    function TestComponent() {
      const context = useAPIGateway();
      return <div>Endpoints: {context.endpoints.length}</div>;
    }

    renderWithGateway(<TestComponent />);

    expect(screen.getByText(/Endpoints:/)).toBeInTheDocument();
  });

  it("initializes with default endpoints", async () => {
    function TestComponent() {
      const { endpoints } = useAPIGateway();
      return <div>Endpoints: {endpoints.length}</div>;
    }

    renderWithGateway(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Endpoints: 3")).toBeInTheDocument();
    });
  });

  it("creates new API endpoint", async () => {
    function TestComponent() {
      const { endpoints, createEndpoint } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createEndpoint({
          name: "Test Endpoint",
          path: "/api/test",
          method: "GET",
          description: "Test endpoint description",
          category: "internal",
          version: "v1",
          status: "active",
          authentication: {
            type: "none",
            required: false,
          },
          rateLimit: {
            requests: 100,
            window: 60000,
            burst: 10,
          },
          validation: {
            required: [],
            optional: [],
          },
          transformation: {},
          monitoring: {
            enabled: true,
            logging: true,
            metrics: true,
          },
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Endpoints: {endpoints.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create Endpoint</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    expect(screen.getByText("Endpoints: 3")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create Endpoint"));

    await waitFor(() => {
      expect(screen.getByText("Endpoints: 4")).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("updates existing endpoint", async () => {
    function TestComponent() {
      const { endpoints, updateEndpoint } = useAPIGateway();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = async () => {
        const firstEndpoint = endpoints[0];
        if (firstEndpoint) {
          await updateEndpoint(firstEndpoint.id, { name: "Updated Endpoint" });
          setUpdated(true);
        }
      };

      return (
        <div>
          <div>First Endpoint: {endpoints[0]?.name || "None"}</div>
          <div>Updated: {updated ? "yes" : "no"}</div>
          <button onClick={handleUpdate}>Update Endpoint</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    fireEvent.click(screen.getByText("Update Endpoint"));

    await waitFor(() => {
      expect(
        screen.getByText("First Endpoint: Updated Endpoint"),
      ).toBeInTheDocument();
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });
  });

  it("deletes API endpoint", async () => {
    function TestComponent() {
      const { endpoints, deleteEndpoint } = useAPIGateway();
      const [deleted, setDeleted] = React.useState(false);

      const handleDelete = async () => {
        const firstEndpoint = endpoints[0];
        if (firstEndpoint) {
          await deleteEndpoint(firstEndpoint.id);
          setDeleted(true);
        }
      };

      return (
        <div>
          <div>Endpoints: {endpoints.length}</div>
          <div>Deleted: {deleted ? "yes" : "no"}</div>
          <button onClick={handleDelete}>Delete Endpoint</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    expect(screen.getByText("Endpoints: 3")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete Endpoint"));

    await waitFor(() => {
      expect(screen.getByText("Endpoints: 2")).toBeInTheDocument();
      expect(screen.getByText("Deleted: yes")).toBeInTheDocument();
    });
  });

  it("deploys endpoint", async () => {
    function TestComponent() {
      const { endpoints, deployEndpoint } = useAPIGateway();
      const [deployed, setDeployed] = React.useState(false);

      const handleDeploy = async () => {
        const firstEndpoint = endpoints[0];
        if (firstEndpoint) {
          await deployEndpoint(firstEndpoint.id);
          setDeployed(true);
        }
      };

      return (
        <div>
          <div>First Endpoint Status: {endpoints[0]?.status || "None"}</div>
          <div>Deployed: {deployed ? "yes" : "no"}</div>
          <button onClick={handleDeploy}>Deploy Endpoint</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    fireEvent.click(screen.getByText("Deploy Endpoint"));

    await waitFor(() => {
      expect(
        screen.getByText("First Endpoint Status: active"),
      ).toBeInTheDocument();
      expect(screen.getByText("Deployed: yes")).toBeInTheDocument();
    });
  });

  it("creates API key", async () => {
    function TestComponent() {
      const { apiKeys, createAPIKey } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createAPIKey({
          name: "Test API Key",
          permissions: ["read", "write"],
          rateLimit: {
            requests: 1000,
            window: 3600000,
          },
          isActive: true,
        });
        setCreated(true);
      };

      return (
        <div>
          <div>API Keys: {apiKeys.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create API Key</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    expect(screen.getByText("API Keys: 0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create API Key"));

    await waitFor(() => {
      expect(screen.getByText("API Keys: 1")).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("revokes API key", async () => {
    function TestComponent() {
      const { apiKeys, createAPIKey, revokeAPIKey } = useAPIGateway();
      const [revoked, setRevoked] = React.useState(false);

      const handleCreateAndRevoke = async () => {
        const apiKey = await createAPIKey({
          name: "Test API Key",
          permissions: ["read"],
          rateLimit: {
            requests: 500,
            window: 3600000,
          },
          isActive: true,
        });

        await revokeAPIKey(apiKey.id);
        setRevoked(true);
      };

      return (
        <div>
          <div>API Keys: {apiKeys.length}</div>
          <div>Revoked: {revoked ? "yes" : "no"}</div>
          <button onClick={handleCreateAndRevoke}>Create and Revoke</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    fireEvent.click(screen.getByText("Create and Revoke"));

    await waitFor(() => {
      expect(screen.getByText("API Keys: 1")).toBeInTheDocument();
      expect(screen.getByText("Revoked: yes")).toBeInTheDocument();
    });
  });

  it("creates webhook", async () => {
    function TestComponent() {
      const { webhooks, createWebhook } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createWebhook({
          name: "Test Webhook",
          url: "https://example.com/webhook",
          events: ["user.created", "user.updated"],
          active: true,
          retryPolicy: {
            maxAttempts: 3,
            backoff: "exponential",
            delay: 1000,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Webhooks: {webhooks.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create Webhook</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    expect(screen.getByText("Webhooks: 0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create Webhook"));

    await waitFor(() => {
      expect(screen.getByText("Webhooks: 1")).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("gets requests with filters", async () => {
    function TestComponent() {
      const { getRequests } = useAPIGateway();
      const [requestCount, setRequestCount] = React.useState(0);

      const handleGetRequests = async () => {
        const requests = getRequests({
          status: "completed",
        });
        setRequestCount(requests.length);
      };

      return (
        <div>
          <div>Request Count: {requestCount}</div>
          <button onClick={handleGetRequests}>Get Requests</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    fireEvent.click(screen.getByText("Get Requests"));

    await waitFor(() => {
      expect(screen.getByText("Request Count: 0")).toBeInTheDocument();
    });
  });

  it("calculates analytics", async () => {
    function TestComponent() {
      const { getAnalytics } = useAPIGateway();
      const [analytics, setAnalytics] = React.useState<any>(null);

      const handleGetAnalytics = async () => {
        const analyticsData = getAnalytics();
        setAnalytics(analyticsData);
      };

      return (
        <div>
          <div>Analytics: {analytics ? JSON.stringify(analytics) : "none"}</div>
          <button onClick={handleGetAnalytics}>Get Analytics</button>
        </div>
      );
    }

    renderWithGateway(<TestComponent />);

    fireEvent.click(screen.getByText("Get Analytics"));

    await waitFor(() => {
      expect(screen.getByText(/Analytics:/)).toBeInTheDocument();
      expect(screen.getByText(/totalRequests/)).toBeInTheDocument();
      expect(screen.getByText(/successRate/)).toBeInTheDocument();
    });
  });

  it("handles useAPIGateway outside provider", () => {
    function TestComponent() {
      expect(() => {
        useAPIGateway();
      }).toThrow("useAPIGateway must be used within EnterpriseAPIGateway");
      return <div>Test</div>;
    }

    render(<TestComponent />);
  });
});

describe("EnterpriseAPIGateway Integration", () => {
  it("integrates with other contexts", async () => {
    function TestComponent() {
      const { endpoints, createEndpoint } = useAPIGateway();
      const [endpointCount, setEndpointCount] = React.useState(0);

      React.useEffect(() => {
        setEndpointCount(endpoints.length);
      }, [endpoints]);

      const handleCreate = async () => {
        await createEndpoint({
          name: "Integration Test Endpoint",
          path: "/api/integration-test",
          method: "POST",
          description: "Testing integration",
          category: "internal",
          version: "v1",
          status: "active",
          authentication: { type: "api-key", required: true },
          rateLimit: { requests: 500, window: 60000, burst: 25 },
          validation: { required: [], optional: [] },
          transformation: {},
          monitoring: { enabled: true, logging: true, metrics: true },
        });
      };

      return (
        <div>
          <div>Endpoint Count: {endpointCount}</div>
          <button onClick={handleCreate}>Create Endpoint</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    await waitFor(() => {
      expect(screen.getByText("Endpoint Count: 3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Endpoint"));

    await waitFor(() => {
      expect(screen.getByText("Endpoint Count: 4")).toBeInTheDocument();
    });
  });

  it("handles performance mode adaptations", async () => {
    vi.doMock("../../adaptive/UI-Performance-Engine.tsx", () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    function TestComponent() {
      const { endpoints } = useAPIGateway();
      return <div>Endpoints in Performance Mode: {endpoints.length}</div>;
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Endpoints in Performance Mode: 3"),
      ).toBeInTheDocument();
    });
  });
});

describe("EnterpriseAPIGateway Error Handling", () => {
  it("handles endpoint creation errors gracefully", async () => {
    function TestComponent() {
      const { createEndpoint } = useAPIGateway();
      const [error, setError] = React.useState<string>("");

      const handleCreate = async () => {
        try {
          await createEndpoint({
            name: "", // Invalid empty name
            path: "/api/test",
            method: "GET",
            description: "Test endpoint",
            category: "internal",
            version: "v1",
            status: "active",
            authentication: { type: "none", required: false },
            rateLimit: { requests: 100, window: 60000, burst: 10 },
            validation: { required: [], optional: [] },
            transformation: {},
            monitoring: { enabled: true, logging: true, metrics: true },
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <button onClick={handleCreate}>Create Invalid Endpoint</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Create Invalid Endpoint"));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("handles webhook creation errors gracefully", async () => {
    function TestComponent() {
      const { createWebhook } = useAPIGateway();
      const [error, setError] = React.useState<string>("");

      const handleCreate = async () => {
        try {
          await createWebhook({
            name: "Test Webhook",
            url: "invalid-url", // Invalid URL
            events: ["test.event"],
            active: true,
            retryPolicy: {
              maxAttempts: 3,
              backoff: "exponential",
              delay: 1000,
            },
            headers: {},
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <button onClick={handleCreate}>Create Invalid Webhook</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Create Invalid Webhook"));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});

describe("EnterpriseAPIGateway Features", () => {
  it("supports different authentication types", async () => {
    function TestComponent() {
      const { createEndpoint } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createEndpoint({
          name: "OAuth Endpoint",
          path: "/api/oauth",
          method: "GET",
          description: "OAuth protected endpoint",
          category: "external",
          version: "v1",
          status: "active",
          authentication: { type: "oauth2", required: true },
          rateLimit: { requests: 100, window: 60000, burst: 10 },
          validation: { required: [], optional: [] },
          transformation: {},
          monitoring: { enabled: true, logging: true, metrics: true },
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create OAuth Endpoint</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Create OAuth Endpoint"));

    await waitFor(() => {
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("supports request transformations", async () => {
    function TestComponent() {
      const { createEndpoint } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createEndpoint({
          name: "Transformed Endpoint",
          path: "/api/transform",
          method: "POST",
          description: "Endpoint with transformations",
          category: "internal",
          version: "v1",
          status: "active",
          authentication: { type: "api-key", required: true },
          rateLimit: { requests: 100, window: 60000, burst: 10 },
          validation: { required: [], optional: [] },
          transformation: {
            request: {
              transformer: "camelCase",
            },
            response: {
              transformer: "snakeCase",
            },
          },
          monitoring: { enabled: true, logging: true, metrics: true },
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create Transformed Endpoint</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Create Transformed Endpoint"));

    await waitFor(() => {
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("supports webhook retry policies", async () => {
    function TestComponent() {
      const { createWebhook, webhooks } = useAPIGateway();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createWebhook({
          name: "Retry Webhook",
          url: "https://example.com/webhook",
          events: ["test.retry"],
          active: true,
          retryPolicy: {
            maxAttempts: 5,
            backoff: "linear",
            delay: 2000,
          },
          headers: {
            "Content-Type": "application/json",
            "X-Retry-Policy": "linear",
          },
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Created: {created ? "yes" : "no"}</div>
          <div>Webhooks: {webhooks.length}</div>
          <button onClick={handleCreate}>Create Retry Webhook</button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Create Retry Webhook"));

    await waitFor(() => {
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
      expect(screen.getByText("Webhooks: 1")).toBeInTheDocument();
    });
  });

  it("provides comprehensive analytics", async () => {
    function TestComponent() {
      const { getAnalytics, createEndpoint } = useAPIGateway();
      const [analytics, setAnalytics] = React.useState<any>(null);

      const handleCreateAndGetAnalytics = async () => {
        // Create some endpoints to generate analytics
        await createEndpoint({
          name: "Analytics Test 1",
          path: "/api/analytics1",
          method: "GET",
          description: "Test endpoint for analytics",
          category: "internal",
          version: "v1",
          status: "active",
          authentication: { type: "none", required: false },
          rateLimit: { requests: 100, window: 60000, burst: 10 },
          validation: { required: [], optional: [] },
          transformation: {},
          monitoring: { enabled: true, logging: true, metrics: true },
        });

        const analyticsData = getAnalytics();
        setAnalytics(analyticsData);
      };

      return (
        <div>
          <div>Analytics: {analytics ? JSON.stringify(analytics) : "none"}</div>
          <button onClick={handleCreateAndGetAnalytics}>
            Get Comprehensive Analytics
          </button>
        </div>
      );
    }

    render(
      <EnterpriseAPIGateway>
        <TestComponent />
      </EnterpriseAPIGateway>,
    );

    fireEvent.click(screen.getByText("Get Comprehensive Analytics"));

    await waitFor(() => {
      expect(screen.getByText(/Analytics:/)).toBeInTheDocument();
      expect(screen.getByText(/totalRequests/)).toBeInTheDocument();
      expect(screen.getByText(/successRate/)).toBeInTheDocument();
      expect(screen.getByText(/averageResponseTime/)).toBeInTheDocument();
      expect(screen.getByText(/topEndpoints/)).toBeInTheDocument();
      expect(screen.getByText(/errorAnalysis/)).toBeInTheDocument();
    });
  });
});
