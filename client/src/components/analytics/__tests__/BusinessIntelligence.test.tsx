import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  BusinessIntelligence,
  useBusinessIntelligence,
  KPIDashboard,
  GoalsTracker,
} from '../BusinessIntelligence.js.js';
// @ts-ignore
import { AnalyticsEngine } from '../AnalyticsEngine.js.js';

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

describe("BusinessIntelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithBI = (component: React.ReactElement) => {
    return render(
      <AnalyticsEngine>
        <BusinessIntelligence>{component}</BusinessIntelligence>
      </AnalyticsEngine>,
    );
  };

  it("renders children correctly", () => {
    renderWithBI(<div>Test Content</div>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("provides BI context", () => {
    let contextValue: any = null;

    function TestComponent() {
      contextValue = useBusinessIntelligence();
      return <div>Test</div>;
    }

    renderWithBI(<TestComponent />);

    expect(contextValue).toBeDefined();
    expect(contextValue.kpis).toEqual([]);
    expect(contextValue.goals).toEqual([]);
    expect(contextValue.performanceScores).toEqual([]);
    expect(contextValue.forecasts).toEqual([]);
    expect(contextValue.benchmarks).toEqual([]);
    expect(contextValue.strategicInsights).toEqual([]);
  });

  it("initializes default KPIs", async () => {
    function TestComponent() {
      const { kpis } = useBusinessIntelligence();
      return <div>KPIs: {kpis.length}</div>;
    }

    renderWithBI(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("KPIs: 4")).toBeInTheDocument();
    });
  });

  it("initializes default goals", async () => {
    function TestComponent() {
      const { goals } = useBusinessIntelligence();
      return <div>Goals: {goals.length}</div>;
    }

    renderWithBI(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Goals: 2")).toBeInTheDocument();
    });
  });

  it("creates new KPI", async () => {
    function TestComponent() {
      const { kpis, createKPI } = useBusinessIntelligence();
      const [created, setCreated] = React.useState(false);

      const handleCreate = () => {
        createKPI({
          name: "Test KPI",
          value: 100,
          target: 120,
          unit: "units",
          trend: "up",
          status: "good",
          category: "financial",
        });
        setCreated(true);
      };

      return (
        <div>
          <div>KPIs: {kpis.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create KPI</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    expect(screen.getByText("KPIs: 4")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create KPI"));

    await waitFor(() => {
      expect(screen.getByText("KPIs: 5")).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("updates existing KPI", async () => {
    function TestComponent() {
      const { kpis, updateKPI } = useBusinessIntelligence();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = () => {
        const firstKPI = kpis[0];
        if (firstKPI) {
          updateKPI(firstKPI.id, 150);
          setUpdated(true);
        }
      };

      return (
        <div>
          <div>First KPI Value: {kpis[0]?.value || 0}</div>
          <div>Updated: {updated ? "yes" : "no"}</div>
          <button onClick={handleUpdate}>Update KPI</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Update KPI"));

    await waitFor(() => {
      expect(screen.getByText("First KPI Value: 150")).toBeInTheDocument();
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });
  });

  it("creates new goal", async () => {
    function TestComponent() {
      const { goals, createGoal } = useBusinessIntelligence();
      const [created, setCreated] = React.useState(false);

      const handleCreate = () => {
        createGoal({
          name: "Test Goal",
          description: "Test description",
          targetValue: 1000,
          currentValue: 500,
          unit: "USD",
          deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
          owner: "Test Team",
          kpis: ["revenue-growth"],
        });
        setCreated(true);
      };

      return (
        <div>
          <div>Goals: {goals.length}</div>
          <div>Created: {created ? "yes" : "no"}</div>
          <button onClick={handleCreate}>Create Goal</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    expect(screen.getByText("Goals: 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create Goal"));

    await waitFor(() => {
      expect(screen.getByText("Goals: 3")).toBeInTheDocument();
      expect(screen.getByText("Created: yes")).toBeInTheDocument();
    });
  });

  it("updates goal progress", async () => {
    function TestComponent() {
      const { goals, updateGoalProgress } = useBusinessIntelligence();
      const [updated, setUpdated] = React.useState(false);

      const handleUpdate = () => {
        const firstGoal = goals[0];
        if (firstGoal) {
          updateGoalProgress(firstGoal.id, 1800000);
          setUpdated(true);
        }
      };

      return (
        <div>
          <div>First Goal Progress: {goals[0]?.progress || 0}%</div>
          <div>Updated: {updated ? "yes" : "no"}</div>
          <button onClick={handleUpdate}>Update Progress</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Update Progress"));

    await waitFor(() => {
      expect(screen.getByText("First Goal Progress: 90%")).toBeInTheDocument();
      expect(screen.getByText("Updated: yes")).toBeInTheDocument();
    });
  });

  it("calculates performance scores", async () => {
    function TestComponent() {
      const { performanceScores, calculatePerformanceScores } =
        useBusinessIntelligence();
      const [calculated, setCalculated] = React.useState(false);

      const handleCalculate = () => {
        calculatePerformanceScores();
        setCalculated(true);
      };

      return (
        <div>
          <div>Performance Scores: {performanceScores.length}</div>
          <div>Calculated: {calculated ? "yes" : "no"}</div>
          <button onClick={handleCalculate}>Calculate Scores</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Calculate Scores"));

    await waitFor(() => {
      expect(screen.getByText("Performance Scores: 3")).toBeInTheDocument();
      expect(screen.getByText("Calculated: yes")).toBeInTheDocument();
    });
  });

  it("generates forecast", async () => {
    function TestComponent() {
      const { forecasts, generateForecast } = useBusinessIntelligence();
      const [forecasted, setForecasted] = React.useState(false);

      const handleForecast = async () => {
        await generateForecast("revenue", 12);
        setForecasted(true);
      };

      return (
        <div>
          <div>Forecasts: {forecasts.length}</div>
          <div>Forecasted: {forecasted ? "yes" : "no"}</div>
          <button onClick={handleForecast}>Generate Forecast</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Generate Forecast"));

    await waitFor(() => {
      expect(screen.getByText("Forecasts: 1")).toBeInTheDocument();
      expect(screen.getByText("Forecasted: yes")).toBeInTheDocument();
    });
  });

  it("loads benchmarks", async () => {
    function TestComponent() {
      const { benchmarks, loadBenchmarks } = useBusinessIntelligence();
      const [loaded, setLoaded] = React.useState(false);

      const handleLoad = async () => {
        await loadBenchmarks("technology");
        setLoaded(true);
      };

      return (
        <div>
          <div>Benchmarks: {benchmarks.length}</div>
          <div>Loaded: {loaded ? "yes" : "no"}</div>
          <button onClick={handleLoad}>Load Benchmarks</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Load Benchmarks"));

    await waitFor(() => {
      expect(screen.getByText("Benchmarks: 1")).toBeInTheDocument();
      expect(screen.getByText("Loaded: yes")).toBeInTheDocument();
    });
  });

  it("generates strategic insights", async () => {
    function TestComponent() {
      const { strategicInsights, generateStrategicInsights } =
        useBusinessIntelligence();
      const [generated, setGenerated] = React.useState(false);

      const handleGenerate = async () => {
        await generateStrategicInsights();
        setGenerated(true);
      };

      return (
        <div>
          <div>Insights: {strategicInsights.length}</div>
          <div>Generated: {generated ? "yes" : "no"}</div>
          <button onClick={handleGenerate}>Generate Insights</button>
        </div>
      );
    }

    renderWithBI(<TestComponent />);

    fireEvent.click(screen.getByText("Generate Insights"));

    await waitFor(() => {
      expect(screen.getByText("Insights: 2")).toBeInTheDocument();
      expect(screen.getByText("Generated: yes")).toBeInTheDocument();
    });
  });
});

describe("KPIDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderKPIDashboard = () => {
    return render(
      <AnalyticsEngine>
        <BusinessIntelligence>
          <KPIDashboard />
        </BusinessIntelligence>
      </AnalyticsEngine>,
    );
  };

  it("renders KPI dashboard", async () => {
    renderKPIDashboard();

    await waitFor(() => {
      expect(screen.getByText("Revenue Growth Rate")).toBeInTheDocument();
      expect(screen.getByText("Customer Satisfaction")).toBeInTheDocument();
      expect(screen.getByText("Operational Efficiency")).toBeInTheDocument();
      expect(screen.getByText("Market Share")).toBeInTheDocument();
    });
  });

  it("displays KPI values and trends", async () => {
    renderKPIDashboard();

    await waitFor(() => {
      // Check for trend icons and values
      expect(screen.getByText(/15\.2/)).toBeInTheDocument(); // Revenue growth value
      expect(screen.getByText("Target: 20 %")).toBeInTheDocument(); // Revenue growth target
    });
  });

  it("shows progress bars for KPIs", async () => {
    renderKPIDashboard();

    await waitFor(() => {
      // Check for progress bars (should have role progressbar or similar)
      const progressBars = document.querySelectorAll(
        '[role="progressbar"], .bg-gray-200',
      );
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it("applies correct status colors", async () => {
    renderKPIDashboard();

    await waitFor(() => {
      // Check for status color classes
      const statusElements = document.querySelectorAll(
        ".text-yellow-600, .text-green-600, .text-red-600",
      );
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it("displays trend icons", async () => {
    renderKPIDashboard();

    await waitFor(() => {
      // Check for trend indicators (should contain trend icons)
      const trendIcons = document.querySelectorAll(
        '[class*="trend"], [class*="arrow"]',
      );
      expect(trendIcons.length).toBeGreaterThan(0);
    });
  });
});

describe("GoalsTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderGoalsTracker = () => {
    return render(
      <AnalyticsEngine>
        <BusinessIntelligence>
          <GoalsTracker />
        </BusinessIntelligence>
      </AnalyticsEngine>,
    );
  };

  it("renders goals tracker", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      expect(screen.getByText("Business Goals")).toBeInTheDocument();
      expect(screen.getByText("Q4 Revenue Target")).toBeInTheDocument();
      expect(screen.getByText("Customer Retention")).toBeInTheDocument();
    });
  });

  it("displays goal details", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      expect(screen.getByText("Achieve $2M revenue in Q4")).toBeInTheDocument();
      expect(
        screen.getByText("Maintain 95% customer retention rate"),
      ).toBeInTheDocument();
      expect(screen.getByText("Owner: Sales Team")).toBeInTheDocument();
      expect(screen.getByText("Owner: Customer Success")).toBeInTheDocument();
    });
  });

  it("shows progress percentages", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      expect(screen.getByText("82.5%")).toBeInTheDocument(); // Q4 revenue progress
      expect(screen.getByText("96.8%")).toBeInTheDocument(); // Customer retention progress
    });
  });

  it("displays goal status badges", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      expect(screen.getByText("on track")).toBeInTheDocument();
      expect(screen.getByText("at risk")).toBeInTheDocument();
    });
  });

  it("shows deadlines", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      // Check for deadline information
      const deadlineElements = screen.getAllByText(/Deadline:/);
      expect(deadlineElements.length).toBeGreaterThan(0);
    });
  });

  it("applies correct status colors to goals", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      // Check for status color classes on goals
      const statusElements = document.querySelectorAll(
        ".bg-green-100, .bg-yellow-100, .bg-red-100, .bg-blue-100",
      );
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it("displays current vs target values", async () => {
    renderGoalsTracker();

    await waitFor(() => {
      expect(screen.getByText(/1,650,000 \/ 2,000,000/)).toBeInTheDocument(); // Revenue goal
      expect(screen.getByText(/92 \/ 95/)).toBeInTheDocument(); // Customer retention goal
    });
  });
});

describe("BusinessIntelligence Integration", () => {
  it("integrates with analytics context", async () => {
    function TestComponent() {
      const { kpis, goals } = useBusinessIntelligence();

      return (
        <div>
          <div>KPIs: {kpis.length}</div>
          <div>Goals: {goals.length}</div>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <BusinessIntelligence>
          <TestComponent />
        </BusinessIntelligence>
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("KPIs: 4")).toBeInTheDocument();
      expect(screen.getByText("Goals: 2")).toBeInTheDocument();
    });
  });

  it("updates KPIs based on analytics metrics", async () => {
    // Mock analytics metrics to trigger KPI updates
    vi.doMock("../AnalyticsEngine", async () => {
      const actual = await vi.importActual("../AnalyticsEngine");
      return {
        ...actual,
        useAnalytics: () => ({
          metrics: [
            { id: "revenue-growth", value: 25.5, category: "financial" },
            { id: "customer-satisfaction", value: 4.7, category: "customer" },
          ],
          reports: [],
          dashboards: [],
          insights: [],
          isRealTimeEnabled: true,
          refreshInterval: 30000,
          generateReport: vi.fn(),
          createDashboard: vi.fn(),
          addVisualization: vi.fn(),
          updateMetrics: vi.fn(),
          analyzeTrends: vi.fn(),
          detectAnomalies: vi.fn(),
          generateForecast: vi.fn(),
          updateRefreshInterval: vi.fn(),
          toggleRealTime: vi.fn(),
        }),
      };
    });

    function TestComponent() {
      const { kpis } = useBusinessIntelligence();
      const revenueKPI = kpis.find((k) => k.id === "revenue-growth");

      return (
        <div>
          <div>Revenue KPI Value: {revenueKPI?.value || 0}</div>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <BusinessIntelligence>
          <TestComponent />
        </BusinessIntelligence>
      </AnalyticsEngine>,
    );

    await waitFor(() => {
      expect(screen.getByText("Revenue KPI Value: 25.5")).toBeInTheDocument();
    });
  });

  it("handles useBusinessIntelligence outside provider", () => {
    function TestComponent() {
      expect(() => {
        useBusinessIntelligence();
      }).toThrow(
        "useBusinessIntelligence must be used within BusinessIntelligence",
      );
      return <div>Test</div>;
    }

    render(<TestComponent />);
  });

  it("handles forecast generation errors gracefully", async () => {
    function TestComponent() {
      const { generateForecast, forecasts } = useBusinessIntelligence();
      const [error, setError] = React.useState<string>("");

      const handleForecast = async () => {
        try {
          await generateForecast("revenue", 12);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      };

      return (
        <div>
          <div>Error: {error}</div>
          <div>Forecasts: {forecasts.length}</div>
          <button onClick={handleForecast}>Generate Forecast</button>
        </div>
      );
    }

    render(
      <AnalyticsEngine>
        <BusinessIntelligence>
          <TestComponent />
        </BusinessIntelligence>
      </AnalyticsEngine>,
    );

    fireEvent.click(screen.getByText("Generate Forecast"));

    // Should handle gracefully without crashing
    await waitFor(
      () => {
        expect(screen.getByText("Forecasts: 1")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
