/**
 * Multi-Theme Configuration System
 * Supports white-label theming with token-based design
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeName = 'default' | 'blue' | 'neutral';

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Background colors
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border colors
  border: string;
  borderLight: string;
  borderHeavy: string;

  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartQuaternary: string;
  chartQuinary: string;
}

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  light: ThemeColors;
  dark: ThemeColors;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyHeading: string;
  };
}

// Default Theme (AccuBooks Green)
const defaultTheme: ThemeConfig = {
  name: 'default',
  displayName: 'AccuBooks Green',
  light: {
    primary: '#22c55e',
    primaryHover: '#16a34a',
    primaryActive: '#15803d',
    primaryLight: '#86efac',
    primaryDark: '#166534',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    surfaceActive: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderHeavy: '#d1d5db',
    chartPrimary: '#22c55e',
    chartSecondary: '#3b82f6',
    chartTertiary: '#f59e0b',
    chartQuaternary: '#8b5cf6',
    chartQuinary: '#ec4899',
  },
  dark: {
    primary: '#22c55e',
    primaryHover: '#4ade80',
    primaryActive: '#86efac',
    primaryLight: '#166534',
    primaryDark: '#dcfce7',
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    surfaceActive: '#475569',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textInverse: '#0f172a',
    border: '#334155',
    borderLight: '#1e293b',
    borderHeavy: '#475569',
    chartPrimary: '#4ade80',
    chartSecondary: '#60a5fa',
    chartTertiary: '#fbbf24',
    chartQuaternary: '#a78bfa',
    chartQuinary: '#f472b6',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyHeading: 'Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

// Blue Theme
const blueTheme: ThemeConfig = {
  name: 'blue',
  displayName: 'Professional Blue',
  light: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    primaryLight: '#93c5fd',
    primaryDark: '#1e40af',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    surfaceActive: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderHeavy: '#d1d5db',
    chartPrimary: '#3b82f6',
    chartSecondary: '#10b981',
    chartTertiary: '#f59e0b',
    chartQuaternary: '#8b5cf6',
    chartQuinary: '#ec4899',
  },
  dark: {
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryActive: '#93c5fd',
    primaryLight: '#1e40af',
    primaryDark: '#dbeafe',
    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    surfaceActive: '#475569',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textInverse: '#0f172a',
    border: '#334155',
    borderLight: '#1e293b',
    borderHeavy: '#475569',
    chartPrimary: '#60a5fa',
    chartSecondary: '#34d399',
    chartTertiary: '#fbbf24',
    chartQuaternary: '#a78bfa',
    chartQuinary: '#f472b6',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

// Neutral Theme (Enterprise Gray)
const neutralTheme: ThemeConfig = {
  name: 'neutral',
  displayName: 'Enterprise Neutral',
  light: {
    primary: '#64748b',
    primaryHover: '#475569',
    primaryActive: '#334155',
    primaryLight: '#cbd5e1',
    primaryDark: '#1e293b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    surfaceActive: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderHeavy: '#d1d5db',
    chartPrimary: '#64748b',
    chartSecondary: '#3b82f6',
    chartTertiary: '#f59e0b',
    chartQuaternary: '#8b5cf6',
    chartQuinary: '#ec4899',
  },
  dark: {
    primary: '#94a3b8',
    primaryHover: '#cbd5e1',
    primaryActive: '#e2e8f0',
    primaryLight: '#334155',
    primaryDark: '#f1f5f9',
    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    surfaceActive: '#475569',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textInverse: '#0f172a',
    border: '#334155',
    borderLight: '#1e293b',
    borderHeavy: '#475569',
    chartPrimary: '#94a3b8',
    chartSecondary: '#60a5fa',
    chartTertiary: '#fbbf24',
    chartQuaternary: '#a78bfa',
    chartQuinary: '#f472b6',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const themes: Record<ThemeName, ThemeConfig> = {
  default: defaultTheme,
  blue: blueTheme,
  neutral: neutralTheme,
};

export const getTheme = (name: ThemeName): ThemeConfig => {
  return themes[name] || themes.default;
};

export const getThemeColors = (name: ThemeName, mode: 'light' | 'dark'): ThemeColors => {
  const theme = getTheme(name);
  return theme[mode];
};
