import React from "react";
import { useAuth } from "../contexts/AuthContext.js";
import { DashboardShell } from "../components/ui/layout/DashboardShell.js";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-8">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to AccuBooks Dashboard
          </h1>
          {user && (
            <div className="mb-6">
              <p className="text-lg text-black/70">Hello, {user.name}!</p>
              <p className="text-sm text-black/70 opacity-80">
                Email: {user.email}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-2">Accounts</h3>
              <p className="text-black/70">Manage your chart of accounts</p>
            </div>

            <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-2">Transactions</h3>
              <p className="text-black/70">Create and view transactions</p>
            </div>

            <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-2">Reports</h3>
              <p className="text-black/70">Generate financial reports</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default DashboardPage;
