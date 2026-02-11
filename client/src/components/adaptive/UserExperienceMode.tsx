declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

export interface UXMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  theme: "light" | "dark" | "auto";
  density: "compact" | "comfortable" | "spacious";
  animations: "minimal" | "normal" | "enhanced";
  accessibility:
    | "standard"
    | "high-contrast"
    | "dyslexia-friendly"
    | "colorblind-safe";
  notifications: "minimal" | "normal" | "detailed";
  shortcuts: boolean;
  tooltips: boolean;
  sounds: boolean;
}

interface UXModeContextType {
  currentMode: UXMode;
  setMode: (mode: UXMode) => void;
  availableModes: UXMode[];
  customSettings: Partial<UXMode>;
  updateCustomSettings: (settings: Partial<UXMode>) => void;
  resetToDefaults: () => void;
}

const UXModeContext = React.createContext<UXModeContextType | null>(null);

const defaultModes: UXMode[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Balanced experience for most users",
    icon: "⚖️",
    theme: "auto",
    density: "comfortable",
    animations: "normal",
    accessibility: "standard",
    notifications: "normal",
    shortcuts: true,
    tooltips: true,
    sounds: false,
  },
  {
    id: "power-user",
    name: "Power User",
    description: "Optimized for efficiency and speed",
    icon: "⚡",
    theme: "dark",
    density: "compact",
    animations: "minimal",
    accessibility: "standard",
    notifications: "minimal",
    shortcuts: true,
    tooltips: false,
    sounds: false,
  },
  {
    id: "accessibility",
    name: "Accessibility",
    description: "Enhanced for users with accessibility needs",
    icon: "♿",
    theme: "auto",
    density: "spacious",
    animations: "minimal",
    accessibility: "high-contrast",
    notifications: "detailed",
    shortcuts: true,
    tooltips: true,
    sounds: true,
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Clean interface for demonstrations",
    icon: "📊",
    theme: "light",
    density: "spacious",
    animations: "enhanced",
    accessibility: "standard",
    notifications: "minimal",
    shortcuts: false,
    tooltips: true,
    sounds: false,
  },
  {
    id: "mobile-optimized",
    name: "Mobile Optimized",
    description: "Touch-friendly interface for mobile devices",
    icon: "📱",
    theme: "auto",
    density: "comfortable",
    animations: "normal",
    accessibility: "standard",
    notifications: "normal",
    shortcuts: false,
    tooltips: true,
    sounds: true,
  },
];

export function UserExperienceModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const [currentMode, setCurrentMode] = useState<UXMode>(defaultModes[0]);
  const [customSettings, setCustomSettings] = useState<Partial<UXMode>>({});

  // Load saved settings from localStorage
  useEffect(() => {
    const savedModeId = localStorage.getItem("ux-mode");
    const savedCustomSettings = localStorage.getItem("ux-custom-settings");

    if (savedModeId) {
      const savedMode = defaultModes.find((mode) => mode.id === savedModeId);
      if (savedMode) {
        setCurrentMode(savedMode);
      }
    }

    if (savedCustomSettings) {
      try {
        const parsed = JSON.parse(savedCustomSettings);
        setCustomSettings(parsed);
      } catch (error) {
        console.error("Failed to parse custom UX settings:", error);
      }
    }
  }, []);

  // Auto-select mode based on user role
  useEffect(() => {
    if (user?.role) {
      const roleBasedMode = getRoleBasedMode(user.role);
      if (roleBasedMode && currentMode.id === "standard") {
        setCurrentMode(roleBasedMode);
      }
    }
  }, [user?.role, currentMode.id]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("ux-mode", currentMode.id);
    if (Object.keys(customSettings).length > 0) {
      localStorage.setItem(
        "ux-custom-settings",
        JSON.stringify(customSettings),
      );
    }
  }, [currentMode, customSettings]);

  const setMode = useCallback((mode: UXMode) => {
    setCurrentMode(mode);
    // Apply mode settings to document
    applyModeSettings(mode);
  }, []);

  const updateCustomSettings = useCallback(
    (settings: Partial<UXMode>) => {
      setCustomSettings((prev) => ({ ...prev, ...settings }));
      const updatedMode = { ...currentMode, ...settings };
      applyModeSettings(updatedMode);
    },
    [currentMode],
  );

  const resetToDefaults = useCallback(() => {
    setCustomSettings({});
    setMode(defaultModes[0]);
  }, [setMode]);

  const contextValue: UXModeContextType = {
    currentMode,
    setMode,
    availableModes: defaultModes,
    customSettings,
    updateCustomSettings,
    resetToDefaults,
  };

  return (
    <UXModeContext.Provider value={contextValue}>
      {children}
    </UXModeContext.Provider>
  );
}

