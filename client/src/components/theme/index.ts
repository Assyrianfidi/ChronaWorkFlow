/**
 * Theme System Index
 * Export all theme-related components and utilities
 */

// Components
export { ThemeCustomizer } from './ThemeCustomizer';

// Re-export from config for convenience
export {
  PRESET_THEMES,
  getPresetThemeById,
  createCustomTheme,
  generateCSSVariables,
  BORDER_RADIUS_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SIZE_OPTIONS,
  SIDEBAR_STYLE_OPTIONS,
  SHADOW_OPTIONS,
} from '@/config/theme.config';

// Types
export type {
  ThemeColorPalette,
  ThemeTypography,
  ThemeLayout,
  ThemeSidebar,
  ThemeConfig,
  CustomerThemePreferences,
} from '@/config/theme.config';
