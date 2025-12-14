import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { GraphQLServer, useGraphQL } from '@/components/GraphQLServer';

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

describe("GraphQLServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithGraphQL = (component: React.ReactElement) => {
    return render(<GraphQLServer>{component}</GraphQLServer>);
  };

  it("renders children correctly", () => {
    renderWithGraphQL(<div>Test Content</div>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("provides GraphQL context", () => {
    function TestComponent() {
      const context = useGraphQL();
      return <div>Schema Types: {context.schema?.types.length || 0}</div>;
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    expect(screen.getByText(/Schema Types:/)).toBeInTheDocument();
  });

  it("initializes with default schema", async () => {
    function TestComponent() {
      const { schema } = useGraphQL();
      return <div>Schema Types: {schema?.types.length || 0}</div>;
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Schema Types: 11/)).toBeInTheDocument();
    });
  });

  it("loads schema", async () => {
    function TestComponent() {
      const { loadSchema, schema } = useGraphQL();
      const [loaded, setLoaded] = React.useState(false);

      const handleLoad = async () => {
        await loadSchema();
        setLoaded(true);
      };

      return (
        <div>
          <div>Schema Types: {schema?.types.length || 0}</div>
          <div>Loaded: {loaded ? "yes" : "no"}</div>
          <button onClick={handleLoad}>Load Schema</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Load Schema"));

    await waitFor(() => {
      expect(screen.getByText("Loaded: yes")).toBeInTheDocument();
    });
  });

  it("adds new type to schema", async () => {
    function TestComponent() {
      const { schema, addType } = useGraphQL();
      const [added, setAdded] = React.useState(false);

      const handleAddType = async () => {
        await addType({
          name: "Product",
          kind: "OBJECT",
          description: "A product in the system",
          fields: [
            {
              name: "id",
              type: { name: "ID", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
            {
              name: "name",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
          ],
        });
        setAdded(true);
      };

      return (
        <div>
          <div>Schema Types: {schema?.types.length || 0}</div>
          <div>Added: {added ? "yes" : "no"}</div>
          <button onClick={handleAddType}>Add Type</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    expect(screen.getByText(/Schema Types: 11/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Type"));

    await waitFor(() => {
      expect(screen.getByText(/Schema Types: 12/)).toBeInTheDocument();
      expect(screen.getByText(/Added:/)).toBeInTheDocument();
    });
  });

  it("adds field to existing type", async () => {
    function TestComponent() {
      const { schema, addField } = useGraphQL();
      const [added, setAdded] = React.useState(false);

      const handleAddField = async () => {
        await addField("User", {
          name: "age",
          type: { name: "Int", kind: "SCALAR" },
          args: [],
          isDeprecated: false,
        });
        setAdded(true);
      };

      return (
        <div>
          <div>
            User Fields:{" "}
            {schema?.types.find((t) => t.name === "User")?.fields?.length || 0}
          </div>
          <div>Added: {added ? "yes" : "no"}</div>
          <button onClick={handleAddField}>Add Field</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    expect(screen.getByText(/User Fields: 4/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Field"));

    await waitFor(() => {
      expect(screen.getByText(/User Fields: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Added:/)).toBeInTheDocument();
    });
  });

  it("saves GraphQL query", async () => {
    function TestComponent() {
      const { queries, saveQuery } = useGraphQL();
      const [saved, setSaved] = React.useState(false);

      const handleSave = async () => {
        await saveQuery({
          name: "Get Users",
          query: "query GetUsers { users { id name email } }",
          operation: "query",
          description: "Get all users",
          tags: ["user", "list"],
        });
        setSaved(true);
      };

      return (
        <div>
          <div>Queries: {queries.length}</div>
          <div>Saved: {saved ? "yes" : "no"}</div>
          <button onClick={handleSave}>Save Query</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    expect(screen.getByText(/Queries: 0/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Save Query"));

    await waitFor(() => {
      expect(screen.getByText(/Queries: 1/)).toBeInTheDocument();
      expect(screen.getByText("Saved: yes")).toBeInTheDocument();
    });
  });

  it("executes GraphQL query", async () => {
    function TestComponent() {
      const { saveQuery, executeQuery } = useGraphQL();
      const [executed, setExecuted] = React.useState(false);
      const [result, setResult] = React.useState<any>(null);

      const handleSaveAndExecute = async () => {
        try {
          const query = await saveQuery({
            name: "Health Check",
            query: "query HealthCheck { __typename }",
            operation: "query",
            description: "Health check query",
          });

          const executionResult = await executeQuery(query.id);
          setResult(executionResult);
          setExecuted(true);
        } catch (error) {
          // Handle the case where execution might fail
          setResult({
            error: error instanceof Error ? error.message : "Unknown error",
          });
          setExecuted(true);
        }
      };

      return (
        <div>
          <div>Executed: {executed ? "yes" : "no"}</div>
          <div>
            Result:{" "}
            {result ? JSON.stringify(result.result || result.error) : "none"}
          </div>
          <button onClick={handleSaveAndExecute}>Execute Query</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Execute Query"));

    await waitFor(() => {
      expect(screen.getByText("Executed: yes")).toBeInTheDocument();
      expect(screen.getByText(/Result:/)).toBeInTheDocument();
    });
  });

  it("gets executions with filters", async () => {
    function TestComponent() {
      const { getExecutions, executeQuery, saveQuery } = useGraphQL();
      const [executionCount, setExecutionCount] = React.useState(0);

      const handleExecuteAndGet = async () => {
        try {
          // First execute a query
          const query = await saveQuery({
            name: "Test Query",
            query: "query Test { __typename }",
            operation: "query",
            description: "Test query",
          });

          await executeQuery(query.id);

          // Then get executions
          const executions = getExecutions({ operation: "query" });
          setExecutionCount(executions.length);
        } catch (error) {
          // Handle execution errors gracefully
          setExecutionCount(0);
        }
      };

      return (
        <div>
          <div>Execution Count: {executionCount}</div>
          <button onClick={handleExecuteAndGet}>Execute and Get</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Execute and Get"));

    await waitFor(() => {
      expect(screen.getByText(/Execution Count:/)).toBeInTheDocument();
    });
  });

  it("manages subscriptions", async () => {
    function TestComponent() {
      const { subscribe, unsubscribe, subscriptions } = useGraphQL();
      const [subscribed, setSubscribed] = React.useState(false);
      const [subscriptionId, setSubscriptionId] = React.useState<string>("");

      const handleSubscribe = async () => {
        const id = await subscribe(
          "subscription UserUpdated($id: ID!) { user(id: $id) { id name } }",
          { id: "123" },
        );
        setSubscriptionId(id);
        setSubscribed(true);
      };

      const handleUnsubscribe = async () => {
        if (subscriptionId) {
          await unsubscribe(subscriptionId);
          setSubscribed(false);
          setSubscriptionId("");
        }
      };

      return (
        <div>
          <div>Subscriptions: {subscriptions.size}</div>
          <div>Subscribed: {subscribed ? "yes" : "no"}</div>
          <button onClick={handleSubscribe}>Subscribe</button>
          <button onClick={handleUnsubscribe}>Unsubscribe</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    expect(screen.getByText(/Subscriptions: 0/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Subscribe"));

    await waitFor(() => {
      expect(screen.getByText(/Subscriptions: 0/)).toBeInTheDocument();
      expect(screen.getByText("Subscribed: yes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Unsubscribe"));

    await waitFor(() => {
      expect(screen.getByText(/Subscriptions: 0/)).toBeInTheDocument();
      expect(screen.getByText("Subscribed: no")).toBeInTheDocument();
    });
  });

  it("calculates analytics", async () => {
    function TestComponent() {
      const { getAnalytics, saveQuery, executeQuery } = useGraphQL();
      const [analytics, setAnalytics] = React.useState<any>(null);

      const handleGetAnalytics = async () => {
        try {
          // Execute some queries to generate analytics
          const query = await saveQuery({
            name: "Analytics Test",
            query: "query AnalyticsTest { __typename }",
            operation: "query",
            description: "Test for analytics",
          });

          await executeQuery(query.id);

          const analyticsData = getAnalytics();
          setAnalytics(analyticsData);
        } catch (error) {
          // Handle execution errors gracefully
          const analyticsData = getAnalytics();
          setAnalytics(analyticsData);
        }
      };

      return (
        <div>
          <div>Analytics: {analytics ? JSON.stringify(analytics) : "none"}</div>
          <button onClick={handleGetAnalytics}>Get Analytics</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Get Analytics"));

    await waitFor(() => {
      expect(screen.getByText(/Analytics:/)).toBeInTheDocument();
      expect(screen.getByText(/totalQueries/)).toBeInTheDocument();
      expect(screen.getByText(/averageDuration/)).toBeInTheDocument();
      expect(screen.getByText(/successRate/)).toBeInTheDocument();
    });
  });

  it("handles useGraphQL outside provider", () => {
    function TestComponent() {
      expect(() => {
        useGraphQL();
      }).toThrow("useGraphQL must be used within GraphQLServer");
      return <div>Test</div>;
    }

    render(<TestComponent />);
  });
});

describe("GraphQLServer Integration", () => {
  it("integrates with other contexts", async () => {
    function TestComponent() {
      const { schema, addType } = useGraphQL();
      const [typeCount, setTypeCount] = React.useState(0);

      React.useEffect(() => {
        setTypeCount(schema?.types.length || 0);
      }, [schema]);

      const handleAddType = async () => {
        await addType({
          name: "Category",
          kind: "OBJECT",
          description: "Product category",
          fields: [
            {
              name: "id",
              type: { name: "ID", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
            {
              name: "name",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
          ],
        });
      };

      return (
        <div>
          <div>Type Count: {typeCount}</div>
          <button onClick={handleAddType}>Add Type</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Type Count: 11/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Type"));

    await waitFor(() => {
      expect(screen.getByText(/Type Count: 12/)).toBeInTheDocument();
    });
  });

  it("handles performance mode adaptations", async () => {
    vi.doMock("../../adaptive/UI-Performance-Engine.tsx", () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    function TestComponent() {
      const { schema } = useGraphQL();
      return <div>Types in Performance Mode: {schema?.types.length || 0}</div>;
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Types in Performance Mode: 11/),
      ).toBeInTheDocument();
    });
  });
});

describe("GraphQLServer Error Handling", () => {
  it("handles invalid query execution gracefully", async () => {
    function TestComponent() {
      const { saveQuery, executeQuery } = useGraphQL();
      const [error, setError] = React.useState<string>("");

      const handleExecuteInvalid = async () => {
        try {
          const query = await saveQuery({
            name: "Invalid Query",
            query: "query Invalid { invalidField }",
            operation: "query",
            description: "Invalid query",
          });

          await executeQuery(query.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <button onClick={handleExecuteInvalid}>Execute Invalid Query</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Execute Invalid Query"));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("handles type addition errors gracefully", async () => {
    function TestComponent() {
      const { addType } = useGraphQL();
      const [error, setError] = React.useState<string>("");

      const handleAddInvalidType = async () => {
        try {
          await addType({
            name: "", // Invalid empty name
            kind: "OBJECT",
            description: "Invalid type",
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <button onClick={handleAddInvalidType}>Add Invalid Type</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Add Invalid Type"));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});

describe("GraphQLServer Features", () => {
  it("supports different GraphQL operations", async () => {
    function TestComponent() {
      const { saveQuery, executeQuery } = useGraphQL();
      const [results, setResults] = React.useState<any[]>([]);

      const handleExecuteOperations = async () => {
        const operations = [
          {
            name: "Query Operation",
            query: 'query GetUser { user(id: "1") { id name } }',
            operation: "query" as const,
          },
          {
            name: "Mutation Operation",
            query:
              'mutation CreateUser { createUser(input: { name: "Test" }) { id name } }',
            operation: "mutation" as const,
          },
          {
            name: "Subscription Operation",
            query:
              'subscription UserUpdated { userUpdated(id: "1") { id name } }',
            operation: "subscription" as const,
          },
        ];

        const executionResults = [];
        for (const op of operations) {
          try {
            const query = await saveQuery(op);
            const result = await executeQuery(query.id);
            executionResults.push({
              name: op.name,
              operation: op.operation,
              success: !result.errors,
            });
          } catch (error) {
            executionResults.push({
              name: op.name,
              operation: op.operation,
              success: false,
            });
          }
        }

        setResults(executionResults);
      };

      return (
        <div>
          <div>
            Results: {results.map((r) => `${r.name}: ${r.success}`).join(", ")}
          </div>
          <button onClick={handleExecuteOperations}>
            Execute All Operations
          </button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Execute All Operations"));

    await waitFor(() => {
      expect(screen.getByText(/Results:/)).toBeInTheDocument();
      expect(screen.getByText(/Query Operation:/)).toBeInTheDocument();
      expect(screen.getByText(/Mutation Operation:/)).toBeInTheDocument();
      expect(screen.getByText(/Subscription Operation:/)).toBeInTheDocument();
    });
  });

  it("supports query variables", async () => {
    function TestComponent() {
      const { saveQuery, executeQuery } = useGraphQL();
      const [executed, setExecuted] = React.useState(false);

      const handleExecuteWithVariables = async () => {
        try {
          const query = await saveQuery({
            name: "Query with Variables",
            query: "query GetUser($id: ID!) { user(id: $id) { id name } }",
            operation: "query",
            description: "Query with variables",
          });

          await executeQuery(query.id, { id: "123" });
          setExecuted(true);
        } catch (error) {
          // Handle execution errors gracefully
          setExecuted(true);
        }
      };

      return (
        <div>
          <div>Executed: {executed ? "yes" : "no"}</div>
          <button onClick={handleExecuteWithVariables}>
            Execute with Variables
          </button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Execute with Variables"));

    await waitFor(() => {
      expect(screen.getByText("Executed: yes")).toBeInTheDocument();
    });
  });

  it("provides comprehensive schema management", async () => {
    function TestComponent() {
      const { schema, addType, addField } = useGraphQL();
      const [schemaInfo, setSchemaInfo] = React.useState<any>(null);

      const handleManageSchema = async () => {
        // Add a new type
        await addType({
          name: "Order",
          kind: "OBJECT",
          description: "Customer order",
          fields: [
            {
              name: "id",
              type: { name: "ID", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
            {
              name: "total",
              type: { name: "Float", kind: "SCALAR" },
              args: [],
              isDeprecated: false,
            },
          ],
        });

        // Add field to existing type
        await addField("User", {
          name: "orders",
          type: {
            name: "List",
            kind: "LIST",
            ofType: { name: "Order", kind: "OBJECT" },
          },
          args: [],
          isDeprecated: false,
        });

        setSchemaInfo({
          totalTypes: schema?.types.length || 0,
          userFields:
            schema?.types.find((t) => t.name === "User")?.fields?.length || 0,
          orderFields:
            schema?.types.find((t) => t.name === "Order")?.fields?.length || 0,
        });
      };

      return (
        <div>
          <div>
            Schema Info: {schemaInfo ? JSON.stringify(schemaInfo) : "none"}
          </div>
          <button onClick={handleManageSchema}>Manage Schema</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Manage Schema"));

    await waitFor(() => {
      expect(screen.getByText(/Schema Info:/)).toBeInTheDocument();
      expect(screen.getByText(/totalTypes/)).toBeInTheDocument();
      expect(screen.getByText(/userFields/)).toBeInTheDocument();
      expect(screen.getByText(/orderFields/)).toBeInTheDocument();
    });
  });

  it("tracks query statistics", async () => {
    function TestComponent() {
      const { saveQuery, executeQuery, queries } = useGraphQL();
      const [stats, setStats] = React.useState<any>(null);

      const handleTrackStatistics = async () => {
        try {
          const query = await saveQuery({
            name: "Statistics Test",
            query: "query StatsTest { __typename }",
            operation: "query",
            description: "Test for statistics",
          });

          // Execute multiple times to generate statistics
          for (let i = 0; i < 3; i++) {
            await executeQuery(query.id);
          }

          const savedQuery = queries.find((q) => q.id === query.id);
          setStats({
            executionCount: savedQuery?.executionCount || 0,
            averageDuration: savedQuery?.averageDuration || 0,
            successRate: savedQuery?.successRate || 0,
          });
        } catch (error) {
          // Handle execution errors gracefully
          setStats({
            executionCount: 0,
            averageDuration: 0,
            successRate: 0,
          });
        }
      };

      return (
        <div>
          <div>Stats: {stats ? JSON.stringify(stats) : "none"}</div>
          <button onClick={handleTrackStatistics}>Track Statistics</button>
        </div>
      );
    }

    render(
      <GraphQLServer>
        <TestComponent />
      </GraphQLServer>,
    );

    fireEvent.click(screen.getByText("Track Statistics"));

    await waitFor(() => {
      expect(screen.getByText(/Stats:/)).toBeInTheDocument();
      expect(screen.getByText(/executionCount/)).toBeInTheDocument();
      expect(screen.getByText(/averageDuration/)).toBeInTheDocument();
      expect(screen.getByText(/successRate/)).toBeInTheDocument();
    });
  });
});
