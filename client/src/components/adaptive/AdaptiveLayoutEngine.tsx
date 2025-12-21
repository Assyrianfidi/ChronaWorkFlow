import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

interface AdaptiveLayoutConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  layouts: {
    compact: boolean;
    sidebarCollapsed: boolean;
    topNavigation: boolean;
    cardDensity: "comfortable" | "compact" | "spacious";
    animationsEnabled: boolean;
  };
}

interface AdaptiveContextType {
  config: AdaptiveLayoutConfig;
  updateConfig: (updates: Partial<AdaptiveLayoutConfig>) => void;
  currentBreakpoint: keyof AdaptiveLayoutConfig["breakpoints"];
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenOrientation: "portrait" | "landscape";
}

const AdaptiveContext = React.createContext<AdaptiveContextType | null>(null);

const defaultConfig: AdaptiveLayoutConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    wide: 1536,
  },
  layouts: {
    compact: false,
    sidebarCollapsed: false,
    topNavigation: false,
    cardDensity: "comfortable",
    animationsEnabled: true,
  },
};

export function AdaptiveLayoutEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, height } = useWindowSize();
  const { user } = useAuthStore();
  const [config, setConfig] = useState<AdaptiveLayoutConfig>(defaultConfig);

  // Determine current breakpoint
  const currentBreakpoint = useMemo(() => {
    if (width < config.breakpoints.mobile) return "mobile";
    if (width < config.breakpoints.tablet) return "tablet";
    if (width < config.breakpoints.desktop) return "desktop";
    return "wide";
  }, [width, config.breakpoints]);

  // Device detection
  const isMobile = currentBreakpoint === "mobile";
  const isTablet = currentBreakpoint === "tablet";
  const isDesktop =
    currentBreakpoint === "desktop" || currentBreakpoint === "wide";

  // Screen orientation
  const screenOrientation = useMemo(() => {
    return width > height ? "landscape" : "portrait";
  }, [width, height]);

  // Adaptive layout adjustments based on screen size and user role
  useEffect(() => {
    const newConfig = { ...config };

    // Mobile adaptations
    if (isMobile) {
      newConfig.layouts.sidebarCollapsed = true;
      newConfig.layouts.topNavigation = true;
      newConfig.layouts.compact = true;
      newConfig.layouts.cardDensity = "compact";
      newConfig.layouts.animationsEnabled = false; // Reduce animations on mobile for performance
    }
    // Tablet adaptations
    else if (isTablet) {
      newConfig.layouts.sidebarCollapsed = false;
      newConfig.layouts.topNavigation = false;
      newConfig.layouts.compact = false;
      newConfig.layouts.cardDensity = "comfortable";
      newConfig.layouts.animationsEnabled = true;
    }
    // Desktop adaptations
    else {
      newConfig.layouts.sidebarCollapsed = false;
      newConfig.layouts.topNavigation = false;
      newConfig.layouts.compact = false;
      newConfig.layouts.cardDensity = "spacious";
      newConfig.layouts.animationsEnabled = true;
    }

    // User role-based adaptations
    if (user?.role === "admin") {
      newConfig.layouts.compact = false; // Admins get full interface
    } else if (user?.role === "viewer") {
      newConfig.layouts.compact = true; // Viewers get simplified interface
    }

    // Performance-based adaptations
    const isLowEndDevice =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (isLowEndDevice) {
      newConfig.layouts.animationsEnabled = false;
      newConfig.layouts.cardDensity = "compact";
    }

    setConfig(newConfig);
  }, [isMobile, isTablet, isDesktop, user?.role]);

  // Update config method
  const updateConfig = useCallback((updates: Partial<AdaptiveLayoutConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const contextValue: AdaptiveContextType = {
    config,
    updateConfig,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    screenOrientation,
  };

  return (
    <AdaptiveContext.Provider value={contextValue}>
      <div
        className={cn(
          "adaptive-layout",
          `breakpoint-${currentBreakpoint}`,
          `density-${config.layouts.cardDensity}`,
          {
            "compact-layout": config.layouts.compact,
            "sidebar-collapsed": config.layouts.sidebarCollapsed,
            "top-nav": config.layouts.topNavigation,
            "animations-disabled": !config.layouts.animationsEnabled,
            "orientation-portrait": screenOrientation === "portrait",
            "orientation-landscape": screenOrientation === "landscape",
          },
        )}
      >
        {children}
      </div>
    </AdaptiveContext.Provider>
  );
}

export function useAdaptiveLayout() {
  const context = React.useContext(AdaptiveContext);
  if (!context) {
    throw new Error(
      "useAdaptiveLayout must be used within AdaptiveLayoutEngine",
    );
  }
  return context;
}

// Adaptive grid system component
export function AdaptiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = { mobile: 2, tablet: 4, desktop: 6, wide: 8 },
  className,
}: {
  children: React.ReactNode;
  cols?: Partial<Record<keyof AdaptiveLayoutConfig["breakpoints"], number>>;
  gap?: Partial<Record<keyof AdaptiveLayoutConfig["breakpoints"], number>>;
  className?: string;
}) {
  const { currentBreakpoint, config } = useAdaptiveLayout();

  const currentCols = cols[currentBreakpoint] || cols.desktop || 3;
  const currentGap = gap[currentBreakpoint] || gap.desktop || 6;

  return (
    <div
      className={cn(
        "grid",
        `grid-cols-${currentCols}`,
        `gap-${currentGap}`,
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
        gap: `${currentGap * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
}

// Adaptive container component
export function AdaptiveContainer({
  children,
  maxWidth = true,
  padding = true,
  className,
}: {
  children: React.ReactNode;
  maxWidth?: boolean;
  padding?: boolean;
  className?: string;
}) {
  const { currentBreakpoint } = useAdaptiveLayout();

  const maxPadding = {
    mobile: "px-4",
    tablet: "px-6",
    desktop: "px-8",
    wide: "px-12",
  };

  return (
    <div
      className={cn(
        "adaptive-container",
        maxWidth && "max-w-7xl mx-auto",
        padding && maxPadding[currentBreakpoint],
        className,
      )}
    >
      {children}
    </div>
  );
}

// Adaptive text component
export function AdaptiveText({
  children,
  variant = "body",
  className,
}: {
  children: React.ReactNode;
  variant?: "heading" | "subheading" | "body" | "caption";
  className?: string;
}) {
  const { currentBreakpoint, config } = useAdaptiveLayout();

  const textSizes = {
    heading: {
      mobile: "text-2xl",
      tablet: "text-3xl",
      desktop: "text-4xl",
      wide: "text-5xl",
    },
    subheading: {
      mobile: "text-lg",
      tablet: "text-xl",
      desktop: "text-2xl",
      wide: "text-3xl",
    },
    body: {
      mobile: "text-sm",
      tablet: "text-base",
      desktop: "text-base",
      wide: "text-lg",
    },
    caption: {
      mobile: "text-xs",
      tablet: "text-sm",
      desktop: "text-sm",
      wide: "text-base",
    },
  };

  return (
    <span
      className={cn(
        "adaptive-text",
        textSizes[variant][currentBreakpoint],
        config.layouts.compact && "text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default AdaptiveLayoutEngine;
