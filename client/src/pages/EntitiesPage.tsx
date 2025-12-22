import * as React from "react";

import MultiEntityDashboard from "@/components/entities/MultiEntityDashboard";

const EntitiesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Entities</h1>
        <p className="text-sm text-muted-foreground">
          Manage and report across your business entities.
        </p>
      </div>
      <MultiEntityDashboard />
    </div>
  );
};

export default EntitiesPage;
