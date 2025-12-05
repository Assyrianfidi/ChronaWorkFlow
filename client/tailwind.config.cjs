/** @type {import('tailwindcss').Config} */
const { enterpriseTheme } = require('./src/design-system/enterprise-theme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Enterprise color palette
      colors: {
        ...enterpriseTheme.colors,
        // Semantic color aliases
        background: enterpriseTheme.colors.gray[50],
        foreground: enterpriseTheme.colors.gray[900],
        card: enterpriseTheme.colors.white,
        'card-foreground': enterpriseTheme.colors.gray[900],
        popover: enterpriseTheme.colors.white,
        'popover-foreground': enterpriseTheme.colors.gray[900],
        primary: enterpriseTheme.colors.primary[600],
        'primary-foreground': enterpriseTheme.colors.white,
        secondary: enterpriseTheme.colors.gray[100],
        'secondary-foreground': enterpriseTheme.colors.gray[900],
        muted: enterpriseTheme.colors.gray[100],
        'muted-foreground': enterpriseTheme.colors.gray[500],
        accent: enterpriseTheme.colors.primary[100],
        'accent-foreground': enterpriseTheme.colors.primary[800],
        destructive: enterpriseTheme.colors.error[600],
        'destructive-foreground': enterpriseTheme.colors.white,
        border: enterpriseTheme.colors.gray[200],
        input: enterpriseTheme.colors.gray[100],
        ring: enterpriseTheme.colors.primary[600],
        
        // Ocean blue accent colors
        ocean: enterpriseTheme.colors.ocean,
        
        // Sidebar specific colors
        sidebar: {
          DEFAULT: enterpriseTheme.colors.gray[900],
          foreground: enterpriseTheme.colors.gray[100],
          primary: enterpriseTheme.colors.primary[500],
          'primary-foreground': enterpriseTheme.colors.white,
          accent: enterpriseTheme.colors.gray[800],
          'accent-foreground': enterpriseTheme.colors.gray[100],
          border: enterpriseTheme.colors.gray[700],
          ring: enterpriseTheme.colors.primary[500],
        }
      },
      
      // Enhanced typography
      fontFamily: enterpriseTheme.typography.fontFamily,
      fontSize: enterpriseTheme.typography.fontSize,
      fontWeight: enterpriseTheme.typography.fontWeight,
      
      // Enhanced spacing
      spacing: enterpriseTheme.spacing,
      
      // Enhanced border radius
      borderRadius: enterpriseTheme.borderRadius,
      
      // Enhanced shadows
      boxShadow: enterpriseTheme.shadows,
      
      // Enhanced animations
      transitionDuration: enterpriseTheme.animation.duration,
      transitionTimingFunction: enterpriseTheme.animation.easing,
      
      // Keyframe animations
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      
      // Enhanced component styles
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Add custom utilities for enterprise components
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme('colors.gray.200')}`,
          boxShadow: theme('boxShadow.glass-card'),
        },
        '.glass-card-dark': {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme('colors.gray.700')}`,
          boxShadow: theme('boxShadow.card'),
        },
        '.enterprise-gradient': {
          background: `linear-gradient(135deg, ${theme('colors.primary.600')} 0%, ${theme('colors.primary.700')} 100%)`,
        },
        '.enterprise-gradient-light': {
          background: `linear-gradient(135deg, ${theme('colors.primary.50')} 0%, ${theme('colors.primary.100')} 100%)`,
        },
        '.navy-gradient': {
          background: theme('colors.gradient.navy'),
        },
        '.ocean-gradient': {
          background: theme('colors.gradient.ocean'),
        },
        '.navy-ocean-gradient': {
          background: theme('colors.gradient.navy-ocean'),
        },
        '.soft-professional-gradient': {
          background: theme('colors.gradient.soft-professional'),
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
