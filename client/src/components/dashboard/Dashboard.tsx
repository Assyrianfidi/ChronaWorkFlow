import React from "react";
import { useDashboard } from '../../contexts/DashboardContext.js';
import { CFODashboard } from './CFODashboard.js';
import { ControllerDashboard } from './ControllerDashboard.js';
import { ProjectManagerDashboard } from './ProjectManagerDashboard.js';
import { AccountantDashboard } from './AccountantDashboard.js';

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
