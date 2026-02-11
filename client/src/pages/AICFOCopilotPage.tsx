import * as React from "react";

import { AICFOCopilot } from "@/components/ai";

const AICFOCopilotPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          AI CFO Copilot
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your business performance and get data-driven
          answers.
        </p>
      </div>
      <div className="card">
        <div className="card-content">
          <AICFOCopilot />
        </div>
      </div>
    </div>
  );
};

export default AICFOCopilotPage;
