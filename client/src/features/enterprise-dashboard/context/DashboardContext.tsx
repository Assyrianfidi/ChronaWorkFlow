import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type DashboardView = "overview" | "analytics" | "workflows" | "reports";

interface Kpi {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  target?: number;
  format?: "currency" | "number" | "percent";
  chartData?: Array<{ date: string; value: number }>;
}

interface DashboardConfig {
  kpis: Kpi[];
  widgets: any[];
  layout: any;
  lastUpdated: string;
}

interface DashboardContextType {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  selectedKpi: string | null;
  setSelectedKpi: (kpiId: string | null) => void;
  config: DashboardConfig | null;
  loading: boolean;
  error: Error | null;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

// Mock data - in a real app, this would be fetched from an API
const mockKpis: Kpi[] = [
  {
    id: "revenue",
    title: "Total Revenue",
    value: 1250000,
    change: 12.5,
    format: "currency",
  },
  {
    id: "expenses",
    title: "Total Expenses",
    value: 785000,
    change: -3.2,
    format: "currency",
  },
  {
    id: "profit-margin",
    title: "Profit Margin",
    value: 37.2,
    change: 2.1,
    format: "percent",
  },
  {
    id: "invoices-outstanding",
    title: "Invoices Outstanding",
    value: 42,
    change: -5.6,
    format: "number",
  },
];

// @ts-ignore
export const DashboardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeView, setActiveView] = useState<DashboardView>("overview");
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardConfig = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setConfig({
        kpis: mockKpis,
        widgets: [],
        layout: {},
        lastUpdated: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load dashboard"),
      );
      console.error("Error fetching dashboard config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardConfig();
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedKpi,
        setSelectedKpi,
        config,
        loading,
        error,
        refreshDashboard: fetchDashboardConfig,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
