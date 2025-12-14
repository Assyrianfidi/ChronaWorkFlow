declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from "react";

// Visual mode interfaces
interface VisualMode {
  id: string;
  name: string;
  description: string;
  type: "high-contrast" | "colorblind" | "dyslexia" | "low-vision" | "custom";
  settings: VisualModeSettings;
}

interface VisualModeSettings {
  // Color settings
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  linkColor: string;
  errorColor: string;
  warningColor: string;
  successColor: string;

  // Typography
  fontFamily: string;
  fontSize: number; // Base font size multiplier
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;

  // Layout
  spacing: number; // Global spacing multiplier
  borderRadius: number; // Border radius multiplier
  shadows: boolean;

  // Visual aids
  focusIndicators: boolean;
  hoverStates: boolean;
  animations: boolean;
  transitions: boolean;

  // Image adjustments
  imageFilters: {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: boolean;
  };
}

interface VisualModeContextType {
  // Mode management
  currentMode: VisualMode | null;
  availableModes: VisualMode[];
  setMode: (modeId: string) => void;
  resetMode: () => void;

  // Custom mode creation
  createCustomMode: (mode: Omit<VisualMode, "id">) => void;
  updateCustomMode: (
    modeId: string,
    settings: Partial<VisualModeSettings>,
  ) => void;
  deleteCustomMode: (modeId: string) => void;

  // Settings
  settings: VisualModeSettings;
  updateSettings: (settings: Partial<VisualModeSettings>) => void;

  // System integration
  detectSystemPreferences: () => void;
  applySystemTheme: () => void;
}

const VisualModeContext = React.createContext<VisualModeContextType | null>(
  null,
);

// Built-in visual modes
const BUILTIN_MODES: VisualMode[] = [
  {
    id: "default",
    name: "Default",
    description: "Standard appearance",
    type: "custom",
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      accentColor: "#3b82f6",
      borderColor: "#e5e7eb",
      linkColor: "#3b82f6",
      errorColor: "#ef4444",
      warningColor: "#f59e0b",
      successColor: "#10b981",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      wordSpacing: 0,
      spacing: 1.0,
      borderRadius: 1.0,
      shadows: true,
      focusIndicators: true,
      hoverStates: true,
      animations: true,
      transitions: true,
      imageFilters: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        grayscale: false,
      },
    },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Maximum contrast for visibility",
    type: "high-contrast",
    settings: {
      backgroundColor: "#000000",
      textColor: "#ffffff",
      accentColor: "#ffff00",
      borderColor: "#ffffff",
      linkColor: "#00ffff",
      errorColor: "#ff0000",
      warningColor: "#ffff00",
      successColor: "#00ff00",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 1.2,
      lineHeight: 1.6,
      letterSpacing: 0.5,
      wordSpacing: 2,
      spacing: 1.2,
      borderRadius: 0,
      shadows: false,
      focusIndicators: true,
      hoverStates: true,
      animations: false,
      transitions: false,
      imageFilters: {
        brightness: 1.2,
        contrast: 1.5,
        saturation: 0,
        grayscale: false,
      },
    },
  },
  {
    id: "colorblind-protanopia",
    name: "Colorblind (Protanopia)",
    description: "Red-blind friendly colors",
    type: "colorblind",
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      accentColor: "#0066cc",
      borderColor: "#cccccc",
      linkColor: "#0066cc",
      errorColor: "#ff6600",
      warningColor: "#ffaa00",
      successColor: "#00aa00",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      wordSpacing: 0,
      spacing: 1.0,
      borderRadius: 1.0,
      shadows: true,
      focusIndicators: true,
      hoverStates: true,
      animations: true,
      transitions: true,
      imageFilters: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 0.8,
        grayscale: false,
      },
    },
  },
  {
    id: "colorblind-deuteranopia",
    name: "Colorblind (Deuteranopia)",
    description: "Green-blind friendly colors",
    type: "colorblind",
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      accentColor: "#0066cc",
      borderColor: "#cccccc",
      linkColor: "#0066cc",
      errorColor: "#cc0066",
      warningColor: "#cc6600",
      successColor: "#00cc66",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      wordSpacing: 0,
      spacing: 1.0,
      borderRadius: 1.0,
      shadows: true,
      focusIndicators: true,
      hoverStates: true,
      animations: true,
      transitions: true,
      imageFilters: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 0.8,
        grayscale: false,
      },
    },
  },
  {
    id: "dyslexia-friendly",
    name: "Dyslexia Friendly",
    description: "Optimized for dyslexic users",
    type: "dyslexia",
    settings: {
      backgroundColor: "#fffef0",
      textColor: "#1a1a1a",
      accentColor: "#0066cc",
      borderColor: "#cccccc",
      linkColor: "#0066cc",
      errorColor: "#cc0000",
      warningColor: "#ff6600",
      successColor: "#006600",
      fontFamily: "OpenDyslexic, Comic Sans MS, sans-serif",
      fontSize: 1.1,
      lineHeight: 1.8,
      letterSpacing: 1,
      wordSpacing: 1,
      spacing: 1.3,
      borderRadius: 0.5,
      shadows: true,
      focusIndicators: true,
      hoverStates: true,
      animations: false,
      transitions: true,
      imageFilters: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 0.9,
        grayscale: false,
      },
    },
  },
  {
    id: "low-vision",
    name: "Low Vision",
    description: "Enhanced for low vision users",
    type: "low-vision",
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      accentColor: "#0066cc",
      borderColor: "#000000",
      linkColor: "#0066cc",
      errorColor: "#cc0000",
      warningColor: "#ff6600",
      successColor: "#006600",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 1.5,
      lineHeight: 2.0,
      letterSpacing: 2,
      wordSpacing: 3,
      spacing: 1.5,
      borderRadius: 0,
      shadows: false,
      focusIndicators: true,
      hoverStates: false,
      animations: false,
      transitions: false,
      imageFilters: {
        brightness: 1.1,
        contrast: 1.3,
        saturation: 1.0,
        grayscale: false,
      },
    },
  },
];

