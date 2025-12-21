import React from "react";

const CFODashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-foreground">CFO Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-border rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                CFO Dashboard
              </h2>
              <p className="mt-2 text-muted-foreground">
                Role-specific dashboard content
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CFODashboard;
