// Enterprise Design System - AccuBooks
// Professional Navy & Ocean Blue-based palette optimized for business finance

export const enterpriseColors = {
  // Primary Brand Colors - Enterprise Navy & Ocean Blue
  primary: {
    50: '#f0f4ff',    // Lightest navy blue
    100: '#e0ecff',   // Very light navy blue
    200: '#c2d8ff',   // Light navy blue
    300: '#94bfff',   // Medium light navy blue
    400: '#5e92f3',   // Navy blue
    500: '#1E4DB7',   // Primary Enterprise Navy
    600: '#1a4099',   // Dark navy blue
    700: '#153380',   // Deep navy blue
    800: '#112966',   // Very deep navy blue
    900: '#0d1f4d',   // Darkest navy blue
  },
  
  // Accent Colors - Ocean Blue
  ocean: {
    50: '#f0fdff',    // Lightest ocean blue
    100: '#e0f9ff',   // Very light ocean blue
    200: '#b3f0ff',   // Light ocean blue
    300: '#66e2ff',   // Medium light ocean blue
    400: '#0092D1',   // Primary Ocean Blue
    500: '#0077b3',   // Ocean blue
    600: '#006699',   // Dark ocean blue
    700: '#005580',   // Deep ocean blue
    800: '#004466',   // Very deep ocean blue
    900: '#00334d',   // Darkest ocean blue
  },
  
  // Secondary Colors - Professional Gray Scale
  gray: {
    50: '#f8fafc',    // Lightest gray
    100: '#f1f5f9',   // Very light gray
    200: '#e2e8f0',   // Light gray
    300: '#cbd5e1',   // Medium light gray
    400: '#94a3b8',   // Medium gray
    500: '#64748b',   // Gray
    600: '#475569',   // Dark gray
    700: '#334155',   // Deep gray
    800: '#1e293b',   // Very deep gray
    900: '#0f172a',   // Darkest gray
  },

  // Background Gradients
  gradient: {
    navy: 'linear-gradient(135deg, #1E4DB7 0%, #0d1f4d 100%)',
    ocean: 'linear-gradient(135deg, #0092D1 0%, #00334d 100%)',
    'navy-ocean': 'linear-gradient(135deg, #1E4DB7 0%, #0092D1 100%)',
    'soft-professional': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  },
  
  // Accent Colors
  blue: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Status Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  info: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    600: '#0284c7',
  },

  // Chart Colors - Professional palette
  chart: {
    1: '#1E4DB7', // Primary Enterprise Navy
    2: '#0092D1', // Ocean Blue
    3: '#22c55e', // Green
    4: '#f59e0b', // Amber
    5: '#ef4444', // Red
    6: '#8b5cf6', // Purple
    7: '#ec4899', // Pink
    8: '#64748b', // Gray
  },
}

export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ],
    mono: [
      '"JetBrains Mono"',
      '"Fira Code"',
      'Consolas',
      'Monaco',
      'monospace'
    ],
  },
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '44px' }],
    '5xl': ['48px', { lineHeight: '56px' }],
    '6xl': ['60px', { lineHeight: '72px' }],
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
}

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
}

export const borderRadius = {
  none: '0px',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Enterprise-specific shadows
  card: '0 4px 6px -1px rgb(30 77 183 / 0.1), 0 2px 4px -2px rgb(30 77 183 / 0.1)',
  cardHover: '0 10px 15px -3px rgb(30 77 183 / 0.15), 0 4px 6px -4px rgb(30 77 183 / 0.15)',
  sidebar: '4px 0 6px -4px rgb(30 77 183 / 0.1)',
  header: '0 4px 6px -1px rgb(30 77 183 / 0.1)',
  'glass-card': '0 8px 32px 0 rgb(30 77 183 / 0.1), 0 2px 8px 0 rgb(30 77 183 / 0.05)',
}

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}

export const enterpriseTheme = {
  colors: enterpriseColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
}

export default enterpriseTheme
