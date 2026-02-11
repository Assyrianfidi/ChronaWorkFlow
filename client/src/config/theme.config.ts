/**
 * AccuBooks Customizable Theme System
 * Customer-facing theme configuration with preset themes and custom color options
 */

// ============================================================================
// THEME COLOR PALETTE TYPES
// ============================================================================

export interface ThemeColorPalette {
  // Primary brand color (buttons, links, accents)
  primary: string;
  primaryForeground: string;

  // Secondary color (subtle accents)
  secondary: string;
  secondaryForeground: string;

  // Background colors
  background: string;
  foreground: string;

  // Card/surface colors
  card: string;
  cardForeground: string;

  // Popover/dropdown colors
  popover: string;
  popoverForeground: string;

  // Muted/subtle colors
  muted: string;
  mutedForeground: string;

  // Accent/hover colors
  accent: string;
  accentForeground: string;

  // Destructive/error colors
  destructive: string;
  destructiveForeground: string;

  // Border and input colors
  border: string;
  input: string;
  ring: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

// ============================================================================
// TYPOGRAPHY SETTINGS
// ============================================================================

export interface ThemeTypography {
  fontFamily: string;
  fontSize: "small" | "default" | "large";
  fontWeight: "light" | "normal" | "medium" | "semibold";
  lineHeight: "compact" | "default" | "relaxed";
  letterSpacing: "tight" | "default" | "wide";
}

// ============================================================================
// LAYOUT SETTINGS
// ============================================================================

export interface ThemeLayout {
  density: "compact" | "default" | "comfortable";
  sidebarWidth: "narrow" | "default" | "wide";
  borderRadius: "none" | "small" | "default" | "large" | "full";
  shadows: "none" | "subtle" | "default" | "prominent";
}

// ============================================================================
// SIDEBAR STYLES
// ============================================================================

export interface ThemeSidebar {
  style: "default" | "floating" | "inset" | "minimal";
  position: "left" | "right";
  showIcons: boolean;
  showLabels: boolean;
  collapsedWidth: number;
  expandedWidth: number;
  background: string;
  foreground: string;
  accentColor: string;
}

// ============================================================================
// COMPLETE THEME CONFIGURATION
// ============================================================================

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  preview: string; // URL or gradient for preview
  isCustom: boolean;
  isDark: boolean;
  colors: ThemeColorPalette;
  typography: ThemeTypography;
  layout: ThemeLayout;
  sidebar: ThemeSidebar;
}

// ============================================================================
// CUSTOMER THEME PREFERENCES
// ============================================================================

export interface CustomerThemePreferences {
  themeId: string;
  customColors?: Partial<ThemeColorPalette>;
  customTypography?: Partial<ThemeTypography>;
  customLayout?: Partial<ThemeLayout>;
  customSidebar?: Partial<ThemeSidebar>;
  lastModified: Date;
  modifiedBy: string;
}

// ============================================================================
// PRESET THEMES
// ============================================================================

