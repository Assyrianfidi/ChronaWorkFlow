import * as React from "react";

import { AnomalyAlerts } from "@/components/anomalies";

const AnomaliesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Anomalies</h1>
        <p className="text-sm text-muted-foreground">
          Review AI-detected anomalies, duplicates, and unusual transactions.
        </p>
      </div>
      <AnomalyAlerts />
    </div>
  );
};

export default AnomaliesPage;
