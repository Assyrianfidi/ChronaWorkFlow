/** @type {import('tailwindcss').Config} */
const { enterpriseTheme } = require("./src/design-system/enterprise-theme");
const tokens = require("./src/design-system/tokens.json");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },

      // Global defaults for flattened enterprise theme
      textColor: {
        DEFAULT: "#000000",
      },
      backgroundColor: {
        DEFAULT: "#FFFFFF",
      },
    },
    extend: {
      // Enterprise color palette with new tokens
      colors: {
        ...enterpriseTheme.colors,
        // Design token colors
        primary: "var(--primary-500)",
        accent: tokens.colors.accent,
        danger: tokens.colors.danger,
        muted: "var(--surface-2)",
        bgGradientStart: "var(--bg-gradient-start)",
        bgGradientEnd: "var(--bg-gradient-end)",
        glass: "var(--glass-bg)",
        success: {
          DEFAULT: tokens.colors.success,
          700: "var(--success-700)",
        },
        warning: {
          DEFAULT: tokens.colors.warning,
          700: "var(--warning-700)",
        },
        error: tokens.colors.error,
        info: tokens.colors.info,
        "hero-dark": tokens.colors.heroDark,
        "text-dark": "var(--text-default)",
        "text-light": "var(--text-inverse)",
        "border-light": tokens.colors.borderLight,
        "border-gray": "var(--border-gray)",
        // Semantic color aliases
        background: "var(--surface-1)",
        foreground: "var(--text-default)",
        card: "var(--surface-1)",
        "card-foreground": "var(--text-default)",
        popover: "var(--surface-1)",
        "popover-foreground": "var(--text-default)",
        "primary-foreground": "var(--text-inverse)",
        secondary: "var(--surface-2)",
        "secondary-foreground": "var(--text-default)",
        "muted-foreground": "var(--text-muted)",
        "accent-foreground": "#020617",
        destructive: {
          DEFAULT: tokens.colors.danger,
          500: tokens.colors.error,
        },
        "destructive-foreground": "var(--text-inverse)",
        border: "var(--border-gray)",
        input: "var(--border-gray)",
        ring: tokens.colors.accent,

        // Ocean blue accent colors
        ocean: enterpriseTheme.colors.ocean,

        // Sidebar specific colors
        sidebar: {
          DEFAULT: tokens.colors.heroDark,
          foreground: "var(--text-inverse)",
          primary: "var(--primary-500)",
          "primary-foreground": "var(--text-inverse)",
          accent: "var(--surface-2)",
          "accent-foreground": "var(--text-inverse)",
          border: tokens.colors.borderLight,
          ring: "var(--primary-500)",
        },

        // Enterprise surface and text tokens from CSS variables
        surface0: "var(--surface-0)",
        surface1: "var(--surface-1)",
        surface2: "var(--surface-2)",
        "primary-500": "var(--primary-500)",
        "primary-600": "var(--primary-600)",
        "text-default": "var(--text-default)",
        "text-muted": "var(--text-muted)",
      },

      variants: tokens.variants,

      // Design token spacing
      spacing: {
        ...Object.fromEntries(
          Object.entries(tokens.spacing).map(([key, value]) => [
            key,
            value.replace("px", ""),
          ]),
        ),
      },

      // Design token radii
      borderRadius: {
        ...tokens.radii,
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },

      // Design token shadows
      boxShadow: {
        ...tokens.shadows,
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)",
        strong: tokens.shadows.strong,
      },

      // Design token fonts
      fontFamily: {
        sans: tokens.font.family,
      },
      fontSize: {
        ...Object.fromEntries(
          Object.entries(tokens.font.sizes).map(([key, value]) => [
            key,
            [value.replace("px", ""), { lineHeight: tokens.lineHeight.normal }],
          ]),
        ),
      },
      fontWeight: {
        ...tokens.font.weights,
      },

      // Custom utilities for variants
      backdropBlur: {
        md: "12px",
      },

      // Animation keyframes
      keyframes: {
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },

      animation: {
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.5s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add custom utilities for enterprise components
    function ({ addUtilities, theme }) {
      const newUtilities = {
        ".glass-card": {
          background: theme("colors.glass"),
          backdropFilter: "blur(12px)",
          border: `1px solid ${theme("colors.border-light")}`,
          boxShadow: theme("boxShadow.soft"),
        },
        ".glass-card-dark": {
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${theme("colors.border-light")}`,
          boxShadow: theme("boxShadow.elevated"),
        },
        ".enterprise-gradient": {
          background: `linear-gradient(135deg, ${theme("colors.primary")} 0%, ${theme("colors.hero-dark")} 100%)`,
        },
        ".enterprise-gradient-light": {
          background: `linear-gradient(135deg, ${theme("colors.bgGradientStart")} 0%, ${theme("colors.bgGradientEnd")} 100%)`,
        },
        ".soft-professional-gradient": {
          background: `linear-gradient(135deg, ${theme("colors.bgGradientStart")} 0%, ${theme("colors.bgGradientEnd")} 100%)`,
        },
        ".hero-gradient": {
          background: theme("colors.hero-dark"),
        },
        ".variant-glass": {
          background: theme("variants.glass.bg"),
          backdropFilter: theme("variants.glass.backdrop"),
          border: `1px solid ${theme("variants.glass.border")}`,
        },
        ".variant-minimal": {
          background: theme("variants.minimal.bg"),
          border: `1px solid ${theme("variants.minimal.border")}`,
          boxShadow: theme("variants.minimal.shadow"),
        },
        ".variant-bold-card": {
          background: theme("variants.bold.cardBg"),
          borderTop: `4px solid ${theme("variants.bold.accentBorder")}`,
          boxShadow: theme("variants.bold.cardShadow"),
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