export const PRESET_THEMES: ThemeConfig[] = [
  // ========================================
  // MODERN LIGHT (Default QuickBooks-style)
  // ========================================
  {
    id: "modern-light",
    name: "Modern Light",
    description: "Clean, professional light theme with blue accents",
    preview: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #2f5bf2 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#2f5bf2",
      primaryForeground: "#ffffff",
      secondary: "#f1f5f9",
      secondaryForeground: "#1e293b",
      background: "#ffffff",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      popover: "#ffffff",
      popoverForeground: "#0f172a",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      accent: "#f1f5f9",
      accentForeground: "#1e293b",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#e2e8f0",
      input: "#e2e8f0",
      ring: "#2f5bf2",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "default",
      shadows: "subtle",
    },
    sidebar: {
      style: "default",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#ffffff",
      foreground: "#0f172a",
      accentColor: "#2f5bf2",
    },
  },

  // ========================================
  // MODERN DARK
  // ========================================
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Sleek dark theme for low-light environments",
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2f5bf2 100%)",
    isCustom: false,
    isDark: true,
    colors: {
      primary: "#3b82f6",
      primaryForeground: "#ffffff",
      secondary: "#1e293b",
      secondaryForeground: "#f8fafc",
      background: "#0f172a",
      foreground: "#f8fafc",
      card: "#1e293b",
      cardForeground: "#f8fafc",
      popover: "#1e293b",
      popoverForeground: "#f8fafc",
      muted: "#334155",
      mutedForeground: "#94a3b8",
      accent: "#334155",
      accentForeground: "#f8fafc",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#334155",
      input: "#334155",
      ring: "#3b82f6",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "default",
      shadows: "subtle",
    },
    sidebar: {
      style: "default",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#1e293b",
      foreground: "#f8fafc",
      accentColor: "#3b82f6",
    },
  },

  // ========================================
  // CLASSIC PROFESSIONAL
  // ========================================
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional accounting software look with warm grays",
    preview: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #52525b 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#52525b",
      primaryForeground: "#ffffff",
      secondary: "#f5f5f5",
      secondaryForeground: "#27272a",
      background: "#fafafa",
      foreground: "#18181b",
      card: "#ffffff",
      cardForeground: "#18181b",
      popover: "#ffffff",
      popoverForeground: "#18181b",
      muted: "#f5f5f5",
      mutedForeground: "#71717a",
      accent: "#f5f5f5",
      accentForeground: "#27272a",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "#e4e4e7",
      input: "#e4e4e7",
      ring: "#52525b",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#52525b",
    },
    typography: {
      fontFamily: "Georgia, serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "relaxed",
      letterSpacing: "default",
    },
    layout: {
      density: "comfortable",
      sidebarWidth: "wide",
      borderRadius: "small",
      shadows: "none",
    },
    sidebar: {
      style: "default",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 300,
      background: "#f5f5f5",
      foreground: "#27272a",
      accentColor: "#52525b",
    },
  },

  // ========================================
  // HIGH CONTRAST (Accessibility)
  // ========================================
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Maximum contrast for accessibility and readability",
    preview: "linear-gradient(135deg, #000000 0%, #ffffff 50%, #000000 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#000000",
      primaryForeground: "#ffffff",
      secondary: "#ffffff",
      secondaryForeground: "#000000",
      background: "#ffffff",
      foreground: "#000000",
      card: "#ffffff",
      cardForeground: "#000000",
      popover: "#ffffff",
      popoverForeground: "#000000",
      muted: "#f0f0f0",
      mutedForeground: "#404040",
      accent: "#ffff00",
      accentForeground: "#000000",
      destructive: "#cc0000",
      destructiveForeground: "#ffffff",
      border: "#000000",
      input: "#000000",
      ring: "#000000",
      success: "#006600",
      warning: "#cc9900",
      error: "#cc0000",
      info: "#0066cc",
    },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "large",
      fontWeight: "semibold",
      lineHeight: "relaxed",
      letterSpacing: "wide",
    },
    layout: {
      density: "comfortable",
      sidebarWidth: "wide",
      borderRadius: "none",
      shadows: "none",
    },
    sidebar: {
      style: "default",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 80,
      expandedWidth: 320,
      background: "#ffffff",
      foreground: "#000000",
      accentColor: "#000000",
    },
  },

  // ========================================
  // OCEAN BLUE
  // ========================================
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Calm, ocean-inspired blue tones",
    preview: "linear-gradient(135deg, #f0fdff 0%, #e0f9ff 50%, #0077b3 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#0077b3",
      primaryForeground: "#ffffff",
      secondary: "#e0f9ff",
      secondaryForeground: "#00334d",
      background: "#f0fdff",
      foreground: "#00334d",
      card: "#ffffff",
      cardForeground: "#00334d",
      popover: "#ffffff",
      popoverForeground: "#00334d",
      muted: "#e0f9ff",
      mutedForeground: "#006699",
      accent: "#b3f0ff",
      accentForeground: "#00334d",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "#b3f0ff",
      input: "#b3f0ff",
      ring: "#0077b3",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#0077b3",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "default",
      shadows: "subtle",
    },
    sidebar: {
      style: "floating",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#e0f9ff",
      foreground: "#00334d",
      accentColor: "#0077b3",
    },
  },

  // ========================================
  // FOREST GREEN
  // ========================================
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural green tones for a fresh look",
    preview: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #166534 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#166534",
      primaryForeground: "#ffffff",
      secondary: "#dcfce7",
      secondaryForeground: "#14532d",
      background: "#f0fdf4",
      foreground: "#14532d",
      card: "#ffffff",
      cardForeground: "#14532d",
      popover: "#ffffff",
      popoverForeground: "#14532d",
      muted: "#dcfce7",
      mutedForeground: "#15803d",
      accent: "#bbf7d0",
      accentForeground: "#14532d",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "#bbf7d0",
      input: "#bbf7d0",
      ring: "#166534",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#166534",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "default",
      shadows: "subtle",
    },
    sidebar: {
      style: "floating",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#dcfce7",
      foreground: "#14532d",
      accentColor: "#166534",
    },
  },

  // ========================================
  // MIDNIGHT PURPLE
  // ========================================
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Elegant dark theme with purple accents",
    preview: "linear-gradient(135deg, #1a103c 0%, #2d1b69 50%, #8b5cf6 100%)",
    isCustom: false,
    isDark: true,
    colors: {
      primary: "#8b5cf6",
      primaryForeground: "#ffffff",
      secondary: "#2d1b69",
      secondaryForeground: "#f3e8ff",
      background: "#1a103c",
      foreground: "#f3e8ff",
      card: "#2d1b69",
      cardForeground: "#f3e8ff",
      popover: "#2d1b69",
      popoverForeground: "#f3e8ff",
      muted: "#3d2468",
      mutedForeground: "#a78bfa",
      accent: "#4c1d95",
      accentForeground: "#f3e8ff",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#4c1d95",
      input: "#4c1d95",
      ring: "#8b5cf6",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#8b5cf6",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "normal",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "large",
      shadows: "prominent",
    },
    sidebar: {
      style: "inset",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#2d1b69",
      foreground: "#f3e8ff",
      accentColor: "#8b5cf6",
    },
  },

  // ========================================
  // QUICKBOOKS CLASSIC
  // ========================================
  {
    id: "quickbooks-classic",
    name: "QuickBooks Classic",
    description: "Familiar QuickBooks-style green theme",
    preview: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #2e7d32 100%)",
    isCustom: false,
    isDark: false,
    colors: {
      primary: "#2e7d32",
      primaryForeground: "#ffffff",
      secondary: "#e8f5e9",
      secondaryForeground: "#1b5e20",
      background: "#ffffff",
      foreground: "#212121",
      card: "#ffffff",
      cardForeground: "#212121",
      popover: "#ffffff",
      popoverForeground: "#212121",
      muted: "#f5f5f5",
      mutedForeground: "#757575",
      accent: "#e8f5e9",
      accentForeground: "#1b5e20",
      destructive: "#d32f2f",
      destructiveForeground: "#ffffff",
      border: "#e0e0e0",
      input: "#e0e0e0",
      ring: "#2e7d32",
      success: "#2e7d32",
      warning: "#f9a825",
      error: "#d32f2f",
      info: "#0288d1",
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "default",
      fontWeight: "medium",
      lineHeight: "default",
      letterSpacing: "default",
    },
    layout: {
      density: "default",
      sidebarWidth: "default",
      borderRadius: "small",
      shadows: "subtle",
    },
    sidebar: {
      style: "default",
      position: "left",
      showIcons: true,
      showLabels: true,
      collapsedWidth: 72,
      expandedWidth: 280,
      background: "#1b5e20",
      foreground: "#ffffff",
      accentColor: "#4caf50",
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPresetThemeById(id: string): ThemeConfig | undefined {
  return PRESET_THEMES.find((theme) => theme.id === id);
}

export function createCustomTheme(
  baseThemeId: string,
  customizations: {
    name: string;
    colors?: Partial<ThemeColorPalette>;
    typography?: Partial<ThemeTypography>;
    layout?: Partial<ThemeLayout>;
    sidebar?: Partial<ThemeSidebar>;
  },
): ThemeConfig {
  const baseTheme = getPresetThemeById(baseThemeId) || PRESET_THEMES[0];

  return {
    ...baseTheme,
    id: `custom-${Date.now()}`,
    name: customizations.name,
    description: "Custom theme based on " + baseTheme.name,
    isCustom: true,
    colors: {
      ...baseTheme.colors,
      ...customizations.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...customizations.typography,
    },
    layout: {
      ...baseTheme.layout,
      ...customizations.layout,
    },
    sidebar: {
      ...baseTheme.sidebar,
      ...customizations.sidebar,
    },
  };
}

export function generateCSSVariables(theme: ThemeConfig): string {
  const { colors, layout, sidebar } = theme;

  return `
    --background: ${colors.background};
    --foreground: ${colors.foreground};
    --card: ${colors.card};
    --card-foreground: ${colors.cardForeground};
    --popover: ${colors.popover};
    --popover-foreground: ${colors.popoverForeground};
    --primary: ${colors.primary};
    --primary-foreground: ${colors.primaryForeground};
    --secondary: ${colors.secondary};
    --secondary-foreground: ${colors.secondaryForeground};
    --muted: ${colors.muted};
    --muted-foreground: ${colors.mutedForeground};
    --accent: ${colors.accent};
    --accent-foreground: ${colors.accentForeground};
    --destructive: ${colors.destructive};
    --destructive-foreground: ${colors.destructiveForeground};
    --border: ${colors.border};
    --input: ${colors.input};
    --ring: ${colors.ring};
    --success: ${colors.success};
    --warning: ${colors.warning};
    --error: ${colors.error};
    --info: ${colors.info};
    --radius: ${getBorderRadiusValue(layout.borderRadius)};
    --sidebar-background: ${sidebar.background};
    --sidebar-foreground: ${sidebar.foreground};
    --sidebar-accent: ${sidebar.accentColor};
    --sidebar-width: ${sidebar.expandedWidth}px;
    --sidebar-collapsed-width: ${sidebar.collapsedWidth}px;
  `;
}

function getBorderRadiusValue(radius: string): string {
  const values: Record<string, string> = {
    none: "0px",
    small: "0.25rem",
    default: "0.5rem",
    large: "1rem",
    full: "9999px",
  };
  return values[radius] || "0.5rem";
}

export const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None (Square)", preview: "0px" },
  { value: "small", label: "Small", preview: "4px" },
  { value: "default", label: "Default", preview: "8px" },
  { value: "large", label: "Large", preview: "16px" },
  { value: "full", label: "Full (Rounded)", preview: "9999px" },
];

export const DENSITY_OPTIONS = [
  {
    value: "compact",
    label: "Compact",
    description: "Less padding, tighter spacing",
  },
  { value: "default", label: "Default", description: "Balanced spacing" },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "More padding, relaxed spacing",
  },
];

export const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small (14px)", description: "Compact text" },
  {
    value: "default",
    label: "Default (16px)",
    description: "Standard text size",
  },
  { value: "large", label: "Large (18px)", description: "Easier to read" },
];

export const SIDEBAR_STYLE_OPTIONS = [
  { value: "default", label: "Default", description: "Standard sidebar" },
  { value: "floating", label: "Floating", description: "Elevated with shadow" },
  { value: "inset", label: "Inset", description: "Embedded in layout" },
  { value: "minimal", label: "Minimal", description: "Clean, no background" },
];

export const SHADOW_OPTIONS = [
  { value: "none", label: "None", description: "Flat design" },
  { value: "subtle", label: "Subtle", description: "Soft shadows" },
  { value: "default", label: "Default", description: "Medium depth" },
  { value: "prominent", label: "Prominent", description: "Strong shadows" },
];

export default {
  PRESET_THEMES,
  getPresetThemeById,
  createCustomTheme,
  generateCSSVariables,
  BORDER_RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SIZE_OPTIONS,
  SIDEBAR_STYLE_OPTIONS,
  SHADOW_OPTIONS,
};
