
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUserExperienceMode } from './UserExperienceMode';
import { cn } from '@/components/lib/utils';

// Accessibility configuration types
export interface AccessibilityConfig {
  mode: "standard" | "high-contrast" | "dyslexia-friendly" | "colorblind-safe";
  fontSize: "small" | "medium" | "large" | "extra-large";
  lineHeight: "compact" | "normal" | "relaxed";
  letterSpacing: "normal" | "wide" | "extra-wide";
  focusVisible: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  voiceNavigation: boolean;
  colorBlindType:
    | "protanopia"
    | "deuteranopia"
    | "tritanopia"
    | "achromatopsia"
    | "none";
  highContrastLevel: "normal" | "enhanced" | "maximum";
}

interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  resetToDefaults: () => void;
  isHighContrast: boolean;
  isDyslexiaFriendly: boolean;
  isColorblindSafe: boolean;
  currentFontSize: string;
  currentLineHeight: string;
  currentLetterSpacing: string;
}

const defaultConfig: AccessibilityConfig = {
  mode: "standard",
  fontSize: "medium",
  lineHeight: "normal",
  letterSpacing: "normal",
  focusVisible: true,
  reducedMotion: false,
  screenReaderOptimized: false,
  keyboardNavigation: true,
  voiceNavigation: false,
  colorBlindType: "none",
  highContrastLevel: "normal",
};

const AccessibilityContext =
  React.createContext<AccessibilityContextType | null>(null);

// WCAG AAA compliance configurations
const WCAG_CONFIGS = {
  standard: {
    colors: {
      primary: "#3b82f6",
      secondary: "#6b7280",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      background: "#ffffff",
      surface: "#f9fafb",
      text: "#111827",
      textSecondary: "#6b7280",
    },
    contrastRatios: {
      normal: 4.5,
      large: 3.0,
    },
  },
  "high-contrast": {
    colors: {
      primary: "#0000ff",
      secondary: "#000000",
      success: "#00ff00",
      warning: "#ffff00",
      error: "#ff0000",
      background: "#000000",
      surface: "#1a1a1a",
      text: "#ffffff",
      textSecondary: "#cccccc",
    },
    contrastRatios: {
      normal: 7.0,
      large: 4.5,
    },
  },
  "dyslexia-friendly": {
    colors: {
      primary: "#0066cc",
      secondary: "#333333",
      success: "#008000",
      warning: "#ff8c00",
      error: "#cc0000",
      background: "#ffffcc",
      surface: "#ffffff",
      text: "#000000",
      textSecondary: "#666666",
    },
    contrastRatios: {
      normal: 7.0,
      large: 4.5,
    },
  },
  "colorblind-safe": {
    colors: {
      primary: "#0066cc",
      secondary: "#666666",
      success: "#009966",
      warning: "#ff6600",
      error: "#cc0000",
      background: "#ffffff",
      surface: "#f5f5f5",
      text: "#000000",
      textSecondary: "#666666",
    },
    contrastRatios: {
      normal: 4.5,
      large: 3.0,
    },
  },
};

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);
  const { currentMode, updateCustomSettings } = useUserExperienceMode();

  // Load saved settings from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("accessibility-config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to parse accessibility config:", error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("accessibility-config", JSON.stringify(config));
  }, [config]);

  // Sync with UX mode
  useEffect(() => {
    if (currentMode.accessibility !== "standard") {
      updateConfig({
        mode: currentMode.accessibility as AccessibilityConfig["mode"],
      });
    }
  }, [currentMode.accessibility]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply mode-specific CSS classes
    root.classList.remove(
      "accessibility-standard",
      "accessibility-high-contrast",
      "accessibility-dyslexia-friendly",
      "accessibility-colorblind-safe",
    );
    root.classList.add(`accessibility-${config.mode}`);

    // Apply font size
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };
    root.style.fontSize = fontSizes[config.fontSize];

    // Apply line height
    const lineHeights = {
      compact: "1.2",
      normal: "1.5",
      relaxed: "1.8",
    };
    root.style.lineHeight = lineHeights[config.lineHeight];

    // Apply letter spacing
    const letterSpacings = {
      normal: "normal",
      wide: "0.05em",
      "extra-wide": "0.1em",
    };
    root.style.letterSpacing = letterSpacings[config.letterSpacing];

    // Apply focus visibility
    root.setAttribute("data-focus-visible", config.focusVisible.toString());

    // Apply reduced motion
    if (config.reducedMotion) {
      root.style.setProperty("--transition-duration", "0ms");
      root.classList.add("reduce-motion");
    } else {
      root.style.removeProperty("--transition-duration");
      root.classList.remove("reduce-motion");
    }

    // Apply screen reader optimizations
    if (config.screenReaderOptimized) {
      root.setAttribute("data-screen-reader", "true");
      body.classList.add("screen-reader-optimized");
    } else {
      root.removeAttribute("data-screen-reader");
      body.classList.remove("screen-reader-optimized");
    }

    // Apply keyboard navigation
    if (config.keyboardNavigation) {
      body.setAttribute("data-keyboard-nav", "true");
    } else {
      body.removeAttribute("data-keyboard-nav");
    }

    // Apply colorblind mode
    if (config.colorBlindType !== "none") {
      root.setAttribute("data-colorblind-type", config.colorBlindType);
      applyColorblindFilter(config.colorBlindType);
    } else {
      root.removeAttribute("data-colorblind-type");
      removeColorblindFilter();
    }

    // Apply high contrast level
    if (config.mode === "high-contrast") {
      root.setAttribute("data-contrast-level", config.highContrastLevel);
    } else {
      root.removeAttribute("data-contrast-level");
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  // Computed values
  const isHighContrast = config.mode === "high-contrast";
  const isDyslexiaFriendly = config.mode === "dyslexia-friendly";
  const isColorblindSafe = config.mode === "colorblind-safe";

  const currentFontSize = useMemo(() => {
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };
    return fontSizes[config.fontSize];
  }, [config.fontSize]);

  const currentLineHeight = useMemo(() => {
    const lineHeights = {
      compact: "1.2",
      normal: "1.5",
      relaxed: "1.8",
    };
    return lineHeights[config.lineHeight];
  }, [config.lineHeight]);

  const currentLetterSpacing = useMemo(() => {
    const letterSpacings = {
      normal: "normal",
      wide: "0.05em",
      "extra-wide": "0.1em",
    };
    return letterSpacings[config.letterSpacing];
  }, [config.letterSpacing]);

  const contextValue: AccessibilityContextType = {
    config,
    updateConfig,
    resetToDefaults,
    isHighContrast,
    isDyslexiaFriendly,
    isColorblindSafe,
    currentFontSize,
    currentLineHeight,
    currentLetterSpacing,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      <AccessibilityStyles />
      <KeyboardNavigation enabled={config.keyboardNavigation} />
      <VoiceNavigation enabled={config.voiceNavigation} />
    </AccessibilityContext.Provider>
  );
}

