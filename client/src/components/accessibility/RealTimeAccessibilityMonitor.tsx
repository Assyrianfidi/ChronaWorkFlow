
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useRef, useCallback } from "react";

// Accessibility monitoring interfaces
interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  category: "wcag-a" | "wcag-aa" | "wcag-aaa" | "best-practice";
  level: "error" | "warning" | "info";
  selector: string;
  check: (element: Element) => boolean;
  fix?: (element: Element) => void;
}

interface AccessibilityViolation {
  id: string;
  ruleId: string;
  element: Element;
  message: string;
  level: "error" | "warning" | "info";
  timestamp: number;
  fixed: boolean;
}

interface AccessibilityMetrics {
  totalElements: number;
  violations: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  compliance: {
    wcag_a: number; // Percentage
    wcag_aa: number;
    wcag_aaa: number;
    overall: number;
  };
  lastScan: number;
}

interface AccessibilityMonitorContextType {
  // Monitoring
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  toggleMonitoring: () => void;

  // Scanning
  scanPage: () => AccessibilityViolation[];
  scanElement: (element: Element) => AccessibilityViolation[];

  // Violations
  violations: AccessibilityViolation[];
  clearViolations: () => void;
  fixViolation: (violationId: string) => void;
  fixAllViolations: () => void;

  // Metrics
  metrics: AccessibilityMetrics;
  getMetrics: () => AccessibilityMetrics;

  // Settings
  scanInterval: number;
  setScanInterval: (interval: number) => void;
  autoFix: boolean;
  setAutoFix: (enabled: boolean) => void;

  // Reporting
  generateReport: () => string;
  exportViolations: () => AccessibilityViolation[];
}

const AccessibilityMonitorContext =
  React.createContext<AccessibilityMonitorContextType | null>(null);

