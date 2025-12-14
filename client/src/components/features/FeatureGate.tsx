import * as React from "react";

import { FeatureKey, useIsFeatureEnabled } from "@/lib/features";

type FeatureGateProps = {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const { enabled, isLoading } = useIsFeatureEnabled(feature);

  if (isLoading) {
    return null;
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
}
