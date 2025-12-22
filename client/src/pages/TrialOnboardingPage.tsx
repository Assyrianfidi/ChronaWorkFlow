import * as React from "react";

import TrialOnboarding from "@/components/onboarding/TrialOnboarding";

const TrialOnboardingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Trial</h1>
        <p className="text-sm text-muted-foreground">
          Complete activation milestones and track your trial progress.
        </p>
      </div>
      <TrialOnboarding />
    </div>
  );
};

export default TrialOnboardingPage;
