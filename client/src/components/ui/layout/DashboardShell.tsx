import * as React from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar } from "./Sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-surface0">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
        activePath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto p-6"
      >
        {children}
      </main>
    </div>
  );
}
