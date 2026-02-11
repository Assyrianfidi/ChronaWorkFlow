/**
 * Theme Switcher Component
 * Allows users to switch between light/dark mode and different theme palettes
 */

import React, { useState } from "react";
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react";
import { useEnhancedTheme } from "@/contexts/EnhancedThemeContext";
import { ThemeMode, ThemeName, themes } from "@/config/themes";

export function ThemeSwitcher() {
  const { mode, themeName, setMode, setThemeName } = useEnhancedTheme();
  const [isOpen, setIsOpen] = useState(false);

  const modeOptions: {
    value: ThemeMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="w-4 h-4" aria-hidden="true" />,
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="w-4 h-4" aria-hidden="true" />,
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  const themeOptions = Object.values(themes).map((theme) => ({
    value: theme.name,
    label: theme.displayName,
  }));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Theme settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Palette className="w-4 h-4 text-textSecondary" aria-hidden="true" />
        <span className="text-sm font-medium text-textPrimary">Theme</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-64 bg-surface rounded-lg shadow-lg border border-border z-50 overflow-hidden"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Mode Selection */}
            <div className="p-3 border-b border-border">
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setMode(option.value);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      mode === option.value
                        ? "bg-primary text-white"
                        : "bg-surfaceHover text-textSecondary hover:bg-surfaceActive"
                    }`}
                    role="menuitemradio"
                    aria-checked={mode === option.value}
                  >
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Palette Selection */}
            <div className="p-3">
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Color Theme
              </label>
              <div className="space-y-1">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setThemeName(option.value as ThemeName);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      themeName === option.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-textPrimary hover:bg-surfaceHover"
                    }`}
                    role="menuitemradio"
                    aria-checked={themeName === option.value}
                  >
                    <span>{option.label}</span>
                    {themeName === option.value && (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for mobile/smaller spaces
export function ThemeSwitcherCompact() {
  const { mode, setMode, toggleMode } = useEnhancedTheme();

  const icons = {
    light: <Sun className="w-5 h-5" aria-hidden="true" />,
    dark: <Moon className="w-5 h-5" aria-hidden="true" />,
    system: <Monitor className="w-5 h-5" aria-hidden="true" />,
  };

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Current theme: ${mode}. Click to cycle through themes.`}
      title="Toggle theme"
    >
      {icons[mode]}
    </button>
  );
}