// Built-in accessibility rules
const ACCESSIBILITY_RULES: AccessibilityRule[] = [
  // WCAG 2.1 Level A Rules
  {
    id: "alt-text",
    name: "Images must have alt text",
    description: "All img elements must have an alt attribute",
    category: "wcag-a",
    level: "error",
    selector: "img",
    check: (element) => element.hasAttribute("alt"),
    fix: (element) => element.setAttribute("alt", "Descriptive text needed"),
  },
  {
    id: "button-label",
    name: "Buttons must have accessible labels",
    description: "Button elements must have text content or aria-label",
    category: "wcag-a",
    level: "error",
    selector: "button",
    check: (element) => {
      const text = element.textContent?.trim();
      const ariaLabel = element.getAttribute("aria-label");
      const ariaLabelledBy = element.getAttribute("aria-labelledby");
      return !!(text || ariaLabel || ariaLabelledBy);
    },
    fix: (element) => element.setAttribute("aria-label", "Button"),
  },
  {
    id: "form-labels",
    name: "Form inputs must have labels",
    description: "Input elements must have associated labels",
    category: "wcag-a",
    level: "error",
    selector: "input, textarea, select",
    check: (element) => {
      const id = element.id;
      const ariaLabel = element.getAttribute("aria-label");
      const ariaLabelledBy = element.getAttribute("aria-labelledby");
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      return !!(ariaLabel || ariaLabelledBy || hasLabel);
    },
    fix: (element) => {
      const id = element.id || `input-${Date.now()}`;
      element.id = id;
      const label = document.createElement("label");
      label.textContent = "Label";
      label.setAttribute("for", id);
      element.parentNode?.insertBefore(label, element);
    },
  },
  {
    id: "link-purpose",
    name: "Links must have discernible purpose",
    description: "Link text must describe the link's purpose",
    category: "wcag-a",
    level: "warning",
    selector: "a",
    check: (element) => {
      const text = element.textContent?.trim();
      const ariaLabel = element.getAttribute("aria-label");
      return !!(text && text.length > 2) || ariaLabel;
    },
    fix: (element) =>
      element.setAttribute("aria-label", "Link description needed"),
  },
  {
    id: "heading-order",
    name: "Headings must be in logical order",
    description: "Heading levels must not be skipped",
    category: "wcag-a",
    level: "warning",
    selector: "h1, h2, h3, h4, h5, h6",
    check: (element) => {
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      const currentIndex = headings.indexOf(element);
      if (currentIndex === 0) return true;

      const currentLevel = parseInt(element.tagName[1]);
      const previousLevel = parseInt(headings[currentIndex - 1].tagName[1]);
      return currentLevel <= previousLevel + 1;
    },
  },

  // WCAG 2.1 Level AA Rules
  {
    id: "color-contrast",
    name: "Text must have sufficient contrast",
    description: "Text color and background must have 4.5:1 contrast ratio",
    category: "wcag-aa",
    level: "error",
    selector: "*",
    check: (element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Skip if transparent or hidden
      if (
        backgroundColor === "transparent" ||
        backgroundColor === "rgba(0, 0, 0, 0)"
      ) {
        return true;
      }

      // Calculate contrast ratio (simplified)
      const colorLuma = getLuminance(color);
      const bgLuma = getLuminance(backgroundColor);
      const ratio =
        (Math.max(colorLuma, bgLuma) + 0.05) /
        (Math.min(colorLuma, bgLuma) + 0.05);

      return ratio >= 4.5;
    },
  },
  {
    id: "focus-indicators",
    name: "Interactive elements must have focus indicators",
    description: "Focusable elements must have visible focus styles",
    category: "wcag-aa",
    level: "error",
    selector:
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    check: (element) => {
      const styles = window.getComputedStyle(element, ":focus");
      return styles.outline !== "none" || styles.boxShadow !== "none";
    },
    fix: (element) => {
      (element as HTMLElement).style.outline = "2px solid #0066cc";
      (element as HTMLElement).style.outlineOffset = "2px";
    },
  },
  {
    id: "resize-text",
    name: "Text must be resizable",
    description: "Text must scale without loss of functionality",
    category: "wcag-aa",
    level: "info",
    selector: "body",
    check: (element) => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      return fontSize >= 16; // Minimum 16px base size
    },
  },

  // WCAG 2.1 Level AAA Rules
  {
    id: "enhanced-contrast",
    name: "Enhanced contrast for large text",
    description: "Large text must have 3:1 contrast ratio",
    category: "wcag-aaa",
    level: "warning",
    selector: "*",
    check: (element) => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const isLargeText =
        fontSize >= 18 ||
        (fontSize >= 14 && parseInt(styles.fontWeight) >= 700);

      if (!isLargeText) return true;

      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (
        backgroundColor === "transparent" ||
        backgroundColor === "rgba(0, 0, 0, 0)"
      ) {
        return true;
      }

      const colorLuma = getLuminance(color);
      const bgLuma = getLuminance(backgroundColor);
      const ratio =
        (Math.max(colorLuma, bgLuma) + 0.05) /
        (Math.min(colorLuma, bgLuma) + 0.05);

      return ratio >= 3.0;
    },
  },

  // Best Practices
  {
    id: "skip-link",
    name: "Skip navigation link",
    description: "Page should have a skip navigation link",
    category: "best-practice",
    level: "info",
    selector: "body",
    check: (element) => {
      return !!document.querySelector(
        'a[href*="skip"], a[href*="main"], a[href*="content"]',
      );
    },
  },
  {
    id: "lang-attribute",
    name: "Language attribute",
    description: "HTML element should have lang attribute",
    category: "best-practice",
    level: "warning",
    selector: "html",
    check: (element) => element.hasAttribute("lang"),
    fix: (element) => element.setAttribute("lang", "en"),
  },
  {
    id: "page-title",
    name: "Page title",
    description: "Page should have a descriptive title",
    category: "best-practice",
    level: "warning",
    selector: "head",
    check: (element) => {
      const title = document.querySelector("title");
      return !!(title && title.textContent && title.textContent.length > 10);
    },
  },
];

