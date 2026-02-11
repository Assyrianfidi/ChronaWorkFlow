/**
 * CEO Theme System - Dark/Light/Auto with Boardroom Mode
 * AccuBooks Enterprise Executive UX Foundation
 * 
 * Features:
 * - Three theme modes: Light, Dark, Auto (system default)
 * - Boardroom Mode for presentations
 * - High-contrast, boardroom-safe palettes
 * - CSS custom properties for dynamic theming
 * - Feature flag controlled (ceo_themes_enabled)
 */

import React from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ViewMode = 'standard' | 'boardroom';

interface ColorPalette {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgOverlay: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Accents
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  accentInfo: string;
  
  // Borders
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  
  // Status
  statusHealthy: string;
  statusDegraded: string;
  statusCritical: string;
  statusUnknown: string;
  
  // Chart colors (for data viz)
  chartBlue: string;
  chartGreen: string;
  chartYellow: string;
  chartRed: string;
  chartPurple: string;
  chartOrange: string;
}

// Light theme - Professional, clean executive palette
const lightPalette: ColorPalette = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  bgElevated: '#FFFFFF',
  bgOverlay: 'rgba(15, 23, 42, 0.5)',
  
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  accentPrimary: '#2563EB',
  accentSecondary: '#7C3AED',
  accentSuccess: '#059669',
  accentWarning: '#D97706',
  accentDanger: '#DC2626',
  accentInfo: '#0891B2',
  
  borderSubtle: '#E2E8F0',
  borderDefault: '#CBD5E1',
  borderStrong: '#94A3B8',
  
  statusHealthy: '#10B981',
  statusDegraded: '#F59E0B',
  statusCritical: '#EF4444',
  statusUnknown: '#9CA3AF',
  
  chartBlue: '#2563EB',
  chartGreen: '#10B981',
  chartYellow: '#F59E0B',
  chartRed: '#EF4444',
  chartPurple: '#8B5CF6',
  chartOrange: '#F97316',
};

// Dark theme - Executive night mode, reduced eye strain
const darkPalette: ColorPalette = {
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgTertiary: '#334155',
  bgElevated: '#1E293B',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textInverse: '#0F172A',
  
  accentPrimary: '#3B82F6',
  accentSecondary: '#A855F7',
  accentSuccess: '#34D399',
  accentWarning: '#FBBF24',
  accentDanger: '#F87171',
  accentInfo: '#22D3EE',
  
  borderSubtle: '#334155',
  borderDefault: '#475569',
  borderStrong: '#64748B',
  
  statusHealthy: '#34D399',
  statusDegraded: '#FBBF24',
  statusCritical: '#F87171',
  statusUnknown: '#6B7280',
  
  chartBlue: '#3B82F6',
  chartGreen: '#34D399',
  chartYellow: '#FBBF24',
  chartRed: '#F87171',
  chartPurple: '#A78BFA',
  chartOrange: '#FB923C',
};

// Boardroom Light - High contrast, large-type optimized
const boardroomLightPalette: ColorPalette = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  bgElevated: '#FFFFFF',
  bgOverlay: 'rgba(17, 24, 39, 0.6)',
  
  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  accentPrimary: '#1D4ED8',
  accentSecondary: '#6D28D9',
  accentSuccess: '#047857',
  accentWarning: '#B45309',
  accentDanger: '#B91C1C',
  accentInfo: '#0E7490',
  
  borderSubtle: '#E5E7EB',
  borderDefault: '#D1D5DB',
  borderStrong: '#9CA3AF',
  
  statusHealthy: '#059669',
  statusDegraded: '#D97706',
  statusCritical: '#DC2626',
  statusUnknown: '#6B7280',
  
  chartBlue: '#1D4ED8',
  chartGreen: '#059669',
  chartYellow: '#D97706',
  chartRed: '#DC2626',
  chartPurple: '#7C3AED',
  chartOrange: '#EA580C',
};

