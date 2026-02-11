/**
 * Enhanced Theme Context with Multi-Theme Support
 * Supports light/dark mode + multiple theme palettes (white-label ready)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  ThemeMode,
  ThemeName,
  ThemeConfig,
  themes,
  getTheme,
  getThemeColors,
} from "@/config/themes";

interface EnhancedThemeContextType {
  mode: ThemeMode;
  themeName: ThemeName;
  resolvedMode: "light" | "dark";
  themeConfig: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setThemeName: (name: ThemeName) => void;
  toggleMode: () => void;
}

const EnhancedThemeContext = createContext<
  EnhancedThemeContextType | undefined
>(undefined);

const STORAGE_KEYS = {
  mode: "accubooks-theme-mode",
  name: "accubooks-theme-name",
} as const;

interface EnhancedThemeProviderProps {
  children: ReactNode;
}

export function EnhancedThemeProvider({
  children,
}: EnhancedThemeProviderProps) {
  // Load saved preferences
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.mode);
    return (saved as ThemeMode) || "system";
  });

  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.name);
    return (saved as ThemeName) || "default";
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  // Resolve system preference
  useEffect(() => {
    const updateResolvedMode = () => {
      if (mode === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setResolvedMode(systemPrefersDark ? "dark" : "light");
      } else {
        setResolvedMode(mode as "light" | "dark");
      }
    };

    updateResolvedMode();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateResolvedMode();
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = getTheme(themeName);
    const colors = getThemeColors(themeName, resolvedMode);

    // Apply dark class
    if (resolvedMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply border radius
    Object.entries(themeConfig.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply shadows
    Object.entries(themeConfig.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply typography
    root.style.setProperty("--font-family", themeConfig.typography.fontFamily);
    root.style.setProperty(
      "--font-family-heading",
      themeConfig.typography.fontFamilyHeading,
    );

    // Store theme name as data attribute for debugging
    root.setAttribute("data-theme", themeName);
    root.setAttribute("data-mode", resolvedMode);
  }, [themeName, resolvedMode]);

  // Persist preferences
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.mode, newMode);
  };

  const setThemeName = (newName: ThemeName) => {
    setThemeNameState(newName);
    localStorage.setItem(STORAGE_KEYS.name, newName);
  };

  const toggleMode = () => {
    if (mode === "light") {
      setMode("dark");
    } else if (mode === "dark") {
      setMode("system");
    } else {
      setMode("light");
    }
  };

  const value: EnhancedThemeContextType = {
    mode,
    themeName,
    resolvedMode,
    themeConfig: getTheme(themeName),
    setMode,
    setThemeName,
    toggleMode,
  };

  return (
    <EnhancedThemeContext.Provider value={value}>
      {children}
    </EnhancedThemeContext.Provider>
  );
}

export function useEnhancedTheme() {
  const context = useContext(EnhancedThemeContext);
  if (context === undefined) {
    throw new Error(
      "useEnhancedTheme must be used within an EnhancedThemeProvider",
    );
  }
  return context;
}

// Backward compatibility hook
export function useTheme() {
  return useEnhancedTheme();
}
