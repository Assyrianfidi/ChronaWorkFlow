/**
 * AccuBooks Theme Context - Comprehensive Customer Theme Customization
 * Replaces basic light/dark with full theme system including colors, typography, layout
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import {
  ThemeConfig,
  PRESET_THEMES,
  CustomerThemePreferences,
  getPresetThemeById,
  createCustomTheme as createCustomThemeConfig,
  generateCSSVariables,
} from "@/config/theme.config";

// ============================================================================
// LEGACY TYPE SUPPORT (for backward compatibility)
// ============================================================================

type LegacyTheme = "light" | "dark" | "system";

// ============================================================================
// STORAGE KEYS
// ============================================================================

const THEME_STORAGE_KEY = "accubooks-theme-v2";
const CUSTOM_THEMES_KEY = "accubooks-custom-themes";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface ThemeContextType {
  // Current theme
  currentTheme: ThemeConfig;
  isDark: boolean;

  // Legacy support
  theme: LegacyTheme;
  setLegacyTheme: (theme: LegacyTheme) => void;
  resolvedTheme: "light" | "dark";

  // Theme switching
  setTheme: (themeId: string) => void;
  applyPresetTheme: (themeId: string) => void;

  // Customization
  updateThemeColors: (colors: Partial<ThemeConfig["colors"]>) => void;
  updateThemeTypography: (
    typography: Partial<ThemeConfig["typography"]>,
  ) => void;
  updateThemeLayout: (layout: Partial<ThemeConfig["layout"]>) => void;
  updateThemeSidebar: (sidebar: Partial<ThemeConfig["sidebar"]>) => void;

  // Custom theme creation
  createCustomTheme: (name: string, baseThemeId: string) => void;
  deleteCustomTheme: (themeId: string) => void;
  resetToDefault: () => void;

  // Available themes
  presetThemes: ThemeConfig[];
  customThemes: ThemeConfig[];

  // Loading state
  isLoading: boolean;
}

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// THEME PROVIDER COMPONENT
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: string;
}

export function ThemeProvider({
  children,
  defaultThemeId = "modern-light",
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(
    PRESET_THEMES[0],
  );
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [legacyTheme, setLegacyThemeState] = useState<LegacyTheme>("system");

  // Load theme from localStorage on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        // Check for new theme system first
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          const prefs: CustomerThemePreferences = JSON.parse(stored);

          // Check if it's a custom theme
          if (prefs.themeId.startsWith("custom-")) {
            const savedCustomThemes = localStorage.getItem(CUSTOM_THEMES_KEY);
            if (savedCustomThemes) {
              const parsed = JSON.parse(savedCustomThemes);
              const customTheme = parsed.find(
                (t: ThemeConfig) => t.id === prefs.themeId,
              );
              if (customTheme) {
                setCurrentTheme(customTheme);
              } else {
                const preset =
                  getPresetThemeById(prefs.themeId) || PRESET_THEMES[0];
                setCurrentTheme(preset);
              }
            }
          } else {
            // It's a preset theme - apply any customizations
            const preset =
              getPresetThemeById(prefs.themeId) || PRESET_THEMES[0];

            if (
              prefs.customColors ||
              prefs.customTypography ||
              prefs.customLayout ||
              prefs.customSidebar
            ) {
              setCurrentTheme({
                ...preset,
                isCustom: true,
                colors: { ...preset.colors, ...prefs.customColors },
                typography: { ...preset.typography, ...prefs.customTypography },
                layout: { ...preset.layout, ...prefs.customLayout },
                sidebar: { ...preset.sidebar, ...prefs.customSidebar },
              });
            } else {
              setCurrentTheme(preset);
            }
          }
        } else {
          // Check for legacy theme
          const legacy = localStorage.getItem("accubooks-theme");
          if (legacy) {
            setLegacyThemeState(legacy as LegacyTheme);
            // Map legacy to new themes
            if (legacy === "dark") {
              setCurrentTheme(
                getPresetThemeById("modern-dark") || PRESET_THEMES[1],
              );
            } else {
              setCurrentTheme(
                getPresetThemeById(defaultThemeId) || PRESET_THEMES[0],
              );
            }
          } else {
            // No stored theme, use default
            const defaultTheme =
              getPresetThemeById(defaultThemeId) || PRESET_THEMES[0];
            setCurrentTheme(defaultTheme);
          }
        }

        // Load custom themes
        const savedCustomThemes = localStorage.getItem(CUSTOM_THEMES_KEY);
        if (savedCustomThemes) {
          setCustomThemes(JSON.parse(savedCustomThemes));
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
        setCurrentTheme(PRESET_THEMES[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [defaultThemeId]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (!currentTheme || isLoading) return;

    const root = document.documentElement;

    // Generate and apply CSS variables
    const cssVars = generateCSSVariables(currentTheme);

    cssVars.split(";").forEach((variable) => {
      const [key, value] = variable.split(":").map((s) => s.trim());
      if (key && value) {
        root.style.setProperty(key, value);
      }
    });

    // Apply typography
    const { typography } = currentTheme;
    root.style.setProperty("--font-family", typography.fontFamily);

    const fontSizes: Record<string, string> = {
      small: "14px",
      default: "16px",
      large: "18px",
    };
    root.style.setProperty(
      "--font-size-base",
      fontSizes[typography.fontSize] || "16px",
    );

    // Apply letter spacing
    const letterSpacings: Record<string, string> = {
      tight: "-0.025em",
      default: "0",
      wide: "0.025em",
    };
    root.style.setProperty(
      "--letter-spacing",
      letterSpacings[typography.letterSpacing] || "0",
    );

    // Apply dark mode class
    if (currentTheme.isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    // Save to localStorage
    const prefs: CustomerThemePreferences = {
      themeId: currentTheme.id,
      customColors: currentTheme.isCustom ? currentTheme.colors : undefined,
      customTypography: currentTheme.isCustom
        ? currentTheme.typography
        : undefined,
      customLayout: currentTheme.isCustom ? currentTheme.layout : undefined,
      customSidebar: currentTheme.isCustom ? currentTheme.sidebar : undefined,
      lastModified: new Date(),
      modifiedBy: "user",
    };

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
  }, [currentTheme, isLoading]);

  // ============================================================================
  // THEME ACTIONS
  // ============================================================================

  const setTheme = useCallback(
    (themeId: string) => {
      const theme = getPresetThemeById(themeId);
      if (theme) {
        setCurrentTheme(theme);
      } else {
        // Check custom themes
        const custom = customThemes.find((t) => t.id === themeId);
        if (custom) {
          setCurrentTheme(custom);
        }
      }
    },
    [customThemes],
  );

  const applyPresetTheme = useCallback((themeId: string) => {
    const theme = getPresetThemeById(themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  }, []);

  const setLegacyTheme = useCallback((theme: LegacyTheme) => {
    setLegacyThemeState(theme);
    localStorage.setItem("accubooks-theme", theme);

    // Map to new theme system
    if (theme === "dark") {
      setCurrentTheme(getPresetThemeById("modern-dark") || PRESET_THEMES[1]);
    } else if (theme === "light") {
      setCurrentTheme(getPresetThemeById("modern-light") || PRESET_THEMES[0]);
    }
    // 'system' will use current theme
  }, []);

  const updateThemeColors = useCallback(
    (colors: Partial<ThemeConfig["colors"]>) => {
      setCurrentTheme((prev) => ({
        ...prev,
        isCustom: true,
        colors: { ...prev.colors, ...colors },
      }));
    },
    [],
  );

  const updateThemeTypography = useCallback(
    (typography: Partial<ThemeConfig["typography"]>) => {
      setCurrentTheme((prev) => ({
        ...prev,
        isCustom: true,
        typography: { ...prev.typography, ...typography },
      }));
    },
    [],
  );

  const updateThemeLayout = useCallback(
    (layout: Partial<ThemeConfig["layout"]>) => {
      setCurrentTheme((prev) => ({
        ...prev,
        isCustom: true,
        layout: { ...prev.layout, ...layout },
      }));
    },
    [],
  );

  const updateThemeSidebar = useCallback(
    (sidebar: Partial<ThemeConfig["sidebar"]>) => {
      setCurrentTheme((prev) => ({
        ...prev,
        isCustom: true,
        sidebar: { ...prev.sidebar, ...sidebar },
      }));
    },
    [],
  );

  const handleCreateCustomTheme = useCallback(
    (name: string, baseThemeId: string) => {
      const newTheme = createCustomThemeConfig(baseThemeId, {
        name,
      });

      setCustomThemes((prev) => {
        const updated = [...prev, newTheme];
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));
        return updated;
      });

      setCurrentTheme(newTheme);
    },
    [],
  );

  const deleteCustomTheme = useCallback(
    (themeId: string) => {
      setCustomThemes((prev) => {
        const updated = prev.filter((t) => t.id !== themeId);
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));
        return updated;
      });

      // If currently using this theme, switch to default
      if (currentTheme.id === themeId) {
        setCurrentTheme(PRESET_THEMES[0]);
      }
    },
    [currentTheme.id],
  );

  const resetToDefault = useCallback(() => {
    const defaultTheme = getPresetThemeById("modern-light") || PRESET_THEMES[0];
    setCurrentTheme(defaultTheme);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_THEMES_KEY);
    setCustomThemes([]);
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ThemeContextType = {
    currentTheme,
    isDark: currentTheme?.isDark || false,
    theme: legacyTheme,
    setLegacyTheme,
    resolvedTheme: currentTheme?.isDark ? "dark" : "light",
    setTheme,
    applyPresetTheme,
    updateThemeColors,
    updateThemeTypography,
    updateThemeLayout,
    updateThemeSidebar,
    createCustomTheme: handleCreateCustomTheme,
    deleteCustomTheme,
    resetToDefault,
    presetThemes: PRESET_THEMES,
    customThemes,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ============================================================================
// USE THEME HOOK
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