function getRoleBasedMode(role: string): UXMode | null {
  switch (role) {
    case "admin":
      return defaultModes.find((mode) => mode.id === "power-user") || null;
    case "viewer":
      return defaultModes.find((mode) => mode.id === "presentation") || null;
    case "auditor":
      return defaultModes.find((mode) => mode.id === "accessibility") || null;
    default:
      return null;
  }
}

function applyModeSettings(mode: UXMode) {
  const root = document.documentElement;

  // Apply theme
  if (mode.theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else if (mode.theme === "dark") {
    root.classList.remove("light");
    root.classList.add("dark");
  } else {
    // Auto - respect system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.toggle("light", !prefersDark);
  }

  // Apply density
  root.classList.remove(
    "density-compact",
    "density-comfortable",
    "density-spacious",
  );
  root.classList.add(`density-${mode.density}`);

  // Apply animations
  root.classList.remove(
    "animations-minimal",
    "animations-normal",
    "animations-enhanced",
  );
  root.classList.add(`animations-${mode.animations}`);

  // Apply accessibility
  root.classList.remove(
    "accessibility-standard",
    "accessibility-high-contrast",
    "accessibility-dyslexia-friendly",
    "accessibility-colorblind-safe",
  );
  root.classList.add(`accessibility-${mode.accessibility}`);

  // Apply notifications level
  root.setAttribute("data-notifications", mode.notifications);
  root.setAttribute("data-shortcuts", mode.shortcuts.toString());
  root.setAttribute("data-tooltips", mode.tooltips.toString());
  root.setAttribute("data-sounds", mode.sounds.toString());
}

export function useUserExperienceMode() {
  const context = React.useContext(UXModeContext);
  if (!context) {
    throw new Error(
      "useUserExperienceMode must be used within UserExperienceModeProvider",
    );
  }
  return context;
}

// UX Mode Selector Component
export function UXModeSelector() {
  const { currentMode, setMode, availableModes } = useUserExperienceMode();

  return (
    <div className="ux-mode-selector p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        User Experience Mode
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setMode(mode)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-200 text-left",
              currentMode.id === mode.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{mode.icon}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {mode.name}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Custom Settings Component
export function UXCustomSettings() {
  const { customSettings, updateCustomSettings, resetToDefaults } =
    useUserExperienceMode();

  return (
    <div className="ux-custom-settings p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Custom Settings
        </h3>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {/* Theme Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Theme
          </label>
          <select
            value={customSettings.theme || "auto"}
            onChange={(e) =>
              updateCustomSettings({ theme: e.target.value as UXMode["theme"] })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Density Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Interface Density
          </label>
          <select
            value={customSettings.density || "comfortable"}
            onChange={(e) =>
              updateCustomSettings({
                density: e.target.value as UXMode["density"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>

        {/* Animations Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Animations
          </label>
          <select
            value={customSettings.animations || "normal"}
            onChange={(e) =>
              updateCustomSettings({
                animations: e.target.value as UXMode["animations"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="minimal">Minimal</option>
            <option value="normal">Normal</option>
            <option value="enhanced">Enhanced</option>
          </select>
        </div>

        {/* Accessibility Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Accessibility Mode
          </label>
          <select
            value={customSettings.accessibility || "standard"}
            onChange={(e) =>
              updateCustomSettings({
                accessibility: e.target.value as UXMode["accessibility"],
              })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="standard">Standard</option>
            <option value="high-contrast">High Contrast</option>
            <option value="dyslexia-friendly">Dyslexia Friendly</option>
            <option value="colorblind-safe">Colorblind Safe</option>
          </select>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <label htmlFor="input-r0qrt6ce7" className="sr-only">
              Checkbox
            </label>
            <input
              id="input-r0qrt6ce7"
              type="checkbox"
              checked={customSettings.shortcuts ?? true}
              onChange={(e) =>
                updateCustomSettings({ shortcuts: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable Keyboard Shortcuts
            </span>
          </label>

          <label className="flex items-center gap-2">
            <label htmlFor="input-75i6bcdyx" className="sr-only">
              Checkbox
            </label>
            <input
              id="input-75i6bcdyx"
              type="checkbox"
              checked={customSettings.tooltips ?? true}
              onChange={(e) =>
                updateCustomSettings({ tooltips: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show Tooltips
            </span>
          </label>

          <label className="flex items-center gap-2">
            <label htmlFor="input-5i9j6cir2" className="sr-only">
              Checkbox
            </label>
            <input
              id="input-5i9j6cir2"
              type="checkbox"
              checked={customSettings.sounds ?? false}
              onChange={(e) =>
                updateCustomSettings({ sounds: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable Sound Effects
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default UserExperienceModeProvider;
