/**
 * ChronaWorkFlow Design System
 * CEO-Level SaaS UI Standards
 * 
 * This file defines the consistent design tokens used across the entire application.
 * All components should reference these constants to maintain visual consistency.
 */

export const designSystem = {
  // Color Palette
  colors: {
    // Backgrounds
    background: 'bg-gray-50',
    cardBackground: 'bg-white',
    
    // Primary Brand Colors
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryTextHover: 'hover:text-blue-700',
    
    // Text Colors (High Contrast)
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-600',
    textLight: 'text-gray-500',
    
    // Interactive States
    error: 'text-red-600',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-300',
    success: 'text-green-600',
    successBg: 'bg-green-50',
    warning: 'text-yellow-600',
    
    // Borders
    border: 'border-gray-200',
    borderDark: 'border-gray-300',
    borderFocus: 'border-blue-500',
  },
  
  // Typography
  typography: {
    // Headings
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-semibold text-gray-900',
    h3: 'text-xl font-semibold text-gray-900',
    h4: 'text-lg font-semibold text-gray-900',
    
    // Body Text
    body: 'text-base text-gray-900',
    bodySecondary: 'text-base text-gray-700',
    small: 'text-sm text-gray-600',
    tiny: 'text-xs text-gray-500',
    
    // Labels
    label: 'text-sm font-medium text-gray-700',
    labelRequired: 'text-sm font-medium text-gray-700 after:content-["*"] after:ml-0.5 after:text-red-500',
  },
  
  // Spacing
  spacing: {
    cardPadding: 'p-8',
    cardPaddingMobile: 'p-6',
    sectionSpacing: 'space-y-6',
    formSpacing: 'space-y-4',
    tightSpacing: 'space-y-2',
    marginBottom: 'mb-6',
  },
  
  // Components
  components: {
    // Buttons
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
      outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
      disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
    },
    
    // Input Fields
    input: {
      base: 'w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
      error: 'w-full bg-white border border-red-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
      disabled: 'w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed',
    },
    
    // Cards
    card: {
      base: 'bg-white rounded-xl shadow-lg border border-gray-200',
      hover: 'bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200',
      flat: 'bg-white rounded-lg border border-gray-200',
    },
    
    // Containers
    container: {
      page: 'min-h-screen bg-gray-50',
      centered: 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12',
      content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    },
    
    // Links
    link: {
      primary: 'text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200',
      secondary: 'text-gray-600 hover:text-gray-900 transition-colors duration-200',
      underline: 'text-blue-600 hover:text-blue-700 underline font-medium transition-colors duration-200',
    },
    
    // Alerts
    alert: {
      error: 'bg-red-50 border border-red-300 rounded-lg p-4 text-red-800',
      success: 'bg-green-50 border border-green-300 rounded-lg p-4 text-green-800',
      warning: 'bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800',
      info: 'bg-blue-50 border border-blue-300 rounded-lg p-4 text-blue-800',
    },
  },
  
  // Responsive Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
} as const;

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
