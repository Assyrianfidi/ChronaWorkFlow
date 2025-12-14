import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  AnalyticsEngine,
  useAnalytics,
  AnalyticsProvider,
  withAnalytics,
} from "@/components/AnalyticsEngine";

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

describe("AnalyticsEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children correctly", () => {
    render(
      <AnalyticsEngine>
        <div>Test Content</div>
      </AnalyticsEngine>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("provides analytics context", () => {
    let contextValue: any = null;

    function TestComponent() {
      contextValue = useAnalytics();
      return <div>Test</div>;
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    expect(contextValue).toBeDefined();
    expect(contextValue.metrics).toEqual([]);
    expect(contextValue.reports).toEqual([]);
    expect(contextValue.dashboards).toEqual([]);
    expect(contextValue.insights).toEqual([]);
  });

  it("loads initial data on mount", async () => {
    function TestComponent() {
      const { metrics } = useAnalytics();
      return <div>Metrics: {metrics.length}</div>;
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("Metrics: 3")).toBeInTheDocument();
    });
  });

  it("creates default dashboard", async () => {
    function TestComponent() {
      const { dashboards } = useAnalytics();
      return <div>Dashboards: {dashboards.length}</div>;
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboards: 1")).toBeInTheDocument();
    });
  });

  it("generates reports", async () => {
    function TestComponent() {
      const { generateReport, reports } = useAnalytics();
      const [generated, setGenerated] = React.useState(false);

      const handleGenerate = async () => {
        await generateReport("summary");
        setGenerated(true);
      };

      return (
        <div>
          <div>Reports: {reports.length}</div>
          <div>Generated: {generated ? "yes" : "no"}</div>
          <button onClick={handleGenerate}>Generate Report</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    expect(screen.getByText("Reports: 0")).toBeInTheDocument();
    expect(screen.getByText("Generated: no")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(screen.getByText("Reports: 1")).toBeInTheDocument();
      expect(screen.getByText("Generated: yes")).toBeInTheDocument();
    });
  });

  it("creates dashboards", async () => {
    function TestComponent() {
      const { createDashboard, dashboards } = useAnalytics();
      const [created, setCreated] = React.useState(false);

      const handleCreate = async () => {
        await createDashboard({
          name: "Test Dashboard",
          layout: "grid",
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Dashboards: {dashboards.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create Dashboard</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Create Dashboard"));

    await waitFor(() => {
      expect(screen.getByText(/Dashboards:/)).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("updates metrics", async () => {
    function TestComponent() {
      const { updateMetrics, metrics } = useAnalytics();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = async () => {
        await updateMetrics();
        setUpdated(true);
      };

      return (
        <div>
          <div>Metrics: {metrics.length}</div>
          <div>Updated: {updated ? "yes" : "no"}</div>
          <button onClick={handleUpdate}>Update Metrics</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Update Metrics"));

    await waitFor(() => {
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });
  });

  it("analyzes trends", async () => {
    function TestComponent() {
      const { analyzeTrends, metrics } = useAnalytics();
      const [analyzed, setAnalyzed] = React.useState(false);
      const [result, setResult] = React.useState<any>(null);

      const handleAnalyze = async () => {
        const trend = await analyzeTrends(["revenue"], 30);
        setResult(trend);
        setAnalyzed(true);
      };

      return (
        <div>
          <div>Analyzed: {analyzed ? "yes" : "no"}</div>
          <div>
            Result: {result ? JSON.stringify(result).substring(0, 50) : "none"}
          </div>
          <button onClick={handleAnalyze}>Analyze Trends</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Analyze Trends"));

    await waitFor(() => {
      expect(screen.getByText("Analyzed: yes")).toBeInTheDocument();
      expect(screen.getByText(/Result:/)).toBeInTheDocument();
    });
  });

  it("detects anomalies", async () => {
    function TestComponent() {
      const { detectAnomalies, insights } = useAnalytics();
      const [detected, setDetected] = React.useState(false);
      const [anomalies, setAnomalies] = React.useState(0);

      const handleDetect = async () => {
        const results = await detectAnomalies();
        setAnomalies(results?.length || 0);
        setDetected(true);
      };

      return (
        <div>
          <div>Detected: {detected ? "yes" : "no"}</div>
          <div>Anomalies: {anomalies}</div>
          <button onClick={handleDetect}>Detect Anomalies</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Detect Anomalies"));

    await waitFor(() => {
      expect(screen.getByText("Detected: yes")).toBeInTheDocument();
    });
  });

  it("generates forecasts", async () => {
    function TestComponent() {
      const { generateForecast, metrics } = useAnalytics();
      const [forecasted, setForecasted] = React.useState(false);
      const [forecast, setForecast] = React.useState<any>(null);

      const handleForecast = async () => {
        const result = await generateForecast("revenue", 12);
        setForecast(result);
        setForecasted(true);
      };

      return (
        <div>
          <div>Forecasted: {forecasted ? "yes" : "no"}</div>
          <div>Forecast: {forecast ? forecast.methodology : "none"}</div>
          <button onClick={handleForecast}>Generate Forecast</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Generate Forecast"));

    await waitFor(() => {
      expect(screen.getByText("Forecasted: yes")).toBeInTheDocument();
      expect(
        screen.getByText("Forecast: linear_regression"),
      ).toBeInTheDocument();
    });
  });

  it("toggles real-time updates", async () => {
    function TestComponent() {
      const { isRealTimeEnabled, toggleRealTime } = useAnalytics();
      const [toggled, setToggled] = React.useState(false);

      const handleToggle = () => {
        toggleRealTime();
        setToggled(true);
      };

      return (
        <div>
          <div>Real-time: {isRealTimeEnabled ? "enabled" : "disabled"}</div>
          <div>Toggled: {toggled ? "yes" : "no"}</div>
          <button onClick={handleToggle}>Toggle Real-time</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    expect(screen.getByText("Real-time: enabled")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Toggle Real-time"));

    await waitFor(() => {
      expect(screen.getByText(/Real-time: disabled/)).toBeInTheDocument();
      expect(screen.getByText("Toggled: yes")).toBeInTheDocument();
    });
  });

  it("updates refresh interval", async () => {
    function TestComponent() {
      const { refreshInterval, updateRefreshInterval } = useAnalytics();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = () => {
        updateRefreshInterval(60000);
        setUpdated(true);
      };

      return (
        <div>
          <div>Interval: {refreshInterval}ms</div>
          <div>Updated: {updated ? "yes" : "no"}</div>
          <button onClick={handleUpdate}>Update Interval</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    expect(screen.getByText("Interval: 30000ms")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Update Interval"));

    await waitFor(() => {
      expect(screen.getByText(/Interval: 60000/)).toBeInTheDocument();
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });
  });
});

describe("AnalyticsEngine Performance", () => {
  it("disables animations in low performance mode", async () => {
    vi.doMock("../../adaptive/UI-Performance-Engine.tsx", () => ({
      usePerformance: vi.fn(() => ({
        isLowPerformanceMode: true,
      })),
    }));

    function TestComponent() {
      const { dashboards } = useAnalytics();
      const dashboard = dashboards[0];

      return (
        <div>
          <div>
            Animation:{" "}
            {dashboard?.widgets[0]?.config?.animation ? "enabled" : "disabled"}
          </div>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("Animation: disabled")).toBeInTheDocument();
    });
  });

  it("adapts to user experience mode", async () => {
    vi.doMock("../../adaptive/UserExperienceMode.tsx", () => ({
      useUserExperienceMode: vi.fn(() => ({
        currentMode: {
          id: "minimal",
          name: "Minimal",
          animations: "minimal",
          sounds: false,
          shortcuts: false,
        },
      })),
    }));

    function TestComponent() {
      const { dashboards } = useAnalytics();
      const dashboard = dashboards[0];

      return (
        <div>
          <div>
            Interactive:{" "}
            {dashboard?.widgets[0]?.config?.interactive
              ? "enabled"
              : "disabled"}
          </div>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("Interactive: disabled")).toBeInTheDocument();
    });
  });
});

describe("AnalyticsEngine Higher-Order Components", () => {
  it("withAnalytics wraps component correctly", () => {
    const TestComponent = React.forwardRef<HTMLDivElement>((props, ref) => (
      <div ref={ref}>Wrapped Component</div>
    ));
    TestComponent.displayName = "TestComponent";

    const WrappedComponent = withAnalytics(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText("Wrapped Component")).toBeInTheDocument();
  });

  it("AnalyticsProvider alias works", () => {
    render(
      <AnalyticsProvider>
        <div>Provider Test</div>
      </AnalyticsProvider>,
    );

    expect(screen.getByText("Provider Test")).toBeInTheDocument();
  });
});

describe("AnalyticsEngine Error Handling", () => {
  it("handles useAnalytics outside provider", () => {
    function TestComponent() {
      expect(() => {
        useAnalytics();
      }).toThrow("useAnalytics must be used within AnalyticsEngine");
      return <div>Test</div>;
    }

    render(<TestComponent />);
  });

  it("handles report generation errors gracefully", async () => {
    function TestComponent() {
      const { generateReport } = useAnalytics();
      const [error, setError] = React.useState<string | null>(null);

      const handleGenerateReport = async () => {
        try {
          await generateReport("test-report", "financial", {});
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error || "none"}</div>
          <button onClick={handleGenerateReport}>Generate Report</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <TestComponent />
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(
      () => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
