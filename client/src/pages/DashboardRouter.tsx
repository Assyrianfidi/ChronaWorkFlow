import React from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { useAuth } from '../contexts/AuthContext.js.js';
import {
  AdminDashboard,
  ManagerDashboard,
  UserDashboard,
  AuditorDashboard,
  InventoryDashboard,
} from './dashboards.js.js';

// @ts-ignore
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-surface1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 md:p-8 text-center">
          <p className="text-sm font-medium tracking-wide uppercase mb-2">
            Preparing your dashboard
          </p>
          <p className="text-sm opacity-80">Loading... Please wait.</p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "MANAGER":
      return <ManagerDashboard />;
    case "USER":
      return <UserDashboard />;
    case "AUDITOR":
      return <AuditorDashboard />;
    case "INVENTORY_MANAGER":
      return <InventoryDashboard />;
    default:
      return <UserDashboard />;
  }
};

export default DashboardRouter;
