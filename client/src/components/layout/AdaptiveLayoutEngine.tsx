/**
 * Adaptive Layout Engine
 * Dynamically adjusts layout based on user experience mode and context
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  UIAdaptationConfig,
  TaskType,
} from '../../state/ui/UserExperienceMode.js.js';

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  config: UIAdaptationConfig;
  taskType?: TaskType;
  className?: string;
}

interface LayoutSection {
  id: string;
  component: React.ReactNode;
  priority: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  minWidth?: number;
  maxWidth?: number;
  flex?: string;
}

// @ts-ignore
export const AdaptiveLayoutEngine: React.FC<AdaptiveLayoutProps> = ({
  children,
  config,
  taskType,
  className = "",
}) => {
  const [layoutSections, setLayoutSections] = useState<LayoutSection[]>([]);
  const [activeSections, setActiveSections] = useState<Set<string>>(new Set());

  // Calculate layout based on mode and density
  const layoutConfig = useMemo(() => {
    const baseLayout = {
      display: "grid",
      gap:
        config.density === "compact"
          ? "0.5rem"
          : config.density === "comfortable"
            ? "1rem"
            : "1.5rem",
      padding:
        config.density === "compact"
          ? "0.5rem"
          : config.density === "comfortable"
            ? "1rem"
            : "1.5rem",
    };

    switch (config.mode) {
      case "guided":
        return {
          ...baseLayout,
          gridTemplateColumns: "1fr",
          maxWidth: "800px",
          margin: "0 auto",
        };
      case "efficient":
        return {
          ...baseLayout,
          gridTemplateColumns: config.features.multiPanelLayout
            ? "1fr 2fr"
            : "1fr",
        };
      case "power":
        return {
          ...baseLayout,
          gridTemplateColumns: config.features.multiPanelLayout
            ? "200px 1fr 300px"
            : "1fr 2fr",
        };
      default:
        return baseLayout;
    }
  }, [config.mode, config.density, config.features.multiPanelLayout]);

  // Auto-collapse sections based on user preferences
  useEffect(() => {
    const sections = new Set<string>();

    // In guided mode, show all sections
    if (config.mode === "guided") {
      layoutSections.forEach((section) => sections.add(section.id));
    }
    // In efficient mode, auto-collapse low-priority sections
    else if (config.mode === "efficient") {
      layoutSections
        .filter((section) => section.priority > 3)
        .forEach((section) => sections.add(section.id));
    }
    // In power mode, show only high-priority sections by default
    else if (config.mode === "power") {
      layoutSections
        .filter((section) => section.priority <= 2)
        .forEach((section) => sections.add(section.id));
    }

    setActiveSections(sections);
  }, [config.mode, layoutSections]);

  const registerSection = (section: LayoutSection) => {
    setLayoutSections((prev) => {
      const existing = prev.findIndex((s) => s.id === section.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = section;
        return updated;
      }
      return [...prev, section].sort((a, b) => a.priority - b.priority);
    });
  };

  const toggleSection = (sectionId: string) => {
    setActiveSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const contextValue = {
    config,
    layoutConfig,
    registerSection,
    toggleSection,
    activeSections,
    taskType,
  };

  return (
    <AdaptiveLayoutContext.Provider value={contextValue}>
      <div className={`adaptive-layout ${className}`} style={layoutConfig}>
        {children}
      </div>
    </AdaptiveLayoutContext.Provider>
  );
};

interface AdaptiveLayoutContextType {
  config: UIAdaptationConfig;
  layoutConfig: React.CSSProperties;
  registerSection: (section: LayoutSection) => void;
  toggleSection: (sectionId: string) => void;
  activeSections: Set<string>;
  taskType?: TaskType;
}

const AdaptiveLayoutContext =
  React.createContext<AdaptiveLayoutContextType | null>(null);

export const useAdaptiveLayout = () => {
  const context = React.useContext(AdaptiveLayoutContext);
  if (!context) {
    throw new Error(
      "useAdaptiveLayout must be used within AdaptiveLayoutEngine",
    );
  }
  return context;
};

// Adaptive Section Component
interface AdaptiveSectionProps {
  id: string;
  children: React.ReactNode;
  priority?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  minWidth?: number;
  maxWidth?: number;
  flex?: string;
  className?: string;
}

// @ts-ignore
export const AdaptiveSection: React.FC<AdaptiveSectionProps> = ({
  id,
  children,
  priority = 5,
  collapsible = false,
  defaultCollapsed = false,
  minWidth,
  maxWidth,
  flex,
  className = "",
}) => {
  const { registerSection, activeSections, toggleSection, config } =
    useAdaptiveLayout();

  useEffect(() => {
    registerSection({
      id,
      component: children,
      priority,
      collapsible,
      defaultCollapsed,
      minWidth,
      maxWidth,
      flex,
    });
  }, [
    id,
    children,
    priority,
    collapsible,
    defaultCollapsed,
    minWidth,
    maxWidth,
    flex,
    registerSection,
  ]);

  const isActive = activeSections.has(id);
  const shouldShow = !collapsible || isActive;

  if (!shouldShow && config.mode !== "guided") {
    return null;
  }

  const sectionStyle: React.CSSProperties = {
    minWidth,
    maxWidth,
    flex,
    display: shouldShow ? "block" : "none",
    animation: shouldShow
      ? "slide-down-v2 0.3s ease-out"
      : "slide-up-v2 0.3s ease-out",
  };

  return (
    <div className={`adaptive-section ${className}`} style={sectionStyle}>
      {collapsible && (
        <div className="section-header">
          <button
            onClick={() => toggleSection(id)}
            className="section-toggle"
            aria-label={`Toggle ${id} section`}
          >
            <span
              className={`toggle-icon ${isActive ? "expanded" : "collapsed"}`}
            >
              {isActive ? "▼" : "▶"}
            </span>
          </button>
        </div>
      )}
      <div className="section-content">{children}</div>
    </div>
  );
};

// Adaptive Panel Component for Multi-Panel Layouts
interface AdaptivePanelProps {
  position: "left" | "center" | "right";
  children: React.ReactNode;
  collapsible?: boolean;
  defaultWidth?: string;
  className?: string;
}

// @ts-ignore
export const AdaptivePanel: React.FC<AdaptivePanelProps> = ({
  position,
  children,
  collapsible = false,
  defaultWidth,
  className = "",
}) => {
  const { config, layoutConfig } = useAdaptiveLayout();

  if (!config.features.multiPanelLayout && position !== "center") {
    return null;
  }

  const panelStyle: React.CSSProperties = {
    ...(position === "left" && {
      minWidth: "200px",
      maxWidth: "300px",
      flex: "0 0 auto",
    }),
    ...(position === "center" && {
      flex: "1 1 auto",
      minWidth: 0,
    }),
    ...(position === "right" && {
      minWidth: "250px",
      maxWidth: "400px",
      flex: "0 0 auto",
    }),
    ...(defaultWidth && { width: defaultWidth }),
  };

  return (
    <div
      className={`adaptive-panel adaptive-panel-${position} ${className}`}
      style={panelStyle}
    >
      {children}
    </div>
  );
};

// Adaptive Grid System
interface AdaptiveGridProps {
  columns?: number | "auto";
  gap?: string;
  children: React.ReactNode;
  className?: string;
}

// @ts-ignore
export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  columns = "auto",
  gap = "1rem",
  children,
  className = "",
}) => {
  const { config } = useAdaptiveLayout();

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gap,
    ...(columns === "auto" && {
      gridTemplateColumns:
        config.mode === "power"
          ? "repeat(auto-fit, minmax(200px, 1fr))"
          : config.mode === "efficient"
            ? "repeat(auto-fit, minmax(250px, 1fr))"
            : "1fr",
    }),
    ...(typeof columns === "number" && {
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }),
  };

  return (
    <div className={`adaptive-grid ${className}`} style={gridStyle}>
      {children}
    </div>
  );
};

// Adaptive Container for responsive behavior
interface AdaptiveContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: string;
  className?: string;
}

// @ts-ignore
export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  children,
  maxWidth = "xl",
  padding,
  className = "",
}) => {
  const { config } = useAdaptiveLayout();

  const containerStyle: React.CSSProperties = {
    width: "100%",
    margin: "0 auto",
    ...(maxWidth === "sm" && { maxWidth: "640px" }),
    ...(maxWidth === "md" && { maxWidth: "768px" }),
    ...(maxWidth === "lg" && { maxWidth: "1024px" }),
    ...(maxWidth === "xl" && { maxWidth: "1280px" }),
    ...(maxWidth === "full" && { maxWidth: "none" }),
    padding:
      padding ||
      (config.density === "compact"
        ? "0.5rem"
        : config.density === "comfortable"
          ? "1rem"
          : "1.5rem"),
  };

  return (
    <div className={`adaptive-container ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};