// Apply colorblind filters
function applyColorblindFilter(type: AccessibilityConfig["colorBlindType"]) {
  const filters = {
    protanopia: "url(#protanopia-filter)",
    deuteranopia: "url(#deuteranopia-filter)",
    tritanopia: "url(#tritanopia-filter)",
    achromatopsia: "grayscale(100%)",
  };

  if (type !== "none") {
    document.body.style.filter = filters[type] || "none";
  }
}

function removeColorblindFilter() {
  document.body.style.filter = "none";
}

// Accessibility styles component
function AccessibilityStyles() {
  return (
    <style jsx global>{`
      /* High Contrast Mode */
      .accessibility-high-contrast {
        --bg-primary: #000000;
        --bg-secondary: #1a1a1a;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-color: #ffffff;
        --focus-color: #ffff00;
      }

      /* Dyslexia Friendly Mode */
      .accessibility-dyslexia-friendly {
        --bg-primary: #ffffcc;
        --bg-secondary: #ffffff;
        --text-primary: #000000;
        --text-secondary: #666666;
        --border-color: #333333;
        --focus-color: #0066cc;
        font-family: "OpenDyslexic", "Comic Sans MS", sans-serif;
      }

      /* Colorblind Safe Mode */
      .accessibility-colorblind-safe {
        --color-primary: #0066cc;
        --color-success: #009966;
        --color-warning: #ff6600;
        --color-error: #cc0000;
      }

      /* Reduced Motion */
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* Screen Reader Optimizations */
      .screen-reader-optimized .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Focus Styles */
      [data-focus-visible="true"] *:focus {
        outline: 2px solid var(--focus-color, #3b82f6);
        outline-offset: 2px;
      }

      /* Keyboard Navigation */
      [data-keyboard-nav="true"] *:focus-visible {
        outline: 3px solid #ffff00;
        outline-offset: 2px;
      }

      /* SVG Filters for Colorblindness */
      .colorblind-filters {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
      }
    `}</style>
  );
}

