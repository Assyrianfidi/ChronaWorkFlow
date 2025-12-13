import * as React from "react";
import { Navigate } from "react-router-dom";

import { FeatureKey, useIsFeatureEnabled } from "@/lib/features";

type FeatureRouteProps = {
  feature: FeatureKey;
  children: React.ReactNode;
};

export function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const { enabled, isLoading } = useIsFeatureEnabled(feature);

  if (isLoading) {
    return null;
  }

  if (!enabled) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
