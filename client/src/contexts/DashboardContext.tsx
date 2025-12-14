import React, { createContext, useContext, useState, ReactNode } from "react";

type DashboardRole = "cfo" | "controller" | "project_manager" | "accountant";

interface DashboardConfig {
  role: DashboardRole;
  widgets: string[]; // IDs of widgets
  layout: any; // TODO: Define layout type
}

interface DashboardContextType {
  config: DashboardConfig;
  setConfig: (config: DashboardConfig) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

interface DashboardProviderProps {
  children: ReactNode;
  initialRole: DashboardRole;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  initialRole,
}) => {
  const [config, setConfig] = useState<DashboardConfig>({
    role: initialRole,
    widgets: [],
    layout: {},
  });

  return (
    <DashboardContext.Provider value={{ config, setConfig }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