// Boardroom Dark - Presentation mode, TV optimized
const boardroomDarkPalette: ColorPalette = {
  bgPrimary: '#020617',
  bgSecondary: '#0F172A',
  bgTertiary: '#1E293B',
  bgElevated: '#0F172A',
  bgOverlay: 'rgba(0, 0, 0, 0.8)',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textTertiary: '#64748B',
  textInverse: '#020617',
  
  accentPrimary: '#60A5FA',
  accentSecondary: '#C084FC',
  accentSuccess: '#4ADE80',
  accentWarning: '#FACC15',
  accentDanger: '#FCA5A5',
  accentInfo: '#67E8F9',
  
  borderSubtle: '#1E293B',
  borderDefault: '#334155',
  borderStrong: '#475569',
  
  statusHealthy: '#4ADE80',
  statusDegraded: '#FACC15',
  statusCritical: '#FCA5A5',
  statusUnknown: '#6B7280',
  
  chartBlue: '#60A5FA',
  chartGreen: '#4ADE80',
  chartYellow: '#FACC15',
  chartRed: '#FCA5A5',
  chartPurple: '#C084FC',
  chartOrange: '#FDBA74',
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeMode = 'auto';
  private viewMode: ViewMode = 'standard';
  private listeners: Set<(theme: ThemeMode, viewMode: ViewMode, palette: ColorPalette) => void> = new Set();

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Detect system preference
  private getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Get effective theme (resolves 'auto' to light/dark)
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.getSystemPreference();
    }
    return this.currentTheme;
  }

  // Get current color palette
  getPalette(): ColorPalette {
    const effectiveTheme = this.getEffectiveTheme();
    
    if (this.viewMode === 'boardroom') {
      return effectiveTheme === 'dark' ? boardroomDarkPalette : boardroomLightPalette;
    }
    
    return effectiveTheme === 'dark' ? darkPalette : lightPalette;
  }

  // Set theme mode
  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    this.applyTheme();
    this.notifyListeners();
    this.persistPreference();
  }

  // Set view mode (standard or boardroom)
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.applyTheme();
    this.notifyListeners();
    this.persistPreference();
  }

  // Toggle between light and dark
  toggleTheme(): void {
    const effective = this.getEffectiveTheme();
    this.setTheme(effective === 'dark' ? 'light' : 'dark');
  }

  // Toggle boardroom mode
  toggleBoardroomMode(): void {
    this.setViewMode(this.viewMode === 'boardroom' ? 'standard' : 'boardroom');
  }

  // Apply theme to DOM
  private applyTheme(): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const palette = this.getPalette();
    const effectiveTheme = this.getEffectiveTheme();
    
    // Set data attributes for CSS selectors
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-view-mode', this.viewMode);
    
    // Apply CSS custom properties
    Object.entries(palette).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Add/remove boardroom class for font sizing
    if (this.viewMode === 'boardroom') {
      root.classList.add('boardroom-mode');
    } else {
      root.classList.remove('boardroom-mode');
    }
  }

  // Subscribe to theme changes
  subscribe(callback: (theme: ThemeMode, viewMode: ViewMode, palette: ColorPalette) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentTheme, this.viewMode, this.getPalette()));
  }

  // Persist to localStorage
  private persistPreference(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('accubooks-theme', JSON.stringify({
      theme: this.currentTheme,
      viewMode: this.viewMode,
    }));
  }

  // Restore from localStorage
  restorePreference(): void {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('accubooks-theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentTheme = parsed.theme || 'auto';
        this.viewMode = parsed.viewMode || 'standard';
        this.applyTheme();
      } catch (e) {
        console.warn('Failed to restore theme preference');
      }
    }
  }

  // Listen for system theme changes
  watchSystemPreference(): void {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme();
        this.notifyListeners();
      }
    });
  }

  // Get current state
  getState(): { theme: ThemeMode; viewMode: ViewMode; palette: ColorPalette } {
    return {
      theme: this.currentTheme,
      viewMode: this.viewMode,
      palette: this.getPalette(),
    };
  }
}

// React hook for theme
export function useTheme() {
  const [state, setState] = React.useState(() => ThemeManager.getInstance().getState());
  
  React.useEffect(() => {
    const manager = ThemeManager.getInstance();
    manager.restorePreference();
    manager.watchSystemPreference();
    
    const unsubscribe = manager.subscribe((theme, viewMode, palette) => {
      setState({ theme, viewMode, palette });
    });
    
    return unsubscribe;
  }, []);
  
  const setTheme = React.useCallback((theme: ThemeMode) => {
    ThemeManager.getInstance().setTheme(theme);
  }, []);
  
  const setViewMode = React.useCallback((mode: ViewMode) => {
    ThemeManager.getInstance().setViewMode(mode);
  }, []);
  
  const toggleTheme = React.useCallback(() => {
    ThemeManager.getInstance().toggleTheme();
  }, []);
  
  const toggleBoardroomMode = React.useCallback(() => {
    ThemeManager.getInstance().toggleBoardroomMode();
  }, []);
  
  return {
    ...state,
    setTheme,
    setViewMode,
    toggleTheme,
    toggleBoardroomMode,
    isDark: state.palette.bgPrimary === '#0F172A' || state.palette.bgPrimary === '#020617',
    isBoardroom: state.viewMode === 'boardroom',
  };
}

export { lightPalette, darkPalette, boardroomLightPalette, boardroomDarkPalette };
export type { ColorPalette };