// Visual Mode Engine Component
export const VisualModeEngine: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentMode, setCurrentMode] = useState<VisualMode | null>(
    BUILTIN_MODES[0],
  );
  const [customModes, setCustomModes] = useState<VisualMode[]>([]);
  const [settings, setSettings] = useState<VisualModeSettings>(
    BUILTIN_MODES[0].settings,
  );

  // Refs to prevent infinite loops
  const isInitialized = useRef(false);
  const mediaQueryRefs = useRef<
    { query: MediaQueryList; handler: () => void }[]
  >([]);

  // Memoize available modes to prevent unnecessary recalculations
  const availableModes = React.useMemo(
    () => [...BUILTIN_MODES, ...customModes],
    [customModes],
  );

  // Apply CSS custom properties when settings change - optimized to prevent memory leaks
  useEffect(() => {
    if (!isInitialized.current) return;

    try {
      const root = document.documentElement;

      // Apply color settings
      root.style.setProperty("--bg-color", settings.backgroundColor);
      root.style.setProperty("--text-color", settings.textColor);
      root.style.setProperty("--accent-color", settings.accentColor);
      root.style.setProperty("--border-color", settings.borderColor);
      root.style.setProperty("--link-color", settings.linkColor);
      root.style.setProperty("--error-color", settings.errorColor);
      root.style.setProperty("--warning-color", settings.warningColor);
      root.style.setProperty("--success-color", settings.successColor);

      // Apply typography settings
      root.style.setProperty("--font-family", settings.fontFamily);
      root.style.setProperty("--font-size", `${settings.fontSize}rem`);
      root.style.setProperty("--line-height", settings.lineHeight.toString());
      root.style.setProperty("--letter-spacing", `${settings.letterSpacing}px`);
      root.style.setProperty("--word-spacing", `${settings.wordSpacing}px`);

      // Apply layout settings
      root.style.setProperty("--spacing", `${settings.spacing}rem`);
      root.style.setProperty(
        "--border-radius",
        `${settings.borderRadius * 0.5}rem`,
      );
      root.style.setProperty("--shadows", settings.shadows ? "1" : "0");

      // Apply image filters
      root.style.setProperty(
        "--img-brightness",
        settings.imageFilters.brightness.toString(),
      );
      root.style.setProperty(
        "--img-contrast",
        settings.imageFilters.contrast.toString(),
      );
      root.style.setProperty(
        "--img-saturation",
        settings.imageFilters.saturation.toString(),
      );
      root.style.setProperty(
        "--img-grayscale",
        settings.imageFilters.grayscale ? "1" : "0",
      );

      // Apply global styles
      applyGlobalStyles(settings);
    } catch (error) {
      console.warn("Failed to apply visual mode settings:", error);
    }
  }, [settings]);

  // Apply global CSS styles - optimized
  const applyGlobalStyles = useCallback((settings: VisualModeSettings) => {
    try {
      const styleId = "visual-mode-styles";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      const css = `
        /* Base styles */
        body {
          background-color: ${settings.backgroundColor} !important;
          color: ${settings.textColor} !important;
          font-family: ${settings.fontFamily} !important;
          font-size: ${settings.fontSize}rem !important;
          line-height: ${settings.lineHeight} !important;
          letter-spacing: ${settings.letterSpacing}px !important;
          word-spacing: ${settings.wordSpacing}px !important;
        }
        
        /* Typography scale */
        h1 { font-size: ${2.5 * settings.fontSize}rem !important; }
        h2 { font-size: ${2 * settings.fontSize}rem !important; }
        h3 { font-size: ${1.5 * settings.fontSize}rem !important; }
        h4 { font-size: ${1.25 * settings.fontSize}rem !important; }
        h5 { font-size: ${1.125 * settings.fontSize}rem !important; }
        h6 { font-size: ${settings.fontSize}rem !important; }
        
        /* Links */
        a {
          color: ${settings.linkColor} !important;
          text-decoration: underline !important;
        }
        
        a:hover {
          ${settings.hoverStates ? `color: ${settings.accentColor} !important;` : ""}
          ${settings.transitions ? "transition: color 0.2s ease !important;" : ""}
        }
        
        /* Form elements */
        input, textarea, select {
          background-color: ${settings.backgroundColor} !important;
          color: ${settings.textColor} !important;
          border: 2px solid ${settings.borderColor} !important;
          font-family: ${settings.fontFamily} !important;
          font-size: ${settings.fontSize}rem !important;
        }
        
        input:focus, textarea:focus, select:focus {
          ${settings.focusIndicators ? `border-color: ${settings.accentColor} !important; outline: 2px solid ${settings.accentColor} !important;` : ""}
        }
        
        /* Buttons */
        button {
          background-color: ${settings.accentColor} !important;
          color: ${settings.backgroundColor} !important;
          border: none !important;
          font-family: ${settings.fontFamily} !important;
          font-size: ${settings.fontSize}rem !important;
          border-radius: ${settings.borderRadius * 0.5}rem !important;
        }
        
        button:hover {
          ${settings.hoverStates ? "opacity: 0.8 !important;" : ""}
          ${settings.transitions ? "transition: opacity 0.2s ease !important;" : ""}
        }
        
        /* Focus indicators */
        *:focus {
          ${settings.focusIndicators ? `outline: 3px solid ${settings.accentColor} !important; outline-offset: 2px !important;` : ""}
        }
        
        /* Images */
        img {
          filter: brightness(${settings.imageFilters.brightness}) contrast(${settings.imageFilters.contrast}) saturate(${settings.imageFilters.saturation}) ${settings.imageFilters.grayscale ? "grayscale(100%)" : ""} !important;
        }
        
        /* Animations */
        ${!settings.animations ? "* { animation: none !important; }" : ""}
        ${!settings.transitions ? "* { transition: none !important; }" : ""}
        
        /* Shadows */
        ${!settings.shadows ? "* { box-shadow: none !important; text-shadow: none !important; }" : ""}
        
        /* Spacing */
        * {
          --spacing: ${settings.spacing}rem;
        }
        
        /* Error states */
        .error, .error-message {
          color: ${settings.errorColor} !important;
          border-color: ${settings.errorColor} !important;
        }
        
        /* Warning states */
        .warning, .warning-message {
          color: ${settings.warningColor} !important;
          border-color: ${settings.warningColor} !important;
        }
        
        /* Success states */
        .success, .success-message {
          color: ${settings.successColor} !important;
          border-color: ${settings.successColor} !important;
        }
      `;

      styleElement.textContent = css;
    } catch (error) {
      console.warn("Failed to apply global styles:", error);
    }
  }, []);

  // Mode management - optimized
  const setMode = useCallback(
    (modeId: string) => {
      const allModes = availableModes;
      const mode = allModes.find((m) => m.id === modeId);

      if (mode) {
        setCurrentMode(mode);
        setSettings(mode.settings);

        // Save to localStorage with error handling
        try {
          localStorage.setItem("visual-mode", modeId);
        } catch (error) {
          console.warn("Failed to save visual mode to localStorage:", error);
        }
      }
    },
    [availableModes],
  );

  const resetMode = useCallback(() => {
    setMode("default");
  }, [setMode]);

  // Custom mode management - optimized
  const createCustomMode = useCallback((mode: Omit<VisualMode, "id">) => {
    const newMode: VisualMode = {
      ...mode,
      id: `custom-${Date.now()}`,
    };

    setCustomModes((prev) => [...prev, newMode]);

    // Save to localStorage with error handling
    try {
      const savedModes = JSON.parse(
        localStorage.getItem("custom-visual-modes") || "[]",
      );
      savedModes.push(newMode);
      localStorage.setItem("custom-visual-modes", JSON.stringify(savedModes));
    } catch (error) {
      console.warn("Failed to save custom mode to localStorage:", error);
    }
  }, []);

  const updateCustomMode = useCallback(
    (modeId: string, newSettings: Partial<VisualModeSettings>) => {
      setCustomModes((prev) =>
        prev.map((mode) =>
          mode.id === modeId
            ? { ...mode, settings: { ...mode.settings, ...newSettings } }
            : mode,
        ),
      );

      // Update current mode if it's the one being modified
      if (currentMode?.id === modeId) {
        setSettings((prev) => ({ ...prev, ...newSettings }));
      }

      // Save to localStorage with error handling
      try {
        const savedModes = JSON.parse(
          localStorage.getItem("custom-visual-modes") || "[]",
        );
        const modeIndex = savedModes.findIndex(
          (m: VisualMode) => m.id === modeId,
        );
        if (modeIndex >= 0) {
          savedModes[modeIndex].settings = {
            ...savedModes[modeIndex].settings,
            ...newSettings,
          };
          localStorage.setItem(
            "custom-visual-modes",
            JSON.stringify(savedModes),
          );
        }
      } catch (error) {
        console.warn("Failed to update custom mode in localStorage:", error);
      }
    },
    [currentMode],
  );

  const deleteCustomMode = useCallback(
    (modeId: string) => {
      setCustomModes((prev) => prev.filter((mode) => mode.id !== modeId));

      // Save to localStorage with error handling
      try {
        const savedModes = JSON.parse(
          localStorage.getItem("custom-visual-modes") || "[]",
        );
        const filteredModes = savedModes.filter(
          (m: VisualMode) => m.id !== modeId,
        );
        localStorage.setItem(
          "custom-visual-modes",
          JSON.stringify(filteredModes),
        );
      } catch (error) {
        console.warn("Failed to delete custom mode from localStorage:", error);
      }

      // Reset to default if deleting current mode
      if (currentMode?.id === modeId) {
        resetMode();
      }
    },
    [currentMode, resetMode],
  );

  // Settings update - optimized
  const updateSettings = useCallback(
    (newSettings: Partial<VisualModeSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  // System preference detection - optimized to prevent circular dependencies
  const detectSystemPreferences = useCallback(() => {
    try {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        updateSettings({
          animations: false,
          transitions: false,
        });
      }

      // Check for high contrast preference
      const prefersHighContrast = window.matchMedia(
        "(prefers-contrast: high)",
      ).matches;
      if (prefersHighContrast) {
        const highContrastMode = BUILTIN_MODES.find(
          (mode) => mode.id === "high-contrast",
        );
        if (highContrastMode) {
          setCurrentMode(highContrastMode);
          setSettings(highContrastMode.settings);
        }
      }

      // Check for dark mode preference
      const prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDarkMode) {
        updateSettings({
          backgroundColor: "#1a1a1a",
          textColor: "#ffffff",
        });
      }
    } catch (error) {
      console.warn("Failed to detect system preferences:", error);
    }
  }, [updateSettings]);

  // Apply system theme - optimized
  const applySystemTheme = useCallback(() => {
    detectSystemPreferences();
  }, [detectSystemPreferences]);

  // Initialize and load saved preferences - optimized to prevent infinite loops
  useEffect(() => {
    if (isInitialized.current) return;

    try {
      // Load saved mode
      const savedMode = localStorage.getItem("visual-mode");
      if (savedMode) {
        const mode = availableModes.find((m) => m.id === savedMode);
        if (mode) {
          setCurrentMode(mode);
          setSettings(mode.settings);
        }
      }

      // Load custom modes
      const savedCustomModes = JSON.parse(
        localStorage.getItem("custom-visual-modes") || "[]",
      );
      setCustomModes(savedCustomModes);

      // Detect system preferences
      detectSystemPreferences();

      // Set up media query listeners with proper cleanup
      const mediaQueries = [
        {
          query: window.matchMedia("(prefers-reduced-motion: reduce)"),
          handler: detectSystemPreferences,
        },
        {
          query: window.matchMedia("(prefers-contrast: high)"),
          handler: detectSystemPreferences,
        },
        {
          query: window.matchMedia("(prefers-color-scheme: dark)"),
          handler: detectSystemPreferences,
        },
      ];

      mediaQueries.forEach(({ query, handler }) => {
        if (query.addEventListener) {
          query.addEventListener("change", handler);
          mediaQueryRefs.current.push({ query, handler });
        }
      });

      isInitialized.current = true;
    } catch (error) {
      console.warn("Failed to initialize visual mode engine:", error);
      isInitialized.current = true; // Still mark as initialized to prevent retry loops
    }

    // Cleanup function
    return () => {
      mediaQueryRefs.current.forEach(({ query, handler }) => {
        if (query.removeEventListener) {
          query.removeEventListener("change", handler);
        }
      });
      mediaQueryRefs.current = [];
    };
  }, []); // Empty dependency array to prevent infinite loops

  const contextValue: VisualModeContextType = {
    currentMode,
    availableModes,
    setMode,
    resetMode,
    createCustomMode,
    updateCustomMode,
    deleteCustomMode,
    settings,
    updateSettings,
    detectSystemPreferences,
    applySystemTheme,
  };

  return (
    <VisualModeContext.Provider value={contextValue}>
      {children}
    </VisualModeContext.Provider>
  );
};

// Hook
export const useVisualMode = (): VisualModeContextType => {
  const context = React.useContext(VisualModeContext);
  if (!context) {
    throw new Error("useVisualMode must be used within VisualModeEngine");
  }
  return context;
};

// Visual Mode Selector Component
export const VisualModeSelector: React.FC = () => {
  const { currentMode, availableModes, setMode } = useVisualMode();

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Visual Mode</h3>

      <div className="space-y-2">
        {availableModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={`w-full text-left p-3 rounded-md transition-colors ${
              currentMode?.id === mode.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="font-medium">{mode.name}</div>
            <div className="text-sm opacity-75">{mode.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VisualModeEngine;