// Helper function to calculate luminance
const getLuminance = (color: string): number => {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return 0;

  const [r, g, b] = rgb.slice(0, 3).map((val) => {
    const sRGB = parseInt(val) / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Real-time Accessibility Monitor Component
export const RealTimeAccessibilityMonitor: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [metrics, setMetrics] = useState<AccessibilityMetrics>({
    totalElements: 0,
    violations: { total: 0, errors: 0, warnings: 0, info: 0 },
    compliance: { wcag_a: 100, wcag_aa: 100, wcag_aaa: 100, overall: 100 },
    lastScan: Date.now(),
  });
  const [scanInterval, setScanInterval] = useState(5000); // 5 seconds
  const [autoFix, setAutoFix] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Scan page for violations
  const scanPage = useCallback(() => {
    const newViolations: AccessibilityViolation[] = [];

    ACCESSIBILITY_RULES.forEach((rule) => {
      const elements = document.querySelectorAll(rule.selector);

      elements.forEach((element) => {
        if (!rule.check(element)) {
          const violation: AccessibilityViolation = {
            id: `${rule.id}-${Date.now()}-${Math.random()}`,
            ruleId: rule.id,
            element,
            message: rule.description,
            level: rule.level,
            timestamp: Date.now(),
            fixed: false,
          };

          newViolations.push(violation);

          // Auto-fix if enabled
          if (autoFix && rule.fix) {
            rule.fix(element);
            violation.fixed = true;
          }
        }
      });
    });

    setViolations(newViolations);
    updateMetrics(newViolations);

    return newViolations;
  }, [autoFix]);

  // Scan specific element
  const scanElement = useCallback(
    (element: Element) => {
      const elementViolations: AccessibilityViolation[] = [];

      ACCESSIBILITY_RULES.forEach((rule) => {
        if (element.matches(rule.selector) && !rule.check(element)) {
          const violation: AccessibilityViolation = {
            id: `${rule.id}-${Date.now()}-${Math.random()}`,
            ruleId: rule.id,
            element,
            message: rule.description,
            level: rule.level,
            timestamp: Date.now(),
            fixed: false,
          };

          elementViolations.push(violation);

          // Auto-fix if enabled
          if (autoFix && rule.fix) {
            rule.fix(element);
            violation.fixed = true;
          }
        }
      });

      return elementViolations;
    },
    [autoFix],
  );

  // Update metrics
  const updateMetrics = useCallback(
    (currentViolations: AccessibilityViolation[]) => {
      const totalElements = document.querySelectorAll("*").length;
      const errors = currentViolations.filter(
        (v) => v.level === "error" && !v.fixed,
      ).length;
      const warnings = currentViolations.filter(
        (v) => v.level === "warning" && !v.fixed,
      ).length;
      const info = currentViolations.filter(
        (v) => v.level === "info" && !v.fixed,
      ).length;

      // Calculate compliance percentages
      const wcagARules = ACCESSIBILITY_RULES.filter(
        (r) => r.category === "wcag-a",
      );
      const wcagAARules = ACCESSIBILITY_RULES.filter(
        (r) => r.category === "wcag-aa",
      );
      const wcagAAARules = ACCESSIBILITY_RULES.filter(
        (r) => r.category === "wcag-aaa",
      );

      const wcagACompliance = calculateCompliance(
        currentViolations,
        wcagARules,
      );
      const wcagAACompliance = calculateCompliance(currentViolations, [
        ...wcagARules,
        ...wcagAARules,
      ]);
      const wcagAAACompliance = calculateCompliance(currentViolations, [
        ...wcagARules,
        ...wcagAARules,
        ...wcagAAARules,
      ]);

      const overallCompliance =
        (wcagACompliance + wcagAACompliance + wcagAAACompliance) / 3;

      setMetrics({
        totalElements,
        violations: { total: currentViolations.length, errors, warnings, info },
        compliance: {
          wcag_a: wcagACompliance,
          wcag_aa: wcagAACompliance,
          wcag_aaa: wcagAAACompliance,
          overall: overallCompliance,
        },
        lastScan: Date.now(),
      });
    },
    [],
  );

  // Calculate compliance percentage
  const calculateCompliance = (
    violations: AccessibilityViolation[],
    rules: AccessibilityRule[],
  ) => {
    if (rules.length === 0) return 100;

    const ruleViolations = violations.filter(
      (v) => !v.fixed && rules.some((r) => r.id === v.ruleId),
    );
    const passedRules = rules.length - ruleViolations.length;

    return Math.round((passedRules / rules.length) * 100);
  };

  // Monitoring control
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    // Initial scan
    scanPage();

    // Set up interval scanning
    intervalRef.current = setInterval(() => {
      scanPage();
    }, scanInterval);

    // Set up mutation observer
    observerRef.current = new MutationObserver(() => {
      scanPage();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-*"],
    });
  }, [scanPage, scanInterval]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  // Violation management
  const clearViolations = useCallback(() => {
    setViolations([]);
    updateMetrics([]);
  }, [updateMetrics]);

  const fixViolation = useCallback(
    (violationId: string) => {
      const violation = violations.find((v) => v.id === violationId);
      if (!violation) return;

      const rule = ACCESSIBILITY_RULES.find((r) => r.id === violation.ruleId);
      if (rule?.fix) {
        rule.fix(violation.element);

        setViolations((prev) =>
          prev.map((v) => (v.id === violationId ? { ...v, fixed: true } : v)),
        );

        updateMetrics(
          violations.map((v) =>
            v.id === violationId ? { ...v, fixed: true } : v,
          ),
        );
      }
    },
    [violations, updateMetrics],
  );

  const fixAllViolations = useCallback(() => {
    const updatedViolations = violations.map((violation) => {
      if (violation.fixed) return violation;

      const rule = ACCESSIBILITY_RULES.find((r) => r.id === violation.ruleId);
      if (rule?.fix) {
        rule.fix(violation.element);
        return { ...violation, fixed: true };
      }

      return violation;
    });

    setViolations(updatedViolations);
    updateMetrics(updatedViolations);
  }, [violations, updateMetrics]);

  // Get current metrics
  const getMetrics = useCallback(() => metrics, [metrics]);

  // Generate report
  const generateReport = useCallback(() => {
    const report = `
# Accessibility Compliance Report
Generated: ${new Date(metrics.lastScan).toLocaleString()}

## Overall Compliance
- WCAG A: ${metrics.compliance.wcag_a}%
- WCAG AA: ${metrics.compliance.wcag_aa}%
- WCAG AAA: ${metrics.compliance.wcag_aaa}%
- Overall: ${metrics.compliance.overall.toFixed(1)}%

## Violations Summary
- Total Elements: ${metrics.totalElements}
- Total Violations: ${metrics.violations.total}
- Errors: ${metrics.violations.errors}
- Warnings: ${metrics.violations.warnings}
- Info: ${metrics.violations.info}

## Violations by Category
${violations
  .filter((v) => !v.fixed)
  .map((v) => {
    const rule = ACCESSIBILITY_RULES.find((r) => r.id === v.ruleId);
    return `- ${rule?.name}: ${v.message}`;
  })
  .join("\n")}

## Recommendations
${
  violations.filter((v) => !v.fixed && v.level === "error").length > 0
    ? "Address all errors to achieve WCAG A compliance."
    : "Great job! No critical accessibility issues found."
}
    `.trim();

    return report;
  }, [metrics, violations]);

  // Export violations
  const exportViolations = useCallback(() => violations, [violations]);

  // Update scan interval
  useEffect(() => {
    if (isMonitoring) {
      stopMonitoring();
      startMonitoring();
    }
  }, [scanInterval, isMonitoring, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const contextValue: AccessibilityMonitorContextType = {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    scanPage,
    scanElement,
    violations,
    clearViolations,
    fixViolation,
    fixAllViolations,
    metrics,
    getMetrics,
    scanInterval,
    setScanInterval,
    autoFix,
    setAutoFix,
    generateReport,
    exportViolations,
  };

  return (
    <AccessibilityMonitorContext.Provider value={contextValue}>
      {children}
    </AccessibilityMonitorContext.Provider>
  );
};

// Hook
export const useAccessibilityMonitor = (): AccessibilityMonitorContextType => {
  const context = React.useContext(AccessibilityMonitorContext);
  if (!context) {
    throw new Error(
      "useAccessibilityMonitor must be used within RealTimeAccessibilityMonitor",
    );
  }
  return context;
};

// Accessibility Monitor Dashboard
export const AccessibilityMonitorDashboard: React.FC = () => {
  const {
    isMonitoring,
    toggleMonitoring,
    violations,
    metrics,
    fixViolation,
    fixAllViolations,
    clearViolations,
    generateReport,
    autoFix,
    setAutoFix,
    scanInterval,
    setScanInterval,
  } = useAccessibilityMonitor();

  const [showReport, setShowReport] = useState(false);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Accessibility Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isMonitoring
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </button>
          <button
            onClick={() => setShowReport(!showReport)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {showReport ? "Hide Report" : "Show Report"}
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {metrics.compliance.overall.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall Compliance</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {metrics.violations.errors}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {metrics.violations.warnings}
          </div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.violations.info}
          </div>
          <div className="text-sm text-gray-600">Info</div>
        </div>
      </div>

      {/* Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Interval: {scanInterval / 1000}s
            </label>
            <input
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={scanInterval}
              onChange={(e) => setScanInterval(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autofix"
              checked={autoFix}
              onChange={(e) => setAutoFix(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="autofix"
              className="text-sm font-medium text-gray-700"
            >
              Auto-fix violations
            </label>
          </div>
        </div>
      </div>

      {/* Violations List */}
      {violations.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Violations</h3>
            <div className="flex gap-2">
              <button
                onClick={fixAllViolations}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                Fix All
              </button>
              <button
                onClick={clearViolations}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {violations
              .filter((v) => !v.fixed)
              .map((violation) => {
                const rule = ACCESSIBILITY_RULES.find(
                  (r) => r.id === violation.ruleId,
                );
                return (
                  <div
                    key={violation.id}
                    className={`p-3 rounded-md border ${
                      violation.level === "error"
                        ? "bg-red-50 border-red-200"
                        : violation.level === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{rule?.name}</div>
                        <div className="text-sm text-gray-600">
                          {violation.message}
                        </div>
                      </div>
                      <button
                        onClick={() => fixViolation(violation.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Fix
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Report */}
      {showReport && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Accessibility Report</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded border">
            {generateReport()}
          </pre>
        </div>
      )}

      {/* Status Indicator */}
      {isMonitoring && (
        <div className="fixed bottom-4 right-4 p-3 bg-green-500 text-white rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Monitoring</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeAccessibilityMonitor;