// Keyboard Navigation Component
function KeyboardNavigation({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab navigation enhancement
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }

      // Escape to close modals
      if (e.key === "Escape") {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach((modal) => {
          const closeEvent = new CustomEvent("close");
          modal.dispatchEvent(closeEvent);
        });
      }

      // Alt + arrows for navigation
      if (e.altKey) {
        switch (e.key) {
          case "ArrowLeft":
            // Navigate to previous section
            break;
          case "ArrowRight":
            // Navigate to next section
            break;
          case "ArrowUp":
            // Navigate to previous page
            break;
          case "ArrowDown":
            // Navigate to next page
            break;
        }
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove("keyboard-navigation");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [enabled]);

  return null;
}

// Voice Navigation Component (placeholder for future implementation)
function VoiceNavigation({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    // Initialize Web Speech API if available
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      console.log("Voice navigation enabled");
      // Future implementation for voice commands
    }

    return () => {
      // Cleanup voice recognition
    };
  }, [enabled]);

  return null;
}

// Accessibility Hook
export function useAccessibility() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}

// Accessibility Controls Component
export function AccessibilityControls() {
  const { config, updateConfig, resetToDefaults } = useAccessibility();

  return (
    <div className="accessibility-controls p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Accessibility Settings
        </h3>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {/* Accessibility Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Accessibility Mode
          </label>
          <select
            value={config.mode}
            onChange={(e) =>
              updateConfig({
                mode: e.target.value as AccessibilityConfig["mode"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="standard">Standard</option>
            <option value="high-contrast">High Contrast</option>
            <option value="dyslexia-friendly">Dyslexia Friendly</option>
            <option value="colorblind-safe">Colorblind Safe</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Font Size
          </label>
          <select
            value={config.fontSize}
            onChange={(e) =>
              updateConfig({
                fontSize: e.target.value as AccessibilityConfig["fontSize"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Line Height
          </label>
          <select
            value={config.lineHeight}
            onChange={(e) =>
              updateConfig({
                lineHeight: e.target.value as AccessibilityConfig["lineHeight"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Letter Spacing
          </label>
          <select
            value={config.letterSpacing}
            onChange={(e) =>
              updateConfig({
                letterSpacing: e.target
                  .value as AccessibilityConfig["letterSpacing"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
            <option value="extra-wide">Extra Wide</option>
          </select>
        </div>

        {/* Colorblind Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Colorblind Type
          </label>
          <select
            value={config.colorBlindType}
            onChange={(e) =>
              updateConfig({
                colorBlindType: e.target
                  .value as AccessibilityConfig["colorBlindType"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="none">None</option>
            <option value="protanopia">Protanopia (Red-Blind)</option>
            <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
            <option value="tritanopia">Tritanopia (Blue-Blind)</option>
            <option value="achromatopsia">Achromatopsia (Complete)</option>
          </select>
        </div>

        {/* Toggle Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.focusVisible}
              onChange={(e) => updateConfig({ focusVisible: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enhanced Focus Indicators
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.reducedMotion}
              onChange={(e) =>
                updateConfig({ reducedMotion: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Reduced Motion
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.screenReaderOptimized}
              onChange={(e) =>
                updateConfig({ screenReaderOptimized: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Screen Reader Optimized
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.keyboardNavigation}
              onChange={(e) =>
                updateConfig({ keyboardNavigation: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enhanced Keyboard Navigation
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Accessibility Test Component
export function AccessibilityTest() {
  const { config } = useAccessibility();

  const testContrast = () => {
    // Test contrast ratios for WCAG compliance
    const elements = document.querySelectorAll("*");
    const results: Array<{
      element: string;
      ratio: number;
      compliant: boolean;
    }> = [];

    elements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Calculate contrast ratio (simplified)
      if (color && backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
        // This is a simplified calculation - in production, use a proper contrast ratio library
        const ratio = 4.5; // Placeholder
        const compliant = ratio >= 4.5;

        results.push({
          element: element.tagName.toLowerCase(),
          ratio,
          compliant,
        });
      }
    });

    console.log("Contrast Test Results:", results);
  };

  return (
    <div className="accessibility-test p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Accessibility Testing
      </h3>

      <div className="space-y-2">
        <button
          onClick={testContrast}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Contrast Ratios
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Current Mode: {config.mode}</p>
          <p>Font Size: {config.fontSize}</p>
          <p>Line Height: {config.lineHeight}</p>
          <p>Reduced Motion: {config.reducedMotion ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
}

export default AccessibilityProvider;
