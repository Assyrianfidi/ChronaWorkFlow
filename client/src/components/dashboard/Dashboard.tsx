import React from "react";
import { useDashboard } from "../../contexts/DashboardContext";
import { CFODashboard } from "./CFODashboard";
import { ControllerDashboard } from "./ControllerDashboard";
import { ProjectManagerDashboard } from "./ProjectManagerDashboard";
import { AccountantDashboard } from "./AccountantDashboard";

export const Dashboard = () => {
  const { config } = useDashboard();

  switch (config.role) {
    case "cfo":
      return <CFODashboard />;
    case "controller":
      return <ControllerDashboard />;
    case "project_manager":
      return <ProjectManagerDashboard />;
    case "accountant":
      return <AccountantDashboard />;
    default:
      return <div>No dashboard available for this role.</div>;
  }
};
