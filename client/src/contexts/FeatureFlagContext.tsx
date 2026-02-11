/**
 * Feature Flag Context Provider
 * Provides feature flag access throughout the application
 */

import React, { createContext, useContext, ReactNode } from "react";
import {
  FeatureFlagKey,
  FeatureFlag,
  isFeatureEnabled,
  getAllFeatureFlags,
  setFeatureFlagOverride,
  clearFeatureFlagOverrides,
} from "@/config/featureFlags";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureFlagContextType {
  isEnabled: (key: FeatureFlagKey) => boolean;
  getAllFlags: () => FeatureFlag[];
  setOverride: (key: FeatureFlagKey, enabled: boolean) => void;
  clearOverrides: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(
  undefined,
);

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const { user } = useAuth();

  const isEnabled = (key: FeatureFlagKey): boolean => {
    return isFeatureEnabled(key, user?.role);
  };

  const getAllFlags = (): FeatureFlag[] => {
    return getAllFeatureFlags();
  };

  const setOverride = (key: FeatureFlagKey, enabled: boolean): void => {
    setFeatureFlagOverride(key, enabled);
    // Force re-render by updating a dummy state or using window.location.reload()
    // For now, we'll just log it - the next component mount will pick up the change
  };

  const clearOverrides = (): void => {
    clearFeatureFlagOverrides();
  };

  const value: FeatureFlagContextType = {
    isEnabled,
    getAllFlags,
    setOverride,
    clearOverrides,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagProvider",
    );
  }
  return context;
}

// Convenience hook for checking a single flag
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}

// HOC for feature-gated components
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: FeatureFlagKey,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function FeatureGatedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey);

    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <Component {...props} />;
  };
}

// Component for conditional rendering based on feature flags
interface FeatureGateProps {
  flag: FeatureFlagKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
