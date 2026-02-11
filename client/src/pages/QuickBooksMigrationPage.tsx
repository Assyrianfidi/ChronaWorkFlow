import * as React from "react";

import QuickBooksMigration from "@/components/quickbooks/QuickBooksMigration";

const QuickBooksMigrationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          QuickBooks Migration
        </h1>
        <p className="text-sm text-muted-foreground">
          Import QBO/IIF exports and auto-categorize transactions with AI.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <QuickBooksMigration />
      </div>
    </div>
  );
};

export default QuickBooksMigrationPage;
