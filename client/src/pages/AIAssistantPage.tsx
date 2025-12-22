import * as React from "react";

import AIPoweredAssistant from "@/components/automation/AIPoweredAssistant";

const AIAssistantPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Guided workflows, automation, and intelligent recommendations.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <AIPoweredAssistant />
      </div>
    </div>
  );
};

export default AIAssistantPage;
