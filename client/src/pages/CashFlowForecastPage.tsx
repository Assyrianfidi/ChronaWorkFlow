import * as React from "react";

import { CashFlowForecast } from "@/components/ai";

const CashFlowForecastPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Cash Flow Forecast
        </h1>
        <p className="text-sm text-muted-foreground">
          30-day projections with risk assessment and actionable recommendations.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <div className="p-6">
          <CashFlowForecast />
        </div>
      </div>
    </div>
  );
};

export default CashFlowForecastPage;
